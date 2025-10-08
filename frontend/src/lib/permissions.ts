import { UserRole } from '@/types'

export enum Permission {
  // Inventario
  INVENTORY_READ = 'inventory:read',
  INVENTORY_WRITE = 'inventory:write',

  // Productos
  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',

  // Reportes
  REPORTS_SALES = 'reports:sales',
  REPORTS_INVENTORY = 'reports:inventory',
  REPORTS_FINANCIAL = 'reports:financial',
  REPORTS_ALL = 'reports:all',

  // Usuarios
  USERS_MANAGE = 'users:manage',

  // Configuración
  CONFIG_MANAGE = 'config:manage',

  // Caja
  CASH_REGISTER_MANAGE = 'cash_register:manage',
  CASH_REGISTER_VIEW = 'cash_register:view',
}

// Mapa de permisos por rol (debe coincidir con backend)
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.INVENTORY_READ,
    Permission.INVENTORY_WRITE,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.REPORTS_SALES,
    Permission.REPORTS_INVENTORY,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_ALL,
    Permission.USERS_MANAGE,
    Permission.CONFIG_MANAGE,
    Permission.CASH_REGISTER_MANAGE,
    Permission.CASH_REGISTER_VIEW,
  ],
  [UserRole.MANAGER]: [
    Permission.INVENTORY_READ,
    Permission.INVENTORY_WRITE,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.REPORTS_SALES,
    Permission.REPORTS_INVENTORY,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_ALL,
    Permission.CASH_REGISTER_MANAGE,
    Permission.CASH_REGISTER_VIEW,
  ],
  [UserRole.CASHIER]: [
    Permission.PRODUCTS_READ,
    Permission.INVENTORY_READ, // Solo para ver disponibilidad
    Permission.REPORTS_SALES, // Solo sus propias ventas
    Permission.CASH_REGISTER_VIEW,
  ],
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

/**
 * Verifica si un rol tiene al menos uno de los permisos especificados
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Verifica si un rol puede escribir en inventario (ajustar stock)
 */
export function canWriteInventory(role: UserRole): boolean {
  return hasPermission(role, Permission.INVENTORY_WRITE)
}

/**
 * Verifica si un rol puede ver reportes financieros
 */
export function canViewFinancialReports(role: UserRole): boolean {
  return hasPermission(role, Permission.REPORTS_FINANCIAL)
}

/**
 * Verifica si un rol puede gestionar usuarios
 */
export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, Permission.USERS_MANAGE)
}
