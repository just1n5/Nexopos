import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '../entities/user.entity';

// Mapa de permisos por rol
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin tiene TODOS los permisos
    Permission.INVENTORY_READ,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_ADJUST,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_UPDATE,
    Permission.PRODUCTS_DELETE,
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
    // Manager tiene casi todos, excepto algunos admin-only
    Permission.INVENTORY_READ,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_ADJUST,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_UPDATE,
    Permission.PRODUCTS_DELETE,
    Permission.REPORTS_SALES,
    Permission.REPORTS_INVENTORY,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_ALL,
    Permission.CASH_REGISTER_MANAGE,
    Permission.CASH_REGISTER_VIEW,
    // NO tiene: USERS_MANAGE (limitado), CONFIG_MANAGE (limitado)
  ],
  [UserRole.CASHIER]: [
    // Cajero solo lectura y operaciones de venta
    Permission.PRODUCTS_READ,
    Permission.INVENTORY_READ, // Solo para ver disponibilidad
    Permission.REPORTS_SALES, // Solo sus propias ventas
    Permission.CASH_REGISTER_VIEW,
    // NO puede: crear/editar productos, ajustar stock, ver reportes financieros
  ],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; // Sin permisos requeridos = acceso libre
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    // Verificar si el usuario tiene al menos uno de los permisos requeridos
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(' or ')}`
      );
    }

    return true;
  }
}
