export type ShipmentStatus =
  | 'UNFULFILLED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNED';

export interface ShippingZone {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  methodsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingMethod {
  id: string;
  zoneId: string;
  zoneName?: string;
  name: string;
  cost: number;
  estimatedDays: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingZoneDetail extends ShippingZone {
  methods: ShippingMethod[];
}

export interface ShipmentStatusHistory {
  id: string;
  fromStatus: ShipmentStatus | null;
  toStatus: ShipmentStatus;
  notes: string | null;
  changedByUserName: string | null;
  createdAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  orderNumber?: string;
  shippingMethodId: string | null;
  shippingMethodName: string | null;
  courierName: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: ShipmentStatus;
  notes: string | null;
  recipientName?: string;
  recipientPhone?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  statusHistory: ShipmentStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedShipments {
  items: Shipment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryShipmentsParams {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  courierName?: string;
  orderId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'status' | 'courierName' | 'shippedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateShipmentPayload {
  orderId: string;
  courierName: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingMethodId?: string;
  notes?: string;
}

export interface UpdateShipmentStatusPayload {
  status: ShipmentStatus;
  notes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface UpdateShipmentPayload {
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  shippingMethodId?: string;
}

export interface CreateShippingZonePayload {
  name: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateShippingZonePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateShippingMethodPayload {
  zoneId: string;
  name: string;
  cost: number;
  estimatedDays?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateShippingMethodPayload {
  zoneId?: string;
  name?: string;
  cost?: number;
  estimatedDays?: number;
  isActive?: boolean;
  sortOrder?: number;
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

  headers.set('Content-Type', 'application/json');

  return fetch(url, {
    ...options,
    headers,
  });
}

// -----------------------------------------------------------------------------
// Shipments API
// -----------------------------------------------------------------------------

export async function getShipments(
  params: QueryShipmentsParams = {},
): Promise<PaginatedShipments> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status) query.set('status', params.status);
  if (params.courierName) query.set('courierName', params.courierName);
  if (params.orderId) query.set('orderId', params.orderId);
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await fetchWithAuth(`${API_BASE}/admin/shipments?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch shipments');
  }

  const json = await res.json();
  return {
    items: json.data || [],
    total: json.meta?.total || 0,
    page: json.meta?.page || 1,
    limit: json.meta?.limit || 10,
    totalPages: json.meta?.totalPages || 1,
  };
}

export async function getShipment(id: string): Promise<Shipment> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipments/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch shipment #${id}`);
  }
  return res.json();
}

export async function createShipment(
  payload: CreateShipmentPayload,
): Promise<Shipment> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create shipment');
  }
  return res.json();
}

export async function updateShipmentStatus(
  id: string,
  payload: UpdateShipmentStatusPayload,
): Promise<Shipment> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update shipment status');
  }
  return res.json();
}

export async function updateShipmentDetails(
  id: string,
  payload: UpdateShipmentPayload,
): Promise<Shipment> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update shipment details');
  }
  return res.json();
}

// -----------------------------------------------------------------------------
// Shipping Zones API
// -----------------------------------------------------------------------------

export async function getShippingZones(): Promise<ShippingZone[]> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/zones`);
  if (!res.ok) {
    throw new Error('Failed to fetch shipping zones');
  }
  return res.json();
}

export async function getShippingZone(id: string): Promise<ShippingZoneDetail> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/zones/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch shipping zone #${id}`);
  }
  return res.json();
}

export async function createShippingZone(
  payload: CreateShippingZonePayload,
): Promise<ShippingZone> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/zones`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create shipping zone');
  }
  return res.json();
}

export async function updateShippingZone(
  id: string,
  payload: UpdateShippingZonePayload,
): Promise<ShippingZone> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/zones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update shipping zone');
  }
  return res.json();
}

export async function deleteShippingZone(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/zones/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete shipping zone');
  }
}

// -----------------------------------------------------------------------------
// Shipping Methods API
// -----------------------------------------------------------------------------

export async function getShippingMethods(
  zoneId?: string,
): Promise<ShippingMethod[]> {
  const query = zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : '';
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/methods${query}`);
  if (!res.ok) {
    throw new Error('Failed to fetch shipping methods');
  }
  return res.json();
}

export async function getShippingMethod(id: string): Promise<ShippingMethod> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/methods/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch shipping method #${id}`);
  }
  return res.json();
}

export async function createShippingMethod(
  payload: CreateShippingMethodPayload,
): Promise<ShippingMethod> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/methods`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create shipping method');
  }
  return res.json();
}

export async function updateShippingMethod(
  id: string,
  payload: UpdateShippingMethodPayload,
): Promise<ShippingMethod> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update shipping method');
  }
  return res.json();
}

export async function deleteShippingMethod(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/admin/shipping/methods/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete shipping method');
  }
}
