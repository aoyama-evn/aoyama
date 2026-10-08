import { networkInterfaces } from 'node:os';
import { registerAs } from '@nestjs/config';

/** Cong mac dinh cua giao dien web — doi theo FE thi sua o day. */
const WEB_PORT = process.env.WEB_PORT ?? '3000';

/**
 * Dia chi giao dien web khi khong khai bao WEB_URL.
 *
 * Duong dan nay di vao tin nhan gui cho khach ("xem bao gia", "theo doi
 * tien do"), nen no phai mo duoc tren DIEN THOAI cua khach chu khong phai
 * tren may dang chay may chu. Lay localhost lam mac dinh thi tren dien
 * thoai "localhost" lai la chinh cai dien thoai do — bam vao khong ra gi.
 *
 * O moi truong phat trien, doan dia chi mang noi bo cua may dang chay:
 * demo trong cung mang thi bam duoc that. Ban that thi khong doan — ngoai
 * do bat buoc phai dat WEB_URL tro ve ten mien, va doan bay thi con te
 * hon la de localhost cho nguoi ta nhin ra ngay la thieu cau hinh.
 */
function diaChiWebMacDinh(): string {
  if ((process.env.NODE_ENV ?? 'development') === 'production') {
    return `http://localhost:${WEB_PORT}`;
  }

  const ungVien = Object.values(networkInterfaces())
    .flatMap((list) => list ?? [])
    .filter((net) => net.family === 'IPv4' && !net.internal && uuTien(net.address) > 0)
    .sort((a, b) => uuTien(b.address) - uuTien(a.address));

  return `http://${ungVien[0]?.address ?? 'localhost'}:${WEB_PORT}`;
}

/**
 * Xep hang cac dia chi IPv4 theo kha nang may khac trong phong goi toi duoc.
 *
 * Mot may lap trinh thuong co vai card mang cung luc. Ngoai card that cam
 * day mang con co switch ao cua Hyper-V, Docker hay WSL — chung cung mang
 * dia chi "noi bo" hop le nhung chi noi duoc voi may ao tren chinh may do,
 * dien thoai cua khach goi vao thi khong thay gi. Cac card ao nay hau het
 * nam trong dai 172.16-31, con mang cong ty va mang nha thuong la 10.x
 * hoac 192.168.x — nen uu tien hai dai do truoc.
 *
 * Tra 0 nghia la khong dung duoc: dia chi cong cong, hoac 169.254.x la
 * dia chi tu phat khi khong xin duoc DHCP.
 */
function uuTien(dia: string): number {
  if (dia.startsWith('169.254.')) return 0;
  if (/^192\.168\./.test(dia)) return 3;
  if (/^10\./.test(dia)) return 3;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(dia)) return 1;
  return 0;
}

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  /** C-03 — moi xu ly nghiep vu chay theo gio Nhat Ban. */
  timezone: process.env.APP_TIMEZONE ?? 'Asia/Tokyo',
  /**
   * Ban demo cong khai duoc tra ma OTP thang ve giao dien.
   *
   * Mac dinh tat. Xem AuthService.exposeOtpCode de biet vi sao day la mot lo
   * hong co chu y chu khong phai mot tien ich.
   */
  demoExposeOtp: process.env.DEMO_EXPOSE_OTP === 'true',

  /** Dia chi giao dien web — dung de dung duong dan trong email (SA-01b). */
  webUrl: process.env.WEB_URL ?? diaChiWebMacDinh(),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
}));
