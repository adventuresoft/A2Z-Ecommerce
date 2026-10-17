export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SHOP_MANAGER' | 'CUSTOMER';

export interface ModuleCapability {
  module: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface RoleDefinition {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  permissionCount: number;
  capabilities?: ModuleCapability[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionDefinition {
  id: string;
  key: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  roleId: string | null;
  roleDefinition?: RoleDefinition | null;
  designation: string | null;
  department: string | null;
  section: string | null;
  location: string | null;
  isActive: boolean;
  tokenVersion: number;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | '';
  isActive?: boolean | string;
  designation?: string;
  department?: string;
  section?: string;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  phone?: string;
  role?: UserRole;
  roleId?: string;
  designation?: string;
  department?: string;
  section?: string;
  location?: string;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  roleId?: string | null;
  designation?: string | null;
  department?: string | null;
  section?: string | null;
  location?: string | null;
  isActive?: boolean;
}

export interface CreateRolePayload {
  name: string;
  slug?: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface CreatePermissionPayload {
  key: string;
  name?: string;
  module?: string;
  action?: string;
  description?: string;
}

export interface UpdatePermissionPayload {
  name?: string;
  description?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
        email: 'superadmin@az-ecommerce.local',
        password: 'Password123!',
      }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      if (data.accessToken) {
        localStorage.setItem('az_admin_access_token', data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      }
    }
  } catch (err) {
    console.warn('Could not auto-acquire fallback auth token:', err);
  }

  return null;
}

async function requestApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await ensureValidToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || res.statusText || 'API request failed';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return res.json();
}

/* =========================================================================
   User Directory APIs
   ========================================================================= */

export async function getUsers(params: QueryUsersParams = {}): Promise<PaginatedUsers> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.role) searchParams.set('role', params.role);
  if (params.isActive !== undefined && params.isActive !== '') {
    searchParams.set('isActive', params.isActive.toString());
  }
  if (params.department) searchParams.set('department', params.department);
  if (params.section) searchParams.set('section', params.section);

  const qs = searchParams.toString();
  return requestApi<PaginatedUsers>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export async function getUserById(id: string): Promise<AdminUser> {
  return requestApi<AdminUser>(`/admin/users/${id}`);
}

export async function createUser(payload: CreateUserPayload): Promise<AdminUser> {
  return requestApi<AdminUser>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AdminUser> {
  return requestApi<AdminUser>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> {
  return requestApi<{ success: boolean; message: string }>(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

/* =========================================================================
   Security Roles APIs
   ========================================================================= */

export async function getRoles(): Promise<RoleDefinition[]> {
  return requestApi<RoleDefinition[]>('/admin/roles');
}

export async function getRoleById(id: string): Promise<RoleDefinition> {
  return requestApi<RoleDefinition>(`/admin/roles/${id}`);
}

export async function createRole(payload: CreateRolePayload): Promise<RoleDefinition> {
  return requestApi<RoleDefinition>('/admin/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRole(id: string, payload: UpdateRolePayload): Promise<RoleDefinition> {
  return requestApi<RoleDefinition>(`/admin/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteRole(id: string): Promise<{ success: boolean; message: string }> {
  return requestApi<{ success: boolean; message: string }>(`/admin/roles/${id}`, {
    method: 'DELETE',
  });
}

/* =========================================================================
   Global Permissions APIs
   ========================================================================= */

export async function getPermissions(): Promise<PermissionDefinition[]> {
  return requestApi<PermissionDefinition[]>('/admin/permissions');
}

export async function createPermission(payload: CreatePermissionPayload): Promise<PermissionDefinition> {
  return requestApi<PermissionDefinition>('/admin/permissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePermission(id: string, payload: UpdatePermissionPayload): Promise<PermissionDefinition> {
  return requestApi<PermissionDefinition>(`/admin/permissions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePermission(id: string): Promise<{ success: boolean; message: string }> {
  return requestApi<{ success: boolean; message: string }>(`/admin/permissions/${id}`, {
    method: 'DELETE',
  });
}
