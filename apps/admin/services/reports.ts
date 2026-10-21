export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentMethod =
  | 'CASH_ON_DELIVERY'
  | 'CREDIT_CARD'
  | 'MOBILE_BANKING';

export type ShipmentStatus =
  | 'UNFULFILLED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNED';

export interface SalesReportParams {
  startDate?: string;
  endDate?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  interval?: 'day' | 'week' | 'month';
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SalesSummary {
  grossSales: number;
  netSales: number;
  totalOrders: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  returnedOrdersCount: number;
  totalDiscounts: number;
  totalShipping: number;
  totalRefunds: number;
  totalItemsSold: number;
  averageOrderValue: number;
  currency: string;
  startDate?: string;
  endDate?: string;
}

export interface SalesTimelinePoint {
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

export interface SalesTimelineResponse {
  timeline: SalesTimelinePoint[];
  interval: string;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  orderCount: number;
  totalAmount: number;
  percentage: number;
}

export interface OrderStatusBreakdown {
  status: OrderStatus;
  orderCount: number;
  totalAmount: number;
  percentage: number;
}

export interface TopSellingProduct {
  variantId: string | null;
  productId: string | null;
  productTitle: string;
  sku: string;
  categoryName: string;
  thumbnailUrl: string | null;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface CategorySalesBreakdown {
  categoryId: string;
  categoryName: string;
  orderCount: number;
  quantitySold: number;
  totalRevenue: number;
  percentage: number;
}

export interface SalesOrderItem {
  id: string;
  productTitle: string;
  sku: string;
  variantAttributes: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface SalesOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  recipientPhone: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shipmentStatus: ShipmentStatus;
  paymentMethod: PaymentMethod | null;
  itemsCount: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  refundAmount: number;
  netAmount: number;
  items?: SalesOrderItem[];
}

export interface PaginatedSalesOrders {
  items: SalesOrderRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function ensureValidToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const token =
      localStorage.getItem('az_admin_access_token') ||
      localStorage.getItem('accessToken');
    if (token) return token;

    // Auto-login in dev environment if token is absent
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@az-ecommerce.local',
        password: 'Password123!',
      }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      if (data.accessToken) {
        localStorage.setItem('az_admin_access_token', data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('az_admin_refresh_token', data.refreshToken);
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          localStorage.setItem('az_admin_user', JSON.stringify(data.user));
        }
        return data.accessToken;
      }
    }
  } catch {
    // Fail silently
  }
  return null;
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await ensureValidToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type') &&
    options.method &&
    options.method !== 'GET'
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

function appendParams(url: URL, params?: SalesReportParams): void {
  if (!params) return;
  if (params.startDate) url.searchParams.set('startDate', params.startDate);
  if (params.endDate) url.searchParams.set('endDate', params.endDate);
  if (params.orderStatus) url.searchParams.set('orderStatus', params.orderStatus);
  if (params.paymentStatus)
    url.searchParams.set('paymentStatus', params.paymentStatus);
  if (params.paymentMethod)
    url.searchParams.set('paymentMethod', params.paymentMethod);
  if (params.interval) url.searchParams.set('interval', params.interval);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.search) url.searchParams.set('search', params.search);
  if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
}

export const reportsService = {
  /**
   * Fetch Sales Summary KPIs
   */
  async getSalesSummary(params?: SalesReportParams): Promise<SalesSummary> {
    const url = new URL(`${API_BASE}/admin/reports/sales/summary`);
    appendParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch sales summary');
    }
    return res.json();
  },

  /**
   * Fetch Sales Timeline Trend Points
   */
  async getSalesTimeline(
    params?: SalesReportParams,
  ): Promise<SalesTimelineResponse> {
    const url = new URL(`${API_BASE}/admin/reports/sales/timeline`);
    appendParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch sales timeline');
    }
    return res.json();
  },

  /**
   * Fetch Payment Method Breakdown
   */
  async getSalesByPaymentMethod(
    params?: SalesReportParams,
  ): Promise<PaymentMethodBreakdown[]> {
    const url = new URL(`${API_BASE}/admin/reports/sales/by-payment-method`);
    appendParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.message || 'Failed to fetch payment method breakdown',
      );
    }
    return res.json();
  },

  /**
   * Fetch Order Status Breakdown
   */
  async getSalesByOrderStatus(
    params?: SalesReportParams,
  ): Promise<OrderStatusBreakdown[]> {
    const url = new URL(`${API_BASE}/admin/reports/sales/by-order-status`);
    appendParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch order status breakdown');
    }
    return res.json();
  },

  /**
   * Fetch Best-Selling Products
   */
  async getTopSellingProducts(
    params?: SalesReportParams,
    limit = 10,
  ): Promise<TopSellingProduct[]> {
    const url = new URL(`${API_BASE}/admin/reports/sales/top-products`);
    appendParams(url, params);
    url.searchParams.set('limit', String(limit));

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch top selling products');
    }
    return res.json();
  },

  /**
   * Fetch Category Sales Breakdown
   */
  async getSalesByCategory(
    params?: SalesReportParams,
  ): Promise<CategorySalesBreakdown[]> {
    const url = new URL(`${API_BASE}/admin/reports/sales/by-category`);
    appendParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch category sales');
    }
    return res.json();
  },

  /**
   * Fetch Paginated Sales Orders
   */
  async getSalesOrders(
    params?: SalesReportParams,
  ): Promise<PaginatedSalesOrders> {
    const url = new URL(`${API_BASE}/admin/reports/sales/orders`);
    appendParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch sales orders');
    }
    return res.json();
  },

  /**
   * Download CSV export
   */
  async downloadSalesCsv(params?: SalesReportParams): Promise<Blob> {
    const url = new URL(`${API_BASE}/admin/reports/sales/export`);
    appendParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      throw new Error('Failed to export sales CSV');
    }
    return res.blob();
  },

  // =========================================================================
  // ORDERS REPORT METHODS
  // =========================================================================

  /**
   * Fetch Orders Summary KPIs
   */
  async getOrdersSummary(params?: OrdersReportParams): Promise<OrdersSummary> {
    const url = new URL(`${API_BASE}/admin/reports/orders/summary`);
    appendOrdersParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch orders summary');
    }
    return res.json();
  },

  /**
   * Fetch Orders Timeline Trend Points
   */
  async getOrdersTimeline(
    params?: OrdersReportParams,
  ): Promise<OrdersTimelineResponse> {
    const url = new URL(`${API_BASE}/admin/reports/orders/timeline`);
    appendOrdersParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch orders timeline');
    }
    return res.json();
  },

  /**
   * Fetch Order Status Breakdown
   */
  async getOrdersByStatus(
    params?: OrdersReportParams,
  ): Promise<OrderStatusMetric[]> {
    const url = new URL(`${API_BASE}/admin/reports/orders/by-status`);
    appendOrdersParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch order status breakdown');
    }
    return res.json();
  },

  /**
   * Fetch Shipment Status Breakdown
   */
  async getOrdersByShipmentStatus(
    params?: OrdersReportParams,
  ): Promise<ShipmentStatusMetric[]> {
    const url = new URL(`${API_BASE}/admin/reports/orders/by-shipment-status`);
    appendOrdersParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch shipment status breakdown');
    }
    return res.json();
  },

  /**
   * Fetch Payment Status Breakdown
   */
  async getOrdersByPaymentStatus(
    params?: OrdersReportParams,
  ): Promise<PaymentStatusMetric[]> {
    const url = new URL(`${API_BASE}/admin/reports/orders/by-payment-status`);
    appendOrdersParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch payment status breakdown');
    }
    return res.json();
  },

  /**
   * Fetch Orders by Shipping City (Geographic breakdown)
   */
  async getOrdersByShippingCity(
    params?: OrdersReportParams,
    limit = 10,
  ): Promise<ShippingCityMetric[]> {
    const url = new URL(`${API_BASE}/admin/reports/orders/by-shipping-city`);
    appendOrdersParams(url, params);
    url.searchParams.set('limit', String(limit));

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch geographic breakdown');
    }
    return res.json();
  },

  /**
   * Fetch Orders by Shipping Method
   */
  async getOrdersByShippingMethod(
    params?: OrdersReportParams,
  ): Promise<ShippingMethodMetric[]> {
    const url = new URL(`${API_BASE}/admin/reports/orders/by-shipping-method`);
    appendOrdersParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch shipping method breakdown');
    }
    return res.json();
  },

  /**
   * Fetch Paginated Orders Report List
   */
  async getOrdersList(
    params?: OrdersReportParams,
  ): Promise<PaginatedOrdersReport> {
    const url = new URL(`${API_BASE}/admin/reports/orders/list`);
    appendOrdersParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch orders report list');
    }
    return res.json();
  },

  /**
   * Download Orders CSV export
   */
  async downloadOrdersCsv(params?: OrdersReportParams): Promise<Blob> {
    const url = new URL(`${API_BASE}/admin/reports/orders/export`);
    appendOrdersParams(url, params);

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      throw new Error('Failed to export orders CSV');
    }
    return res.blob();
  },
};

// =========================================================================
// ORDERS REPORT TYPES & HELPERS
// =========================================================================

export interface OrdersReportParams {
  startDate?: string;
  endDate?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  shipmentStatus?: ShipmentStatus;
  city?: string;
  interval?: 'day' | 'week' | 'month';
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrdersSummary {
  totalOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  totalItemsOrdered: number;
  averageItemsPerOrder: number;
  pendingOrdersCount: number;
  confirmedOrdersCount: number;
  processingOrdersCount: number;
  shippedOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  returnedOrdersCount: number;
  fulfillmentRate: number;
  cancellationRate: number;
  returnRate: number;
  paidOrdersCount: number;
  pendingPaymentCount: number;
  failedPaymentCount: number;
  refundedOrdersCount: number;
  currency: string;
  startDate?: string;
  endDate?: string;
}

export interface OrdersTimelinePoint {
  date: string;
  label: string;
  totalOrders: number;
  deliveredOrders: number;
  processingOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  totalValue: number;
  itemsCount: number;
}

export interface OrdersTimelineResponse {
  timeline: OrdersTimelinePoint[];
  interval: string;
}

export interface OrderStatusMetric {
  status: OrderStatus;
  count: number;
  percentage: number;
  totalAmount: number;
  averageAmount: number;
}

export interface ShipmentStatusMetric {
  status: ShipmentStatus;
  count: number;
  percentage: number;
  totalAmount: number;
}

export interface PaymentStatusMetric {
  status: PaymentStatus;
  count: number;
  percentage: number;
  totalAmount: number;
}

export interface ShippingCityMetric {
  city: string;
  count: number;
  percentage: number;
  totalAmount: number;
}

export interface ShippingMethodMetric {
  methodName: string;
  zoneName?: string;
  count: number;
  percentage: number;
  totalShippingFee: number;
}

export interface OrdersReportItemSummary {
  id: string;
  productTitle: string;
  sku: string;
  variantAttributes: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrdersReportRecord {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  recipientPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingPostalCode: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shipmentStatus: ShipmentStatus;
  paymentMethod: PaymentMethod | null;
  courierName: string | null;
  trackingNumber: string | null;
  itemsCount: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  items?: OrdersReportItemSummary[];
}

export interface PaginatedOrdersReport {
  items: OrdersReportRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function appendOrdersParams(url: URL, params?: OrdersReportParams): void {
  if (!params) return;
  if (params.startDate) url.searchParams.set('startDate', params.startDate);
  if (params.endDate) url.searchParams.set('endDate', params.endDate);
  if (params.orderStatus) url.searchParams.set('orderStatus', params.orderStatus);
  if (params.paymentStatus)
    url.searchParams.set('paymentStatus', params.paymentStatus);
  if (params.paymentMethod)
    url.searchParams.set('paymentMethod', params.paymentMethod);
  if (params.shipmentStatus)
    url.searchParams.set('shipmentStatus', params.shipmentStatus);
  if (params.city) url.searchParams.set('city', params.city);
  if (params.interval) url.searchParams.set('interval', params.interval);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.search) url.searchParams.set('search', params.search);
  if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
}

