import { Injectable } from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
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
  QueryOrdersReportDto,
  OrdersSummaryResponseDto,
  OrdersTimelineResponseDto,
  OrdersTimelinePointDto,
  OrderStatusMetricDto,
  ShipmentStatusMetricDto,
  PaymentStatusMetricDto,
  ShippingCityMetricDto,
  ShippingMethodMetricDto,
  OrdersReportListResponseDto,
  OrdersReportRecordDto,
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

  // =========================================================================
  // ORDERS REPORT METHODS
  // =========================================================================

  /**
   * Helper to construct Prisma where criteria from orders query filters
   */
  private buildOrdersWhereClause(
    query: QueryOrdersReportDto,
  ): Prisma.OrderWhereInput {
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
    if (query.shipmentStatus) {
      where.shipmentStatus = query.shipmentStatus;
    }

    // Destination city filter
    if (query.city && query.city.trim() !== '') {
      where.shippingCity = {
        contains: query.city.trim(),
        mode: 'insensitive',
      };
    }

    // Payment method filter
    if (query.paymentMethod) {
      where.payments = {
        some: {
          method: query.paymentMethod,
        },
      };
    }

    // Search filter across orderNumber, recipient name, phone, city, or user details
    if (query.search && query.search.trim() !== '') {
      const term = query.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { recipientName: { contains: term, mode: 'insensitive' } },
        { recipientPhone: { contains: term, mode: 'insensitive' } },
        { shippingCity: { contains: term, mode: 'insensitive' } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  /**
   * Retrieves high-level Order KPIs (volume, fulfillment, status rates, basket size)
   */
  async getOrdersSummary(
    query: QueryOrdersReportDto,
  ): Promise<OrdersSummaryResponseDto> {
    const where = this.buildOrdersWhereClause(query);

    const currencySetting = await this.prisma.storeSetting.findUnique({
      where: { key: 'store_currency' },
    });
    const currency = currencySetting?.value || 'BDT';

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        grandTotal: true,
        orderStatus: true,
        paymentStatus: true,
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });

    let totalOrderValue = 0;
    let totalItemsOrdered = 0;
    let pendingOrdersCount = 0;
    let confirmedOrdersCount = 0;
    let processingOrdersCount = 0;
    let shippedOrdersCount = 0;
    let deliveredOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let returnedOrdersCount = 0;

    let paidOrdersCount = 0;
    let pendingPaymentCount = 0;
    let failedPaymentCount = 0;
    let refundedOrdersCount = 0;

    for (const order of orders) {
      totalOrderValue += Number(order.grandTotal || 0);

      switch (order.orderStatus) {
        case OrderStatus.PENDING:
          pendingOrdersCount++;
          break;
        case OrderStatus.CONFIRMED:
          confirmedOrdersCount++;
          break;
        case OrderStatus.PROCESSING:
          processingOrdersCount++;
          break;
        case OrderStatus.SHIPPED:
          shippedOrdersCount++;
          break;
        case OrderStatus.DELIVERED:
          deliveredOrdersCount++;
          break;
        case OrderStatus.CANCELLED:
          cancelledOrdersCount++;
          break;
        case OrderStatus.RETURNED:
          returnedOrdersCount++;
          break;
      }

      switch (order.paymentStatus) {
        case PaymentStatus.PAID:
          paidOrdersCount++;
          break;
        case PaymentStatus.PENDING:
          pendingPaymentCount++;
          break;
        case PaymentStatus.FAILED:
          failedPaymentCount++;
          break;
        case PaymentStatus.REFUNDED:
          refundedOrdersCount++;
          break;
      }

      for (const item of order.items || []) {
        totalItemsOrdered += item.quantity || 0;
      }
    }

    const totalOrders = orders.length;
    const averageOrderValue =
      totalOrders > 0
        ? Math.round((totalOrderValue / totalOrders) * 100) / 100
        : 0;
    const averageItemsPerOrder =
      totalOrders > 0
        ? Math.round((totalItemsOrdered / totalOrders) * 100) / 100
        : 0;
    const fulfillmentRate =
      totalOrders > 0
        ? Math.round((deliveredOrdersCount / totalOrders) * 10000) / 100
        : 0;
    const cancellationRate =
      totalOrders > 0
        ? Math.round((cancelledOrdersCount / totalOrders) * 10000) / 100
        : 0;
    const returnRate =
      totalOrders > 0
        ? Math.round((returnedOrdersCount / totalOrders) * 10000) / 100
        : 0;

    return {
      totalOrders,
      totalOrderValue: Math.round(totalOrderValue * 100) / 100,
      averageOrderValue,
      totalItemsOrdered,
      averageItemsPerOrder,
      pendingOrdersCount,
      confirmedOrdersCount,
      processingOrdersCount,
      shippedOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      returnedOrdersCount,
      fulfillmentRate,
      cancellationRate,
      returnRate,
      paidOrdersCount,
      pendingPaymentCount,
      failedPaymentCount,
      refundedOrdersCount,
      currency,
      startDate: query.startDate,
      endDate: query.endDate,
    };
  }

  /**
   * Retrieves aggregated chronological timeline points for orders volume & delivery trend
   */
  async getOrdersTimeline(
    query: QueryOrdersReportDto,
  ): Promise<OrdersTimelineResponseDto> {
    const where = this.buildOrdersWhereClause(query);
    const interval = query.interval || 'day';

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        grandTotal: true,
        orderStatus: true,
        items: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const bucketMap = new Map<string, OrdersTimelinePointDto>();

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
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(d);
        mon.setDate(diff);
        const y = mon.getFullYear();
        const m = String(mon.getMonth() + 1).padStart(2, '0');
        const dt = String(mon.getDate()).padStart(2, '0');
        key = `${y}-W${m}-${dt}`;
        label = `Wk ${dt} ${monthNames[mon.getMonth()]}`;
      } else {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        key = `${y}-${m}-${dt}`;
        label = `${monthNames[d.getMonth()]} ${dt}, ${y}`;
      }

      if (!bucketMap.has(key)) {
        bucketMap.set(key, {
          date: key,
          label,
          totalOrders: 0,
          deliveredOrders: 0,
          processingOrders: 0,
          cancelledOrders: 0,
          returnedOrders: 0,
          totalValue: 0,
          itemsCount: 0,
        });
      }

      const point = bucketMap.get(key)!;
      point.totalOrders++;
      point.totalValue += Number(order.grandTotal || 0);

      if (order.orderStatus === OrderStatus.DELIVERED) {
        point.deliveredOrders++;
      } else if (order.orderStatus === OrderStatus.CANCELLED) {
        point.cancelledOrders++;
      } else if (order.orderStatus === OrderStatus.RETURNED) {
        point.returnedOrders++;
      } else if (
        order.orderStatus === OrderStatus.CONFIRMED ||
        order.orderStatus === OrderStatus.PROCESSING ||
        order.orderStatus === OrderStatus.SHIPPED
      ) {
        point.processingOrders++;
      }

      for (const item of order.items || []) {
        point.itemsCount += item.quantity || 0;
      }
    }

    const timeline = Array.from(bucketMap.values()).map((p) => ({
      ...p,
      totalValue: Math.round(p.totalValue * 100) / 100,
    }));

    return {
      timeline,
      interval,
    };
  }

  /**
   * Retrieves order volume and monetary breakdown by OrderStatus
   */
  async getOrdersByStatus(
    query: QueryOrdersReportDto,
  ): Promise<OrderStatusMetricDto[]> {
    const where = this.buildOrdersWhereClause(query);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        orderStatus: true,
        grandTotal: true,
      },
    });

    const statusCounts: Record<OrderStatus, { count: number; totalAmount: number }> = {
      [OrderStatus.PENDING]: { count: 0, totalAmount: 0 },
      [OrderStatus.CONFIRMED]: { count: 0, totalAmount: 0 },
      [OrderStatus.PROCESSING]: { count: 0, totalAmount: 0 },
      [OrderStatus.SHIPPED]: { count: 0, totalAmount: 0 },
      [OrderStatus.DELIVERED]: { count: 0, totalAmount: 0 },
      [OrderStatus.CANCELLED]: { count: 0, totalAmount: 0 },
      [OrderStatus.RETURNED]: { count: 0, totalAmount: 0 },
    };

    for (const o of orders) {
      if (statusCounts[o.orderStatus]) {
        statusCounts[o.orderStatus].count++;
        statusCounts[o.orderStatus].totalAmount += Number(o.grandTotal || 0);
      }
    }

    const totalCount = orders.length;
    const orderedStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.RETURNED,
    ];

    return orderedStatuses.map((status) => {
      const data = statusCounts[status];
      const percentage =
        totalCount > 0
          ? Math.round((data.count / totalCount) * 10000) / 100
          : 0;
      const averageAmount =
        data.count > 0
          ? Math.round((data.totalAmount / data.count) * 100) / 100
          : 0;

      return {
        status,
        count: data.count,
        percentage,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
        averageAmount,
      };
    });
  }

  /**
   * Retrieves order volume breakdown across Shipment fulfillment statuses
   */
  async getOrdersByShipmentStatus(
    query: QueryOrdersReportDto,
  ): Promise<ShipmentStatusMetricDto[]> {
    const where = this.buildOrdersWhereClause(query);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        shipmentStatus: true,
        grandTotal: true,
      },
    });

    const statusCounts: Record<
      ShipmentStatus,
      { count: number; totalAmount: number }
    > = {
      [ShipmentStatus.UNFULFILLED]: { count: 0, totalAmount: 0 },
      [ShipmentStatus.PREPARING]: { count: 0, totalAmount: 0 },
      [ShipmentStatus.DISPATCHED]: { count: 0, totalAmount: 0 },
      [ShipmentStatus.IN_TRANSIT]: { count: 0, totalAmount: 0 },
      [ShipmentStatus.OUT_FOR_DELIVERY]: { count: 0, totalAmount: 0 },
      [ShipmentStatus.DELIVERED]: { count: 0, totalAmount: 0 },
      [ShipmentStatus.FAILED_DELIVERY]: { count: 0, totalAmount: 0 },
      [ShipmentStatus.RETURNED]: { count: 0, totalAmount: 0 },
    };

    for (const o of orders) {
      if (statusCounts[o.shipmentStatus]) {
        statusCounts[o.shipmentStatus].count++;
        statusCounts[o.shipmentStatus].totalAmount += Number(o.grandTotal || 0);
      }
    }

    const totalCount = orders.length;
    const orderedStatuses: ShipmentStatus[] = [
      ShipmentStatus.UNFULFILLED,
      ShipmentStatus.PREPARING,
      ShipmentStatus.DISPATCHED,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
      ShipmentStatus.FAILED_DELIVERY,
      ShipmentStatus.RETURNED,
    ];

    return orderedStatuses.map((status) => {
      const data = statusCounts[status];
      const percentage =
        totalCount > 0
          ? Math.round((data.count / totalCount) * 10000) / 100
          : 0;

      return {
        status,
        count: data.count,
        percentage,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
      };
    });
  }

  /**
   * Retrieves order breakdown across Payment statuses (PAID, PENDING, FAILED, REFUNDED)
   */
  async getOrdersByPaymentStatus(
    query: QueryOrdersReportDto,
  ): Promise<PaymentStatusMetricDto[]> {
    const where = this.buildOrdersWhereClause(query);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        paymentStatus: true,
        grandTotal: true,
      },
    });

    const statusCounts: Record<
      PaymentStatus,
      { count: number; totalAmount: number }
    > = {
      [PaymentStatus.PENDING]: { count: 0, totalAmount: 0 },
      [PaymentStatus.PAID]: { count: 0, totalAmount: 0 },
      [PaymentStatus.FAILED]: { count: 0, totalAmount: 0 },
      [PaymentStatus.REFUNDED]: { count: 0, totalAmount: 0 },
    };

    for (const o of orders) {
      if (statusCounts[o.paymentStatus]) {
        statusCounts[o.paymentStatus].count++;
        statusCounts[o.paymentStatus].totalAmount += Number(o.grandTotal || 0);
      }
    }

    const totalCount = orders.length;
    const orderedStatuses: PaymentStatus[] = [
      PaymentStatus.PAID,
      PaymentStatus.PENDING,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ];

    return orderedStatuses.map((status) => {
      const data = statusCounts[status];
      const percentage =
        totalCount > 0
          ? Math.round((data.count / totalCount) * 10000) / 100
          : 0;

      return {
        status,
        count: data.count,
        percentage,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
      };
    });
  }

  /**
   * Retrieves regional/geographic breakdown of orders by shipping city
   */
  async getOrdersByShippingCity(
    query: QueryOrdersReportDto,
    limit = 10,
  ): Promise<ShippingCityMetricDto[]> {
    const where = this.buildOrdersWhereClause(query);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        shippingCity: true,
        grandTotal: true,
      },
    });

    const totalCount = orders.length;
    const cityMap = new Map<string, { count: number; totalAmount: number }>();

    for (const o of orders) {
      const city = o.shippingCity ? o.shippingCity.trim() : 'Unspecified';
      const normalizedCity =
        city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

      if (!cityMap.has(normalizedCity)) {
        cityMap.set(normalizedCity, { count: 0, totalAmount: 0 });
      }
      const entry = cityMap.get(normalizedCity)!;
      entry.count++;
      entry.totalAmount += Number(o.grandTotal || 0);
    }

    const sorted = Array.from(cityMap.entries())
      .map(([city, data]) => {
        const percentage =
          totalCount > 0
            ? Math.round((data.count / totalCount) * 10000) / 100
            : 0;
        return {
          city,
          count: data.count,
          percentage,
          totalAmount: Math.round(data.totalAmount * 100) / 100,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted;
  }

  /**
   * Retrieves fulfillment breakdown across shipping methods & zones
   */
  async getOrdersByShippingMethod(
    query: QueryOrdersReportDto,
  ): Promise<ShippingMethodMetricDto[]> {
    const where = this.buildOrdersWhereClause(query);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        shippingFee: true,
        shipments: {
          select: {
            courierName: true,
            shippingMethod: {
              select: {
                name: true,
                zone: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const totalCount = orders.length;
    const methodMap = new Map<
      string,
      { zoneName?: string; count: number; totalShippingFee: number }
    >();

    for (const o of orders) {
      const shipment = o.shipments?.[0];
      const methodName =
        shipment?.shippingMethod?.name ||
        shipment?.courierName ||
        'Standard Delivery';
      const zoneName = shipment?.shippingMethod?.zone?.name;

      if (!methodMap.has(methodName)) {
        methodMap.set(methodName, {
          zoneName,
          count: 0,
          totalShippingFee: 0,
        });
      }

      const entry = methodMap.get(methodName)!;
      entry.count++;
      entry.totalShippingFee += Number(o.shippingFee || 0);
    }

    return Array.from(methodMap.entries())
      .map(([methodName, data]) => {
        const percentage =
          totalCount > 0
            ? Math.round((data.count / totalCount) * 10000) / 100
            : 0;
        return {
          methodName,
          zoneName: data.zoneName,
          count: data.count,
          percentage,
          totalShippingFee: Math.round(data.totalShippingFee * 100) / 100,
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Retrieves paginated, filtered orders with audit details for the Orders Report data table
   */
  async getOrdersList(
    query: QueryOrdersReportDto,
  ): Promise<OrdersReportListResponseDto> {
    const where = this.buildOrdersWhereClause(query);
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit || 15)));
    const skip = (page - 1) * limit;

    const validSortFields = ['createdAt', 'grandTotal', 'orderNumber'];
    const sortBy = validSortFields.includes(query.sortBy || '')
      ? query.sortBy!
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          payments: {
            select: {
              method: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          shipments: {
            select: {
              courierName: true,
              trackingNumber: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
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

    const items: OrdersReportRecordDto[] = orders.map((order) => {
      const itemsCount = (order.items || []).reduce(
        (acc, it) => acc + it.quantity,
        0,
      );

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        customerName: order.recipientName || order.user?.name || 'Customer',
        customerEmail: order.user?.email || '',
        recipientPhone: order.recipientPhone,
        shippingStreet: order.shippingStreet,
        shippingCity: order.shippingCity,
        shippingPostalCode: order.shippingPostalCode,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        shipmentStatus: order.shipmentStatus,
        paymentMethod: order.payments?.[0]?.method || null,
        courierName: order.shipments?.[0]?.courierName || null,
        trackingNumber: order.shipments?.[0]?.trackingNumber || null,
        itemsCount,
        subtotal: Number(order.subtotal || 0),
        discountAmount: Number(order.discountAmount || 0),
        shippingFee: Number(order.shippingFee || 0),
        grandTotal: Number(order.grandTotal || 0),
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
   * Generates formatted CSV string of orders report for instant download
   */
  async exportOrdersCsv(query: QueryOrdersReportDto): Promise<string> {
    const where = this.buildOrdersWhereClause(query);

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000, // Export cap for safety
      include: {
        user: { select: { name: true, email: true } },
        payments: {
          select: { method: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        shipments: {
          select: { courierName: true, trackingNumber: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
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
      'Destination Street',
      'Destination City',
      'Postal Code',
      'Order Status',
      'Payment Status',
      'Shipment Status',
      'Payment Method',
      'Courier',
      'Tracking Number',
      'Total Items',
      'Subtotal',
      'Discount',
      'Shipping Fee',
      'Grand Total',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows: string[] = [headers.join(',')];

    for (const order of orders) {
      const grandTotal = Number(order.grandTotal || 0);
      const subtotal = Number(order.subtotal || 0);
      const discount = Number(order.discountAmount || 0);
      const shipping = Number(order.shippingFee || 0);
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
        escapeCsv(order.shippingStreet),
        escapeCsv(order.shippingCity),
        escapeCsv(order.shippingPostalCode),
        escapeCsv(order.orderStatus),
        escapeCsv(order.paymentStatus),
        escapeCsv(order.shipmentStatus),
        escapeCsv(order.payments?.[0]?.method || PaymentMethod.CASH_ON_DELIVERY),
        escapeCsv(order.shipments?.[0]?.courierName || 'N/A'),
        escapeCsv(order.shipments?.[0]?.trackingNumber || 'N/A'),
        escapeCsv(itemsCount),
        escapeCsv(subtotal.toFixed(2)),
        escapeCsv(discount.toFixed(2)),
        escapeCsv(shipping.toFixed(2)),
        escapeCsv(grandTotal.toFixed(2)),
      ];

      rows.push(row.join(','));
    }

    return rows.join('\r\n');
  }
}

