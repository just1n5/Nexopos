import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/entities/user.entity';

/**
 * Guard que solo permite acceso a SUPER_ADMIN
 * Este rol es para gestión de plataforma y beta keys
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No estás autenticado');
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo super administradores pueden acceder a esta funcionalidad');
    }

    return true;
  }
}
