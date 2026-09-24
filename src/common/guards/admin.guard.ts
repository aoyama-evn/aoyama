import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../decorators';
import { UserRole } from '../enums';

/** Chi cho phep tai khoan quan tri — dung o cap controller cho toan bo /admin. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Khong du quyen truy cap' });
    }
    return true;
  }
}
