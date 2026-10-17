export type StockMovementType =
  | 'INITIAL'
  | 'RESTOCK'
  | 'PURCHASE_RESERVE'
  | 'ORDER_FULFILL'
  | 'CANCEL_RESTORE'
  | 'RETURN_RESTORE'
  | 'MANUAL_ADJUSTMENT'
  | 'DAMAGED';

export interface VariantAttributeSummary {
  name: string;
  value: string;
  colorCode?: string | null;
}

export interface InventoryItem {
  id: string;
  variantId: string;
  sku: string;
  barcode: string | null;
  productTitle: string;
  productId: string;
  categoryName: string | null;
  thumbnailUrl: string | null;
  attributes: VariantAttributeSummary[];
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  updatedAt: string;
}

export interface PaginatedInventory {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StockMovementItem {
  id: string;
  variantId: string;
  sku: string;
  productTitle: string;
  type: StockMovementType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  referenceId: string | null;
  notes: string | null;
  performedByUserName: string | null;
  createdAt: string;
}

export interface PaginatedMovements {
  items: StockMovementItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LowStockSummary {
  totalVariants: number;
  lowStockCount: number;
  outOfStockCount: number;
  items: InventoryItem[];
}

export interface QueryInventoryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  sortBy?: 'sku' | 'quantity' | 'availableQuantity' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface QueryMovementsParams {
  page?: number;
  limit?: number;
  variantId?: string;
  type?: StockMovementType;
  referenceId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdjustStockPayload {
  variantId: string;
  type: 'RESTOCK' | 'MANUAL_ADJUSTMENT' | 'DAMAGED';
  quantityChange: number;
  referenceId?: string;
  notes?: string;
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

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
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

/**
 * Fetch paginated inventory balances
 */
export async function getInventory(params: QueryInventoryParams = {}): Promise<PaginatedInventory> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.lowStock) query.set('lowStock', 'true');
  if (params.outOfStock) query.set('outOfStock', 'true');
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await fetchWithAuth(`${API_BASE}/admin/inventory?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch inventory balances');
  }

  const json = await res.json();
  return {
    items: json.data,
    total: json.meta.total,
    page: json.meta.page,
    limit: json.meta.limit,
    totalPages: json.meta.totalPages,
  };
}

/**
 * Fetch single variant inventory status
 */
export async function getVariantInventory(variantId: string): Promise<InventoryItem> {
  const res = await fetchWithAuth(`${API_BASE}/admin/inventory/${variantId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch inventory for variant ${variantId}`);
  }

  return res.json();
}

/**
 * Adjust physical stock count with movement log
 */
export async function adjustStock(payload: AdjustStockPayload): Promise<InventoryItem> {
  const res = await fetchWithAuth(`${API_BASE}/admin/inventory/adjust`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to adjust stock');
  }

  return res.json();
}

/**
 * Update low stock threshold for a variant
 */
export async function updateThreshold(variantId: string, lowStockThreshold: number): Promise<InventoryItem> {
  const res = await fetchWithAuth(`${API_BASE}/admin/inventory/${variantId}/threshold`, {
    method: 'PATCH',
    body: JSON.stringify({ lowStockThreshold }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update threshold');
  }

  return res.json();
}

/**
 * Query stock movement audit ledger
 */
export async function getStockMovements(params: QueryMovementsParams = {}): Promise<PaginatedMovements> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.variantId) query.set('variantId', params.variantId);
  if (params.type) query.set('type', params.type);
  if (params.referenceId) query.set('referenceId', params.referenceId);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);

  const res = await fetchWithAuth(`${API_BASE}/admin/inventory/movements?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch stock movements');
  }

  const json = await res.json();
  return {
    items: json.data,
    total: json.meta.total,
    page: json.meta.page,
    limit: json.meta.limit,
    totalPages: json.meta.totalPages,
  };
}

/**
 * Query low-stock items and alert counts
 */
export async function getLowStockAlerts(limit = 20): Promise<LowStockSummary> {
  const res = await fetchWithAuth(`${API_BASE}/admin/inventory/low-stock?limit=${limit}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch low stock alerts');
  }

  return res.json();
}
