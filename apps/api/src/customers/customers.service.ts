import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role, OrderStatus, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  CreateCustomerDto,
  CustomerDetailResponseDto,
  CustomerItemDto,
  CustomerStatsResponseDto,
  CustomerSpendingTierFilter,
  PaginatedCustomersResponseDto,
  QueryCustomersDto,
  UpdateCustomerDto,
  UpdateCustomerStatusDto,
} from './dto/index.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determine spending tier based on completed/active orders and total expenditure
   */
  private computeSpendingTier(ordersCount: number, totalSpent: number): string {
    if (ordersCount === 0) return 'ZERO_ORDER';
    if (totalSpent >= 5000 || ordersCount >= 3) return 'VIP';
    if (totalSpent >= 1500 || ordersCount >= 2) return 'REGULAR';
    return 'ONE_TIME';
  }

  /**
   * Aggregate high-level customer KPI metrics for summary cards
   */
  async getStats(): Promise<CustomerStatsResponseDto> {
    const totalCustomers = await this.prisma.user.count({
      where: { role: Role.CUSTOMER },
    });

    const activeCustomers = await this.prisma.user.count({
      where: { role: Role.CUSTOMER, isActive: true },
    });

    const inactiveCustomers = totalCustomers - activeCustomers;

    // Load non-cancelled orders for customer role to compute sales aggregates
    const orders = await this.prisma.order.findMany({
      where: {
        user: { role: Role.CUSTOMER },
        orderStatus: { not: OrderStatus.CANCELLED },
      },
      select: {
        userId: true,
        grandTotal: true,
      },
    });

    const userSpendMap = new Map<string, { count: number; spend: number }>();
    let totalRevenue = 0;

    for (const order of orders) {
      const amount = Number(order.grandTotal || 0);
      totalRevenue += amount;
      const current = userSpendMap.get(order.userId) || { count: 0, spend: 0 };
      current.count += 1;
      current.spend += amount;
      userSpendMap.set(order.userId, current);
    }

    let vipCustomers = 0;
    let regularCustomers = 0;
    let repeatCustomers = 0;

    for (const [, stats] of userSpendMap.entries()) {
      if (stats.count > 1) {
        repeatCustomers++;
      }
      const tier = this.computeSpendingTier(stats.count, stats.spend);
      if (tier === 'VIP') {
        vipCustomers++;
      } else if (tier === 'REGULAR') {
        regularCustomers++;
      }
    }

    const purchasingCustomersCount = userSpendMap.size;
    const averageOrderValue =
      orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0;

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      vipCustomers,
      regularCustomers,
      repeatCustomers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue,
    };
  }

  /**
   * Paginated customer listing with rich filters, tier mapping, and sorting
   */
  async findAll(query: QueryCustomersDto): Promise<PaginatedCustomersResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));

    const where: Prisma.UserWhereInput = {
      role: Role.CUSTOMER,
    };

    if (query.isActive !== undefined && query.isActive !== '') {
      where.isActive =
        typeof query.isActive === 'boolean'
          ? query.isActive
          : query.isActive === 'true';
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
        {
          addresses: {
            some: {
              OR: [
                { city: { contains: term, mode: 'insensitive' } },
                { streetAddress: { contains: term, mode: 'insensitive' } },
                { recipientName: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (query.city && query.city.trim()) {
      const cityTerm = query.city.trim();
      where.OR = [
        ...(where.OR || []),
        { location: { contains: cityTerm, mode: 'insensitive' } },
        { addresses: { some: { city: { contains: cityTerm, mode: 'insensitive' } } } },
        { orders: { some: { shippingCity: { contains: cityTerm, mode: 'insensitive' } } } },
      ];
    }

    // Fetch users with their orders and addresses
    const users = await this.prisma.user.findMany({
      where,
      include: {
        addresses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        orders: {
          where: { orderStatus: { not: OrderStatus.CANCELLED } },
          select: {
            id: true,
            grandTotal: true,
            shippingCity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Compute derived metrics for each customer
    let computedList: CustomerItemDto[] = users.map((u) => {
      let totalSpent = 0;
      const cityFrequency = new Map<string, number>();

      for (const order of u.orders) {
        totalSpent += Number(order.grandTotal || 0);
        if (order.shippingCity) {
          const c = order.shippingCity.trim();
          cityFrequency.set(c, (cityFrequency.get(c) || 0) + 1);
        }
      }

      let primaryCity: string | null = u.addresses[0]?.city || u.location || null;
      if (!primaryCity && cityFrequency.size > 0) {
        let maxCount = 0;
        for (const [c, count] of cityFrequency.entries()) {
          if (count > maxCount) {
            maxCount = count;
            primaryCity = c;
          }
        }
      }

      const ordersCount = u.orders.length;
      const averageOrderValue =
        ordersCount > 0 ? Math.round((totalSpent / ordersCount) * 100) / 100 : 0;
      const spendingTier = this.computeSpendingTier(ordersCount, totalSpent);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        emailVerifiedAt: u.emailVerifiedAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        ordersCount,
        totalSpent: Math.round(totalSpent * 100) / 100,
        averageOrderValue,
        lastOrderDate: u.orders[0]?.createdAt ? u.orders[0].createdAt.toISOString() : null,
        spendingTier,
        primaryCity,
      };
    });

    // Filter by spendingTier if specified
    if (query.spendingTier && query.spendingTier !== CustomerSpendingTierFilter.ALL) {
      computedList = computedList.filter((c) => c.spendingTier === query.spendingTier);
    }

    // Sort list
    const sortBy = query.sortBy || 'createdAt';
    const isAsc = query.sortOrder === 'asc';

    computedList.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'totalSpent') {
        comparison = a.totalSpent - b.totalSpent;
      } else if (sortBy === 'ordersCount') {
        comparison = a.ordersCount - b.ordersCount;
      } else if (sortBy === 'lastOrderDate') {
        const timeA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        const timeB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
        comparison = timeA - timeB;
      } else {
        // default createdAt
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return isAsc ? comparison : -comparison;
    });

    const total = computedList.length;
    const skip = (page - 1) * limit;
    const paginatedItems = computedList.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve single customer comprehensive 360 profile with order history and reviews
   */
  async findById(id: string): Promise<CustomerDetailResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, role: Role.CUSTOMER },
      include: {
        addresses: {
          orderBy: [{ isDefaultShipping: 'desc' }, { createdAt: 'desc' }],
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            payments: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { title: true, slug: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    const nonCancelledOrders = user.orders.filter(
      (o) => o.orderStatus !== OrderStatus.CANCELLED,
    );
    const cancelledOrdersCount = user.orders.filter(
      (o) => o.orderStatus === OrderStatus.CANCELLED,
    ).length;

    let totalSpent = 0;
    for (const o of nonCancelledOrders) {
      totalSpent += Number(o.grandTotal || 0);
    }

    const ordersCount = nonCancelledOrders.length;
    const averageOrderValue =
      ordersCount > 0 ? Math.round((totalSpent / ordersCount) * 100) / 100 : 0;
    const spendingTier = this.computeSpendingTier(ordersCount, totalSpent);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
      tokenVersion: user.tokenVersion,
      location: user.location,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ordersCount,
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageOrderValue,
      lastOrderDate: user.orders[0]?.createdAt ? user.orders[0].createdAt.toISOString() : null,
      spendingTier,
      cancelledOrdersCount,
      addresses: user.addresses.map((a) => ({
        id: a.id,
        userId: a.userId,
        label: a.label,
        recipientName: a.recipientName,
        phone: a.phone,
        streetAddress: a.streetAddress,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode,
        country: a.country,
        isDefaultShipping: a.isDefaultShipping,
        isDefaultBilling: a.isDefaultBilling,
        createdAt: a.createdAt,
      })),
      recentOrders: user.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        shipmentStatus: o.shipmentStatus,
        grandTotal: Number(o.grandTotal || 0),
        itemsCount: o.items.reduce((acc, item) => acc + item.quantity, 0),
        paymentMethod: o.payments[0]?.method || null,
        createdAt: o.createdAt,
      })),
      reviews: user.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: r.status,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
        productTitle: r.product.title,
        productSlug: r.product.slug,
      })),
    };
  }

  /**
   * Administrative creation of a customer account with optional initial address
   */
  async create(dto: CreateCustomerDto): Promise<CustomerDetailResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException(`User with email '${normalizedEmail}' already exists`);
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const locationString = dto.city
      ? `${dto.city}${dto.country ? `, ${dto.country}` : ''}`
      : null;

    const created = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        role: Role.CUSTOMER,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        location: locationString,
        emailVerifiedAt: new Date(),
      },
    });

    if (dto.streetAddress && dto.city) {
      await this.prisma.userAddress.create({
        data: {
          userId: created.id,
          label: 'Default Address',
          recipientName: dto.name.trim(),
          phone: dto.phone?.trim() || 'N/A',
          streetAddress: dto.streetAddress.trim(),
          city: dto.city.trim(),
          state: dto.state?.trim() || null,
          postalCode: dto.postalCode?.trim() || '1000',
          country: dto.country?.trim() || 'Bangladesh',
          isDefaultShipping: true,
          isDefaultBilling: true,
        },
      });
    }

    return this.findById(created.id);
  }

  /**
   * Administrative update of customer profile, status, credentials, and address
   */
  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerDetailResponseDto> {
    const customer = await this.prisma.user.findFirst({
      where: { id, role: Role.CUSTOMER },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.password && dto.password.trim()) {
      data.passwordHash = await argon2.hash(dto.password, {
        type: argon2.argon2id,
      });
      data.tokenVersion = { increment: 1 };
    }

    if (dto.city) {
      data.location = `${dto.city}${dto.country ? `, ${dto.country}` : ''}`;
    }

    await this.prisma.user.update({
      where: { id },
      data,
    });

    if (dto.streetAddress && dto.city) {
      const defaultAddress = await this.prisma.userAddress.findFirst({
        where: { userId: id, isDefaultShipping: true },
      });

      if (defaultAddress) {
        await this.prisma.userAddress.update({
          where: { id: defaultAddress.id },
          data: {
            recipientName: dto.name ? dto.name.trim() : defaultAddress.recipientName,
            phone: dto.phone ? dto.phone.trim() : defaultAddress.phone,
            streetAddress: dto.streetAddress.trim(),
            city: dto.city.trim(),
            state: dto.state !== undefined ? dto.state?.trim() : defaultAddress.state,
            postalCode: dto.postalCode ? dto.postalCode.trim() : defaultAddress.postalCode,
            country: dto.country ? dto.country.trim() : defaultAddress.country,
          },
        });
      } else {
        await this.prisma.userAddress.create({
          data: {
            userId: id,
            label: 'Primary Address',
            recipientName: dto.name?.trim() || customer.name,
            phone: dto.phone?.trim() || customer.phone || 'N/A',
            streetAddress: dto.streetAddress.trim(),
            city: dto.city.trim(),
            state: dto.state?.trim() || null,
            postalCode: dto.postalCode?.trim() || '1000',
            country: dto.country?.trim() || 'Bangladesh',
            isDefaultShipping: true,
            isDefaultBilling: true,
          },
        });
      }
    }

    return this.findById(id);
  }

  /**
   * Quick toggle of customer account status (e.g. block / unblock)
   */
  async updateStatus(
    id: string,
    dto: UpdateCustomerStatusDto,
  ): Promise<{ success: boolean; message: string; customer: CustomerDetailResponseDto }> {
    const customer = await this.prisma.user.findFirst({
      where: { id, role: Role.CUSTOMER },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
        tokenVersion: dto.isActive ? undefined : { increment: 1 },
      },
    });

    const updated = await this.findById(id);
    const actionText = dto.isActive ? 'activated' : 'suspended/deactivated';

    return {
      success: true,
      message: `Customer '${customer.name}' account successfully ${actionText}.`,
      customer: updated,
    };
  }

  /**
   * Delete customer or deactivate if historical orders exist
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const customer = await this.prisma.user.findFirst({
      where: { id, role: Role.CUSTOMER },
      include: {
        orders: {
          select: { id: true, orderStatus: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    const activeOrders = customer.orders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.orderStatus),
    );

    if (activeOrders.length > 0) {
      throw new BadRequestException(
        `Cannot delete customer with ${activeOrders.length} active order(s). Please fulfill or cancel these orders first, or deactivate the customer account instead.`,
      );
    }

    if (customer.orders.length > 0) {
      // Deactivate customer and invalidate tokens to prevent login while preserving financial history
      await this.prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          tokenVersion: { increment: 1 },
        },
      });

      return {
        success: true,
        message: `Customer '${customer.name}' has historical order records. To protect financial audit integrity, the account has been permanently deactivated and all active sessions revoked.`,
      };
    }

    // Clean delete if no orders exist
    await this.prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Customer '${customer.name}' has been successfully deleted.`,
    };
  }

  /**
   * Export customers list to standard RFC 4180 CSV
   */
  async exportCsv(query: QueryCustomersDto): Promise<string> {
    const queryCopy = { ...query, page: 1, limit: 10000 };
    const res = await this.findAll(queryCopy);

    const headers = [
      'Customer ID',
      'Name',
      'Email',
      'Phone',
      'Status',
      'Spending Tier',
      'Orders Count',
      'Total Spent (BDT)',
      'Avg Order Value (BDT)',
      'Primary City',
      'Last Order Date',
      'Registration Date',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = res.items.map((c) => [
      escapeCsv(c.id),
      escapeCsv(c.name),
      escapeCsv(c.email),
      escapeCsv(c.phone || ''),
      escapeCsv(c.isActive ? 'Active' : 'Inactive'),
      escapeCsv(c.spendingTier),
      escapeCsv(c.ordersCount),
      escapeCsv(c.totalSpent.toFixed(2)),
      escapeCsv(c.averageOrderValue.toFixed(2)),
      escapeCsv(c.primaryCity || ''),
      escapeCsv(c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'Never'),
      escapeCsv(new Date(c.createdAt).toLocaleDateString()),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}
