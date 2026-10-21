import { Role } from '@prisma/client';

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

export type PermissionMatrix = Record<
  Role,
  Partial<Record<AppModule, ModuleAction[]>>
>;

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

const CRUD_ACTIONS: ModuleAction[] = ['create', 'read', 'update', 'delete'];
const CRU_ACTIONS: ModuleAction[] = ['create', 'read', 'update'];

export const ROLE_PERMISSIONS: PermissionMatrix = {
  [Role.SUPER_ADMIN]: ALL_MODULES.reduce(
    (acc, module) => {
      acc[module] = [...CRUD_ACTIONS];
      return acc;
    },
    {} as Partial<Record<AppModule, ModuleAction[]>>,
  ),

  [Role.ADMIN]: ALL_MODULES.reduce(
    (acc, module) => {
      // Admin can create, read, and update on all modules, but CANNOT delete anything
      acc[module] = [...CRU_ACTIONS];
      return acc;
    },
    {} as Partial<Record<AppModule, ModuleAction[]>>,
  ),

  [Role.SHOP_MANAGER]: {
    products: ['create', 'read', 'update', 'delete'],
    variants: ['create', 'read', 'update', 'delete'],
    categories: ['create', 'read', 'update'],
    brands: ['create', 'read', 'update'],
    attributes: ['create', 'read', 'update'],
    orders: ['read', 'update'],
    inventory: ['read', 'update'],
    reports: ['read'],
  },

  [Role.CUSTOMER]: {},
};

export function hasPermission(
  role: Role,
  module: AppModule,
  action: ModuleAction,
): boolean {
  if (role === Role.SUPER_ADMIN) {
    return true;
  }
  const roleRules = ROLE_PERMISSIONS[role];
  if (!roleRules) {
    return false;
  }
  const moduleActions = roleRules[module];
  if (!moduleActions) {
    return false;
  }
  return moduleActions.includes(action);
}
