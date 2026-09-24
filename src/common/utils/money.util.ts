/**
 * Tien te la JPY — khong co phan le. Moi phep tinh giu nguyen so nguyen yen
 * va lam tron theo BR-38 (lam tron xuong den don vi yen).
 */
export const CURRENCY = 'JPY';

export function yen(value: number): number {
  return Math.floor(value);
}

export function sumLines(lines: { unitPrice: number; quantity: number }[]): number {
  return yen(lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0));
}

/** Thue tieu thu Nhat Ban — mac dinh 10 %, cau hinh duoc tai SA-43. */
export function applyTax(subtotal: number, taxRatePercent: number): number {
  return yen((subtotal * taxRatePercent) / 100);
}
