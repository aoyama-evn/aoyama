import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser, ROLES_KEY } from '../decorators';
import { AdminRole, UserRole } from '../enums';

/**
 * Chan theo vai tro quan tri. Moi tuyen /admin deu yeu cau R-ADMIN;
 * Roles(AdminRole.ADMIN) thu hep them cho thao tac chi Admin duoc lam.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user || user.role !== UserRole.ADMIN || !user.adminRole) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Khong du quyen truy cap' });
    }
    if (!required.includes(user.adminRole)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Khong du quyen truy cap' });
    }
    return true;
  }
}
