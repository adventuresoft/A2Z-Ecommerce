export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type ShipmentStatus =
  | 'UNFULFILLED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNED';

export interface AdminOrderItem {
  id: string;
  variantId: string | null;
  productTitle: string;
  sku: string;
  variantAttributes: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  thumbnailUrl: string | null;
}

export interface AdminOrderStatusHistory {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  notes: string | null;
  changedByUserName: string | null;
  createdAt: string;
}

export interface AdminShipmentSummary {
  id: string;
  courierName: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: ShipmentStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface AdminOrderPaymentSummary {
  id: string;
  method: string;
  status: string;
  amount: number;
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminOrderRefundSummary {
  id: string;
  amount: number;
  status: string;
  reason: string;
  transactionRef: string | null;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  shipmentStatus: ShipmentStatus;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  recipientName: string;
  recipientPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string;
  customerNotes: string | null;
  items: AdminOrderItem[];
  statusHistory?: AdminOrderStatusHistory[];
  shipments?: AdminShipmentSummary[];
  payments?: AdminOrderPaymentSummary[];
  refunds?: AdminOrderRefundSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrders {
  items: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shipmentStatus?: ShipmentStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'grandTotal' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateOrderStatusPayload {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shipmentStatus?: ShipmentStatus;
  notes?: string;
}

export interface CreateAdminOrderItemPayload {
  variantId: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateAdminOrderPayload {
  userId?: string;
  customerEmail?: string;
  recipientName: string;
  recipientPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState?: string;
  shippingPostalCode: string;
  shippingFee?: number;
  discountAmount?: number;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: 'CASH_ON_DELIVERY' | 'CREDIT_CARD' | 'MOBILE_BANKING';
  paymentRef?: string;
  customerNotes?: string;
  adminNotes?: string;
  items: CreateAdminOrderItemPayload[];
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

    // Auto-login in dev environment if no token is present
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

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export const ordersService = {
  /**
   * Fetch paginated orders with query filters
   */
  async getOrders(params?: QueryOrdersParams): Promise<PaginatedOrders> {
    const url = new URL(`${API_BASE}/admin/orders`);
    if (params) {
      if (params.page) url.searchParams.set('page', String(params.page));
      if (params.limit) url.searchParams.set('limit', String(params.limit));
      if (params.search) url.searchParams.set('search', params.search);
      if (params.orderStatus)
        url.searchParams.set('orderStatus', params.orderStatus);
      if (params.paymentStatus)
        url.searchParams.set('paymentStatus', params.paymentStatus);
      if (params.shipmentStatus)
        url.searchParams.set('shipmentStatus', params.shipmentStatus);
      if (params.dateFrom) url.searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) url.searchParams.set('dateTo', params.dateTo);
      if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder)
        url.searchParams.set('sortOrder', params.sortOrder);
    }

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch orders');
    }

    const json = await res.json();
    return {
      items: json.data || [],
      total: json.meta?.total || 0,
      page: json.meta?.page || 1,
      limit: json.meta?.limit || 10,
      totalPages: json.meta?.totalPages || 1,
    };
  },

  /**
   * Fetch a single order by ID
   */
  async getOrderById(id: string): Promise<AdminOrder> {
    const res = await fetchWithAuth(`${API_BASE}/admin/orders/${id}`, {
      method: 'GET',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch order ${id}`);
    }
    return res.json();
  },

  /**
   * Update status of an order
   */
  async updateOrderStatus(
    id: string,
    payload: UpdateOrderStatusPayload,
  ): Promise<AdminOrder> {
    const res = await fetchWithAuth(`${API_BASE}/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update order status');
    }
    return res.json();
  },

  /**
   * Create an order directly from admin dashboard
   */
  async createOrder(payload: CreateAdminOrderPayload): Promise<AdminOrder> {
    const res = await fetchWithAuth(`${API_BASE}/admin/orders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create order');
    }
    return res.json();
  },
};

