export type ModuleAction = 'create' | 'read' | 'update' | 'delete';

export type AppModule =
  | 'products'
  | 'categories'
  | 'brands'
  | 'attributes'
  | 'variants'
  | 'orders'
  | 'inventory'
  | 'customers'
  | 'marketing'
  | 'payments'
  | 'shipping'
  | 'engagement'
  | 'reports'
  | 'settings'
  | 'users';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SHOP_MANAGER' | 'CUSTOMER';

const ALL_MODULES: AppModule[] = [
  'products',
  'categories',
  'brands',
  'attributes',
  'variants',
  'orders',
  'inventory',
  'customers',
  'marketing',
  'payments',
  'shipping',
  'engagement',
  'reports',
  'settings',
  'users',
];

export const CLIENT_ROLE_PERMISSIONS: Record<
  UserRole,
  Partial<Record<AppModule, ModuleAction[]>>
> = {
  SUPER_ADMIN: ALL_MODULES.reduce(
    (acc, mod) => {
      acc[mod] = ['create', 'read', 'update', 'delete'];
      return acc;
    },
    {} as Partial<Record<AppModule, ModuleAction[]>>,
  ),

  ADMIN: ALL_MODULES.reduce(
    (acc, mod) => {
      // Admin can create, read, and update, but NEVER delete
      acc[mod] = ['create', 'read', 'update'];
      return acc;
    },
    {} as Partial<Record<AppModule, ModuleAction[]>>,
  ),

  SHOP_MANAGER: {
    products: ['create', 'read', 'update', 'delete'],
    variants: ['create', 'read', 'update', 'delete'],
    categories: ['create', 'read', 'update'],
    brands: ['create', 'read', 'update'],
    attributes: ['create', 'read', 'update'],
    marketing: ['create', 'read', 'update'],
    orders: ['read', 'update'],
    inventory: ['read', 'update'],
    reports: ['read'],
  },

  CUSTOMER: {},
};

export function checkPermission(
  role: UserRole | undefined,
  module: AppModule,
  action: ModuleAction,
): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  const roleRules = CLIENT_ROLE_PERMISSIONS[role];
  if (!roleRules) return false;
  const moduleActions = roleRules[module];
  if (!moduleActions) return false;
  return moduleActions.includes(action);
}
