/**
 * Vai tro — OV-2026-001 §6. Chot ba vai tro.
 * Viec tach rieng ky thuat vien / quan ly cua hang la OQ-01, OQ-02.
 */
export enum UserRole {
  GUEST = 'R-GUEST',
  USER = 'R-USER',
  ADMIN = 'R-ADMIN',
}

/** Phan cap trong trang quan tri — ADMIN toan quyen, STAFF han che theo RD §8. */
export enum AdminRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}
