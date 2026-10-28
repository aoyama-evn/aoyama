import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthUser, STORE_FORCE_KEY, STORE_LOOKUP_KEY, StoreLookup } from '../decorators';
import { AdminRole, UserRole } from '../enums';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cua hang ma tai khoan bi gioi han vao, hoac undefined neu duoc xem het.
 * Dung cho vai tuyen co dang tra ve khong di qua bo loc `storeId` thong
 * thuong nen guard khong tu ep duoc.
 */
export function restrictedStoreId(user: AuthUser | undefined): string | undefined {
  if (!user || user.role !== UserRole.ADMIN || user.adminRole !== AdminRole.STAFF) {
    return undefined;
  }
  return user.storeId ?? undefined;
}

/**
 * Gioi han du lieu theo cua hang — OQ-02.
 *
 * ADMIN toan quyen va xem duoc moi chi nhanh. STAFF chi lam viec voi cua
 * hang minh thuoc ve: guard ep bo loc `storeId` vao yeu cau (de nhan vien
 * khong tu doi sang chi nhanh khac bang cach sua dia chi) va doi chieu cua
 * hang cua ban ghi ma yeu cau dang tro toi.
 *
 * Dat sau AdminGuard va RolesGuard. Khong thay the chung: hai guard kia lo
 * "duoc vao man nao", guard nay lo "thay duoc du lieu nao".
 *
 * Guard chay truoc ValidationPipe nen than yeu cau o day van la du lieu tho.
 * Vi vay moi gia tri deu phai qua UUID truoc khi dem di truy van; gia tri sai
 * dinh dang cu de nguyen cho ValidationPipe tra 400 nhu thuong le.
 */
@Injectable()
export class StoreScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    // Khach va tai khoan ADMIN khong bi gioi han o day.
    if (!user || user.role !== UserRole.ADMIN || user.adminRole !== AdminRole.STAFF) return true;

    const storeId = user.storeId;
    if (!storeId) {
      // Tai khoan nhan vien khong gan cua hang la cau hinh sai — chan han,
      // vi neu cho qua thi hoa ra lai thay het moi chi nhanh.
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Tai khoan nhan vien chua duoc gan cua hang',
      });
    }

    const targets =
      this.reflector.getAllAndOverride<('query' | 'body')[]>(STORE_FORCE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const body = request.body as Record<string, unknown> | undefined;
    const coThan = !!body && typeof body === 'object' && !Array.isArray(body);
    if (targets.includes('query')) request.query.storeId = storeId;
    if (targets.includes('body') && coThan) body!.storeId = storeId;

    const lookups =
      this.reflector.getAllAndOverride<StoreLookup[]>(STORE_LOOKUP_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    for (const lookup of lookups) {
      const nguon = lookup.from === 'body' ? (coThan ? body : undefined) : request.params;
      const gia = (nguon as Record<string, unknown> | undefined)?.[lookup.param];
      const ids = (Array.isArray(gia) ? gia : [gia]).filter(
        (x): x is string => typeof x === 'string' && UUID.test(x),
      );
      for (const id of ids) {
        const rows: { store_id: string | null }[] = await this.dataSource.query(lookup.sql, [id]);
        // Khong co ban ghi thi de service tra 404 nhu thuong le — bao 403 o day
        // se khien ma khong ton tai va ma cua chi nhanh khac tra ve khac nhau.
        if (rows.length === 0) continue;
        // store_id rong nghia la ban ghi dung chung cho ca chuoi — thong bao
        // he thong chang han. Moi cua hang deu doc duoc.
        if (rows[0].store_id !== null && rows[0].store_id !== storeId) {
          throw new ForbiddenException({
            code: 'FORBIDDEN',
            message: 'Du lieu thuoc cua hang khac',
          });
        }
      }
    }

    return true;
  }
}
