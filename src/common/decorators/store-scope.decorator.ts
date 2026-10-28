import { SetMetadata } from '@nestjs/common';

export const STORE_LOOKUP_KEY = 'storeLookup';
export const STORE_FORCE_KEY = 'storeForce';

/**
 * Cach tra ra cua hang cua mot ban ghi ma yeu cau dang tro toi.
 *
 * `sql` phai tra ve dung mot cot ten `store_id`; `$1` la gia tri doc duoc.
 * Cau lenh nam ngay trong ma nguon chu khong ghep tu du lieu nguoi dung nen
 * khong co duong chen SQL. Gia tri la mang thi moi phan tu deu phai thuoc
 * cua hang cua nguoi dang dang nhap.
 */
export interface StoreLookup {
  /** Doc tu tham so duong dan hay tu than yeu cau. Mac dinh la duong dan. */
  from?: 'params' | 'body';
  /** Ten tham so hoac ten truong — vi du 'id', 'workOrderId', 'bookingId'. */
  param: string;
  sql: string;
}

/**
 * Khai bao cach doi chieu cua hang cho cac tuyen co tham so.
 * Dat o cap controller; guard chi xet nhung muc thuc su co gia tri trong
 * yeu cau dang goi, nen mot controller tron nhieu kieu tham so van dung.
 */
export const ScopeByStore = (...lookups: StoreLookup[]) => SetMetadata(STORE_LOOKUP_KEY, lookups);

/**
 * Ep bo loc cua hang vao yeu cau truoc khi no toi controller.
 *
 * 'query' dung cho man danh sach, 'body' dung cho thao tac tao moi. Chi dat
 * o nhung tuyen ma DTO that su co truong `storeId`: ValidationPipe bat
 * forbidNonWhitelisted nen them truong la vao DTO khong khai bao se thanh 400.
 */
export const ForceStoreFilter = (...targets: ('query' | 'body')[]) =>
  SetMetadata(STORE_FORCE_KEY, targets.length > 0 ? targets : ['query']);
