import { SetMetadata } from '@nestjs/common';

export enum Permission {
  // Inventario
  INVENTORY_READ = 'inventory:read',
  INVENTORY_CREATE = 'inventory:create',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_DELETE = 'inventory:delete',
  INVENTORY_ADJUST = 'inventory:adjust', // Ajustar stock manualmente
  
  // Productos
  PRODUCTS_READ = 'products:read',
  PRODUCTS_CREATE = 'products:create',
  PRODUCTS_UPDATE = 'products:update',
  PRODUCTS_DELETE = 'products:delete',
  
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

  // Super Admin
  TENANTS_MANAGE = 'tenants:manage',
  BETA_KEYS_MANAGE = 'beta_keys:manage',
}

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
