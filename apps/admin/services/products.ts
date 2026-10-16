export interface ProductImageItem {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface VariantAttributeValueItem {
  attributeValueId: string;
  value: string;
  label?: string | null;
  colorCode?: string | null;
  attributeName: string;
  attributeSlug: string;
}

export interface ProductVariantItem {
  id: string;
  productId: string;
  sku: string;
  barcode?: string | null;
  regularPrice: number;
  salePrice?: number | null;
  weightGrams?: number | null;
  imageId?: string | null;
  imageUrl?: string | null;
  image?: ProductImageItem | null;
  isActive: boolean;
  attributes: VariantAttributeValueItem[];
  productTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  thumbnailUrl?: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brandId?: string | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  isFeatured: boolean;
  isActive: boolean;
  images: ProductImageItem[];
  variants: ProductVariantItem[];
  primaryImage?: ProductImageItem | null;
  minPrice?: number;
  maxPrice?: number;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedProducts {
  items: ProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VariantQuery {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  isActive?: boolean;
}

export interface PaginatedVariants {
  items: ProductVariantItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateVariantPayload {
  sku: string;
  barcode?: string;
  regularPrice: number;
  salePrice?: number;
  weightGrams?: number;
  imageId?: string;
  imageUrl?: string;
  isActive?: boolean;
  attributeValueIds?: string[];
}

export interface CreateProductPayload {
  title: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  categoryId: string;
  brandId?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  variants?: CreateVariantPayload[];
  // Simple product shortcuts
  sku?: string;
  regularPrice?: number;
  salePrice?: number;
  weightGrams?: number;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface UpdateVariantPayload {
  sku?: string;
  barcode?: string;
  regularPrice?: number;
  salePrice?: number;
  weightGrams?: number;
  imageId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  attributeValueIds?: string[];
}

export interface UpdateImagePayload {
  altText?: string;
  isPrimary?: boolean;
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
    // Fallback silent fail
  }

  return null;
}

async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<Response> {
  const token = await ensureValidToken();
  const headers = new Headers(init.headers || {});

  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(
      `Cannot connect to API server at ${API_BASE}. Please ensure the NestJS backend is running.`,
    );
  }

  if (res.status === 401 && !isRetry && typeof window !== 'undefined') {
    localStorage.removeItem('az_admin_access_token');
    localStorage.removeItem('accessToken');
    const newToken = await ensureValidToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers || {});
      if (!retryHeaders.has('Content-Type') && !(init.body instanceof FormData)) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...init, headers: retryHeaders });
    }
  }

  return res;
}

export async function getProducts(query: ProductQuery = {}): Promise<PaginatedProducts> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.limit) params.set('limit', query.limit.toString());
  if (query.search) params.set('search', query.search);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.brandId) params.set('brandId', query.brandId);
  if (query.isActive !== undefined) params.set('isActive', query.isActive.toString());
  if (query.isFeatured !== undefined) params.set('isFeatured', query.isFeatured.toString());
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);

  const res = await fetchWithAuth(`${API_BASE}/admin/products?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch products');
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

export async function getProduct(idOrSlug: string): Promise<ProductItem> {
  const res = await fetchWithAuth(`${API_BASE}/admin/products/${encodeURIComponent(idOrSlug)}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch product details');
  }

  return res.json();
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductItem> {
  const res = await fetchWithAuth(`${API_BASE}/admin/products`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create product');
  }

  return res.json();
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<ProductItem> {
  const res = await fetchWithAuth(`${API_BASE}/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update product');
  }

  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/admin/products/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete product');
  }
}

export async function uploadProductImages(productId: string, files: File[]): Promise<ProductImageItem[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const res = await fetchWithAuth(`${API_BASE}/admin/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload product images');
  }

  return res.json();
}

export async function updateProductImage(
  productId: string,
  imageId: string,
  payload: UpdateImagePayload,
): Promise<ProductImageItem> {
  const res = await fetchWithAuth(`${API_BASE}/admin/products/${productId}/images/${imageId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update image details');
  }

  return res.json();
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/admin/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete image');
  }
}

export async function reorderProductImages(productId: string, imageIds: string[]): Promise<ProductImageItem[]> {
  const res = await fetchWithAuth(`${API_BASE}/admin/products/${productId}/images/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ imageIds }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to reorder images');
  }

  return res.json();
}

export async function getVariants(query: VariantQuery = {}): Promise<PaginatedVariants> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.limit) params.set('limit', query.limit.toString());
  if (query.search) params.set('search', query.search);
  if (query.productId) params.set('productId', query.productId);
  if (query.isActive !== undefined) params.set('isActive', query.isActive.toString());

  const res = await fetchWithAuth(`${API_BASE}/admin/variants?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch variants');
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

export async function updateVariant(id: string, payload: UpdateVariantPayload): Promise<ProductVariantItem> {
  const res = await fetchWithAuth(`${API_BASE}/admin/variants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update variant');
  }

  return res.json();
}

export async function deleteVariant(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/admin/variants/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete variant');
  }
}

export async function uploadProductImage(file: File): Promise<{ imageUrl: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetchWithAuth(`${API_BASE}/admin/products/upload-image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload product image');
  }

  return res.json();
}

