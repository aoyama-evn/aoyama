import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AdminRole, UserRole } from '../enums';

export interface AuthUser {
  sub: string;
  role: UserRole;
  adminRole?: AdminRole;
  phone?: string;
  storeId?: string | null;
  name?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    return data && user ? user[data] : user;
  },
);
