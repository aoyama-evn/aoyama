import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'auditAction';

export interface AuditMeta {
  action: string;
  entity: string;
}

/** Danh dau hanh dong can ghi nhat ky thao tac — FR-SYS-03. */
export const Audit = (action: string, entity: string) =>
  SetMetadata(AUDIT_KEY, { action, entity } as AuditMeta);
