import { Injectable } from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CategorySalesBreakdownDto,
  OrderStatusBreakdownDto,
  PaginatedSalesOrdersResponseDto,
  PaymentMethodBreakdownDto,
  QuerySalesReportDto,
  SalesOrderRecordDto,
  SalesSummaryResponseDto,
  SalesTimelinePointDto,
  SalesTimelineResponseDto,
  TopSellingProductDto,
} from './dto/index.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to construct Prisma where criteria from query filters
   */
  private buildWhereClause(query: QuerySalesReportDto): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    // Date range filter
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Status filters
    if (query.orderStatus) {
      where.orderStatus = query.orderStatus;
    }
    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    // Payment method filter
    if (query.paymentMethod) {
      where.payments = {
        some: {
          method: query.paymentMethod,
        },
      };
    }

    // Search filter across orderNumber, customer name, phone, or email
    if (query.search && query.search.trim() !== '') {
      const term = query.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { recipientName: { contains: term, mode: 'insensitive' } },
        { recipientPhone: { contains: term, mode: 'insensitive' } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  /**
   * Retrieves overall aggregated sales KPIs for the filtered period
   */
  async getSalesSummary(
    query: QuerySalesReportDto,
  ): Promise<SalesSummaryResponseDto> {
    const where = this.buildWhereClause(query);

    // Fetch store currency setting
    const currencySetting = await this.prisma.storeSetting.findUnique({
      where: { key: 'store_currency' },
    });
    const currency = currencySetting?.value || 'BDT';

    // Fetch matching orders with minimal needed fields
    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        grandTotal: true,
        subtotal: true,
        discountAmount: true,
        shippingFee: true,
        orderStatus: true,
        paymentStatus: true,
        refunds: {
          select: {
            amount: true,
            status: true,
          },
        },
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });

    let grossSales = 0;
    let totalDiscounts = 0;
    let totalShipping = 0;
    let totalRefunds = 0;
    let totalItemsSold = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;
    let deliveredOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let returnedOrdersCount = 0;

    for (const order of orders) {
      grossSales += Number(order.grandTotal || 0);
      totalDiscounts += Number(order.discountAmount || 0);
      totalShipping += Number(order.shippingFee || 0);

      if (order.paymentStatus === PaymentStatus.PAID) {
        paidOrdersCount++;
      }
      if (order.orderStatus === OrderStatus.PENDING) {
        pendingOrdersCount++;
      }
      if (order.orderStatus === OrderStatus.DELIVERED) {
        deliveredOrdersCount++;
      }
      if (order.orderStatus === OrderStatus.CANCELLED) {
        cancelledOrdersCount++;
      }
      if (order.orderStatus === OrderStatus.RETURNED) {
        returnedOrdersCount++;
      }

      for (const ref of order.refunds || []) {
        if (ref.status === 'COMPLETED') {
          totalRefunds += Number(ref.amount || 0);
        }
      }

      for (const item of order.items || []) {
        totalItemsSold += item.quantity || 0;
      }
    }

    const totalOrders = orders.length;
    const netSales = Math.max(0, grossSales - totalRefunds);
    const averageOrderValue =
      totalOrders > 0
        ? Math.round((grossSales / totalOrders) * 100) / 100
        : 0;

    return {
      grossSales: Math.round(grossSales * 100) / 100,
      netSales: Math.round(netSales * 100) / 100,
      totalOrders,
      paidOrdersCount,
      pendingOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      returnedOrdersCount,
      totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      totalShipping: Math.round(totalShipping * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      totalItemsSold,
      averageOrderValue,
      currency,
      startDate: query.startDate,
      endDate: query.endDate,
    };
  }

  /**
   * Retrieves aggregated timeline points for graphing revenue trends
   */
  async getSalesTimeline(
    query: QuerySalesReportDto,
  ): Promise<SalesTimelineResponseDto> {
    const where = this.buildWhereClause(query);
    const interval = query.interval || 'day';

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        grandTotal: true,
        discountAmount: true,
        shippingFee: true,
        paymentStatus: true,
        refunds: {
          select: {
            amount: true,
            status: true,
          },
        },
        items: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const bucketMap = new Map<
      string,
      {
        date: string;
        label: string;
        orderCount: number;
        paidOrderCount: number;
        grossSales: number;
        netSales: number;
        discounts: number;
        shipping: number;
        refunds: number;
        itemsSold: number;
      }
    >();

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    for (const order of orders) {
      const d = new Date(order.createdAt);
      let key = '';
      let label = '';

      if (interval === 'month') {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        key = `${y}-${m}`;
        label = `${monthNames[d.getMonth()]} ${y}`;
      } else if (interval === 'week') {
        // Monday-based week bucket
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const y = monday.getFullYear();
        const m = String(monday.getMonth() + 1).padStart(2, '0');
        const dt = String(monday.getDate()).padStart(2, '0');
        key = `${y}-${m}-${dt}`;
        label = `Week of ${monthNames[monday.getMonth()]} ${monday.getDate()}, ${y}`;
      } else {
        // Daily bucket
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        key = `${y}-${m}-${dt}`;
        label = `${monthNames[d.getMonth()]} ${d.getDate()}, ${y}`;
      }

      let bucket = bucketMap.get(key);
      if (!bucket) {
        bucket = {
          date: key,
          label,
          orderCount: 0,
          paidOrderCount: 0,
          grossSales: 0,
          netSales: 0,
          discounts: 0,
          shipping: 0,
          refunds: 0,
          itemsSold: 0,
        };
        bucketMap.set(key, bucket);
      }

      bucket.orderCount++;
      if (order.paymentStatus === PaymentStatus.PAID) {
        bucket.paidOrderCount++;
      }

      const orderGross = Number(order.grandTotal || 0);
      bucket.grossSales += orderGross;
      bucket.discounts += Number(order.discountAmount || 0);
      bucket.shipping += Number(order.shippingFee || 0);

      let orderRefunds = 0;
      for (const ref of order.refunds || []) {
        if (ref.status === 'COMPLETED') {
          orderRefunds += Number(ref.amount || 0);
        }
      }
      bucket.refunds += orderRefunds;
      bucket.netSales += Math.max(0, orderGross - orderRefunds);

      for (const item of order.items || []) {
        bucket.itemsSold += item.quantity || 0;
      }
    }

    // Convert map to sorted array
    const timeline: SalesTimelinePointDto[] = Array.from(bucketMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((b) => ({
        date: b.date,
        label: b.label,
        orderCount: b.orderCount,
        paidOrderCount: b.paidOrderCount,
        grossSales: Math.round(b.grossSales * 100) / 100,
        netSales: Math.round(b.netSales * 100) / 100,
        discounts: Math.round(b.discounts * 100) / 100,
        shipping: Math.round(b.shipping * 100) / 100,
        refunds: Math.round(b.refunds * 100) / 100,
        itemsSold: b.itemsSold,
      }));

    return {
      timeline,
      interval,
    };
  }

  /**
   * Retrieves sales grouped by Payment Method
   */
  async getSalesByPaymentMethod(
    query: QuerySalesReportDto,
  ): Promise<PaymentMethodBreakdownDto[]> {
    const where = this.buildWhereClause(query);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        grandTotal: true,
        payments: {
          select: {
            method: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const counts: Record<PaymentMethod, { count: number; total: number }> = {
      [PaymentMethod.CASH_ON_DELIVERY]: { count: 0, total: 0 },
      [PaymentMethod.CREDIT_CARD]: { count: 0, total: 0 },
      [PaymentMethod.MOBILE_BANKING]: { count: 0, total: 0 },
    };

    let overallTotal = 0;

    for (const order of orders) {
      const method =
        order.payments?.[0]?.method || PaymentMethod.CASH_ON_DELIVERY;
      const amount = Number(order.grandTotal || 0);
      counts[method].count++;
      counts[method].total += amount;
      overallTotal += amount;
    }

    const result: PaymentMethodBreakdownDto[] = Object.entries(counts).map(
      ([method, data]) => {
        const percentage =
          overallTotal > 0
            ? Math.round((data.total / overallTotal) * 1000) / 10
            : 0;
        return {
          method: method as PaymentMethod,
          orderCount: data.count,
          totalAmount: Math.round(data.total * 100) / 100,
          percentage,
        };
      },
    );

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Retrieves sales grouped by Order Status
   */
  async getSalesByOrderStatus(
    query: QuerySalesReportDto,
  ): Promise<OrderStatusBreakdownDto[]> {
    const where = this.buildWhereClause(query);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        orderStatus: true,
        grandTotal: true,
      },
    });

    const map = new Map<OrderStatus, { count: number; total: number }>();
    for (const status of Object.values(OrderStatus)) {
      map.set(status, { count: 0, total: 0 });
    }

    let totalOrders = 0;

    for (const order of orders) {
      const entry = map.get(order.orderStatus);
      if (entry) {
        entry.count++;
        entry.total += Number(order.grandTotal || 0);
      }
      totalOrders++;
    }

    const result: OrderStatusBreakdownDto[] = Array.from(map.entries())
      .map(([status, val]) => {
        const percentage =
          totalOrders > 0
            ? Math.round((val.count / totalOrders) * 1000) / 10
            : 0;
        return {
          status,
          orderCount: val.count,
          totalAmount: Math.round(val.total * 100) / 100,
          percentage,
        };
      })
      .filter((item) => item.orderCount > 0 || totalOrders === 0);

    return result.sort((a, b) => b.orderCount - a.orderCount);
  }

  /**
   * Retrieves top selling products by units and revenue within period
   */
  async getTopSellingProducts(
    query: QuerySalesReportDto,
    limit = 10,
  ): Promise<TopSellingProductDto[]> {
    const where = this.buildWhereClause(query);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: where,
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            image: true,
          },
        },
      },
    });

    const productMap = new Map<
      string,
      {
        variantId: string | null;
        productId: string | null;
        productTitle: string;
        sku: string;
        categoryName: string;
        thumbnailUrl: string | null;
        quantitySold: number;
        totalRevenue: number;
      }
    >();

    for (const item of orderItems) {
      const key = item.sku || item.productTitle;
      let agg = productMap.get(key);
      if (!agg) {
        const catName =
          item.variant?.product?.category?.name || 'Uncategorized';
        const thumb =
          item.variant?.imageUrl ||
          item.variant?.image?.imageUrl ||
          item.variant?.product?.thumbnailUrl ||
          null;

        agg = {
          variantId: item.variantId,
          productId: item.variant?.productId || null,
          productTitle: item.productTitle,
          sku: item.sku,
          categoryName: catName,
          thumbnailUrl: thumb,
          quantitySold: 0,
          totalRevenue: 0,
        };
        productMap.set(key, agg);
      }

      agg.quantitySold += item.quantity || 0;
      agg.totalRevenue += Number(item.totalPrice || 0);
    }

    const result: TopSellingProductDto[] = Array.from(productMap.values())
      .map((p) => ({
        ...p,
        totalRevenue: Math.round(p.totalRevenue * 100) / 100,
        averagePrice:
          p.quantitySold > 0
            ? Math.round((p.totalRevenue / p.quantitySold) * 100) / 100
            : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return result;
  }

  /**
   * Retrieves category sales contribution breakdown
   */
  async getSalesByCategory(
    query: QuerySalesReportDto,
  ): Promise<CategorySalesBreakdownDto[]> {
    const where = this.buildWhereClause(query);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: where,
      },
      include: {
        order: {
          select: { id: true },
        },
        variant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        orderIds: Set<string>;
        quantitySold: number;
        totalRevenue: number;
      }
    >();

    let grandTotalRevenue = 0;

    for (const item of orderItems) {
      const category = item.variant?.product?.category;
      const catId = category?.id || 'uncategorized';
      const catName = category?.name || 'General';

      let agg = categoryMap.get(catId);
      if (!agg) {
        agg = {
          categoryId: catId,
          categoryName: catName,
          orderIds: new Set<string>(),
          quantitySold: 0,
          totalRevenue: 0,
        };
        categoryMap.set(catId, agg);
      }

      if (item.order?.id) {
        agg.orderIds.add(item.order.id);
      }
      agg.quantitySold += item.quantity || 0;
      const lineTotal = Number(item.totalPrice || 0);
      agg.totalRevenue += lineTotal;
      grandTotalRevenue += lineTotal;
    }

    const result: CategorySalesBreakdownDto[] = Array.from(
      categoryMap.values(),
    ).map((cat) => {
      const percentage =
        grandTotalRevenue > 0
          ? Math.round((cat.totalRevenue / grandTotalRevenue) * 1000) / 10
          : 0;

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        orderCount: cat.orderIds.size,
        quantitySold: cat.quantitySold,
        totalRevenue: Math.round(cat.totalRevenue * 100) / 100,
        percentage,
      };
    });

    return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Retrieves paginated transactional sales orders with financial breakdown
   */
  async getSalesOrders(
    query: QuerySalesReportDto,
  ): Promise<PaginatedSalesOrdersResponseDto> {
    const where = this.buildWhereClause(query);
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 15));
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
          payments: {
            select: { method: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          refunds: {
            where: { status: 'COMPLETED' },
            select: { amount: true },
          },
          items: {
            select: {
              id: true,
              productTitle: true,
              sku: true,
              variantAttributes: true,
              unitPrice: true,
              quantity: true,
              totalPrice: true,
            },
          },
        },
      }),
    ]);

    const items: SalesOrderRecordDto[] = orders.map((order) => {
      let refundAmount = 0;
      for (const ref of order.refunds || []) {
        refundAmount += Number(ref.amount || 0);
      }

      const grandTotal = Number(order.grandTotal || 0);
      const subtotal = Number(order.subtotal || 0);
      const discountAmount = Number(order.discountAmount || 0);
      const shippingFee = Number(order.shippingFee || 0);
      const netAmount = Math.max(0, grandTotal - refundAmount);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.recipientName || order.user?.name || 'Guest',
        customerEmail: order.user?.email || 'N/A',
        recipientPhone: order.recipientPhone,
        createdAt: order.createdAt.toISOString(),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        shipmentStatus: order.shipmentStatus,
        paymentMethod:
          order.payments?.[0]?.method || PaymentMethod.CASH_ON_DELIVERY,
        itemsCount: (order.items || []).reduce(
          (sum, it) => sum + it.quantity,
          0,
        ),
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        shippingFee: Math.round(shippingFee * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        refundAmount: Math.round(refundAmount * 100) / 100,
        netAmount: Math.round(netAmount * 100) / 100,
        items: (order.items || []).map((it) => ({
          id: it.id,
          productTitle: it.productTitle,
          sku: it.sku,
          variantAttributes: it.variantAttributes,
          unitPrice: Number(it.unitPrice),
          quantity: it.quantity,
          totalPrice: Number(it.totalPrice),
        })),
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Generates formatted CSV string of sales orders for instant export
   */
  async exportSalesCsv(query: QuerySalesReportDto): Promise<string> {
    const where = this.buildWhereClause(query);

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000, // Export safety cap
      include: {
        user: { select: { name: true, email: true } },
        payments: {
          select: { method: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        refunds: {
          where: { status: 'COMPLETED' },
          select: { amount: true },
        },
        items: { select: { quantity: true } },
      },
    });

    const headers = [
      'Order Number',
      'Order Date',
      'Customer Name',
      'Customer Email',
      'Contact Phone',
      'Order Status',
      'Payment Status',
      'Shipment Status',
      'Payment Method',
      'Items Count',
      'Subtotal',
      'Discount',
      'Shipping Fee',
      'Grand Total',
      'Refund Amount',
      'Net Revenue',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows: string[] = [headers.join(',')];

    for (const order of orders) {
      let refundAmount = 0;
      for (const r of order.refunds || []) {
        refundAmount += Number(r.amount || 0);
      }

      const grandTotal = Number(order.grandTotal || 0);
      const subtotal = Number(order.subtotal || 0);
      const discount = Number(order.discountAmount || 0);
      const shipping = Number(order.shippingFee || 0);
      const net = Math.max(0, grandTotal - refundAmount);
      const itemsCount = (order.items || []).reduce(
        (acc, it) => acc + it.quantity,
        0,
      );

      const row = [
        escapeCsv(order.orderNumber),
        escapeCsv(order.createdAt.toISOString().slice(0, 19).replace('T', ' ')),
        escapeCsv(order.recipientName || order.user?.name || 'Customer'),
        escapeCsv(order.user?.email || ''),
        escapeCsv(order.recipientPhone),
        escapeCsv(order.orderStatus),
        escapeCsv(order.paymentStatus),
        escapeCsv(order.shipmentStatus),
        escapeCsv(order.payments?.[0]?.method || PaymentMethod.CASH_ON_DELIVERY),
        escapeCsv(itemsCount),
        escapeCsv(subtotal.toFixed(2)),
        escapeCsv(discount.toFixed(2)),
        escapeCsv(shipping.toFixed(2)),
        escapeCsv(grandTotal.toFixed(2)),
        escapeCsv(refundAmount.toFixed(2)),
        escapeCsv(net.toFixed(2)),
      ];

      rows.push(row.join(','));
    }

    return rows.join('\r\n');
  }
}
