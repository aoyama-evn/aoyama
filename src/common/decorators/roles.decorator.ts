import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../enums';

export const ROLES_KEY = 'adminRoles';
/** Gioi han theo vai tro trong trang quan tri — RD-2026-001 muc 8. */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
