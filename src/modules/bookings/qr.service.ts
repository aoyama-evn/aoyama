import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as QRCode from 'qrcode';
import { Repository } from 'typeorm';
import { BookingStatus } from 'src/common/enums';
import { generatePublicToken, hoursBetween } from 'src/common/utils';
import { Booking } from './entities/booking.entity';

/** Bo moi ky tu khong phai chu hoac so de so khop bien so khong phu thuoc cach go. */
/** Chi giu chu so — de so khop khong phu thuoc cach go hay ma vung. */
function squashPhone(phone: string): string {
  return (phone ?? '').replace(/[^0-9]/g, '');
}

function squashPlate(plate: string): string {
  return (plate ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export interface QrScanResult {
  valid: boolean;
  reason?: 'NOT_FOUND' | 'ALREADY_RECEIVED' | 'CANCELLED' | 'EXPIRED' | 'NOT_CONFIRMED';
  message?: string;
  booking?: Booking;
}

/**
 * M-05 — Ma QR va tiep nhan xe. FR-QR-01..08, BR-17.
 *
 * Ma QR sinh ngay khi khach dat lich thanh cong de SC-16 hien duoc cho khach
 * luu lai. Viec quet ma van doi lich hen o trang thai CONFIRMED (xem validate),
 * nen co ma khong dong nghia da duoc tiep nhan.
 */
@Injectable()
export class QrService {
  constructor(@InjectRepository(Booking) private readonly repo: Repository<Booking>) {}

  /** FR-QR-01 — sinh token QR khi tao lich hen; goi lai khong cap ma moi. */
  async issueToken(booking: Booking): Promise<string> {
    if (!booking.qrToken) {
      booking.qrToken = generatePublicToken();
      booking.qrIssuedAt = new Date();
      await this.repo.save(booking);
    }
    return booking.qrToken;
  }

  /** FR-QR-02 — anh QR dang data URL de SC-22 hien va khach chup man hinh duoc. */
  async renderDataUrl(token: string): Promise<string> {
    return QRCode.toDataURL(token, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 512,
    });
  }

  /**
   * FR-QR-05, BR-17 — kiem tra ma khi le tan quet tai SA-07.
   * Tra ve ly do cu the thay vi chi bao khong hop le, vi nhan vien can biet
   * nen bao khach dieu gi (da tiep nhan, da huy, hay qua han).
   */
  async validate(token: string): Promise<QrScanResult> {
    const booking = await this.repo.findOne({
      where: { qrToken: token },
      relations: { customer: true, vehicle: true, store: true, services: true },
    });

    if (!booking) {
      return { valid: false, reason: 'NOT_FOUND', message: 'Ma QR khong ton tai' };
    }
    if (booking.status === BookingStatus.CANCELLED) {
      return { valid: false, reason: 'CANCELLED', message: 'Lich hen da bi huy', booking };
    }
    if (booking.status === BookingStatus.RECEIVED || booking.status === BookingStatus.DONE) {
      return {
        valid: false,
        reason: 'ALREADY_RECEIVED',
        message: 'Lich hen nay da duoc tiep nhan',
        booking,
      };
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      return {
        valid: false,
        reason: 'NOT_CONFIRMED',
        message: 'Lich hen chua duoc xac nhan',
        booking,
      };
    }

    // BR-17 — ma het hieu luc sau 24 tieng ke tu gio hen.
    if (hoursBetween(booking.scheduledAt, new Date()) > 24) {
      return { valid: false, reason: 'EXPIRED', message: 'Ma QR da qua han su dung', booking };
    }

    return { valid: true, booking };
  }

  /** Danh dau ma da dung — goi trong cung giao dich voi buoc tiep nhan xe. */
  async markUsed(bookingId: string): Promise<void> {
    await this.repo.update(bookingId, { qrUsedAt: new Date() });
  }

  async findByToken(token: string): Promise<Booking> {
    const booking = await this.repo.findOne({ where: { qrToken: token } });
    if (!booking) {
      throw new NotFoundException({ code: 'QR_NOT_FOUND', message: 'Ma QR khong ton tai' });
    }
    return booking;
  }

  /**
   * SA-07 — tra theo bien so khi khach khong mo duoc ma QR va khong nho ma
   * lich hen.
   *
   * So khop long: bo het dau cach, gach va cham roi moi so, vi bien so duoc
   * go moi noi mot kieu (29T1-122.12, 29T1.122.12, 29t1 12212) va may doc anh
   * cung tra ve khong thong nhat.
   */
  /**
   * SA-07 — mot o tim duy nhat: go bien so HAY so dien thoai deu duoc.
   *
   * Le tan khong nen phai chon truoc minh dang go cai gi. Nhin vao chuoi
   * la doan duoc: toan chu so thi gan nhu chac chan la so dien thoai, con
   * lai thi la bien so. Doan sai cung khong sao — thu not kieu kia truoc
   * khi bao khong tim thay.
   */
  async validateBySearch(term: string): Promise<QrScanResult> {
    const raw = (term ?? '').trim();
    const digitsOnly = squashPhone(raw);
    const looksLikePhone = digitsOnly.length >= 6 && digitsOnly.length === raw.replace(/[\s\-+().]/g, '').length;

    if (raw.length < 4) {
      throw new BadRequestException({
        code: 'SEARCH_TOO_SHORT',
        message: 'Can it nhat 4 ky tu de tra cuu',
      });
    }

    const order = looksLikePhone
      ? [() => this.findByPhone(raw), () => this.findByPlate(raw)]
      : [() => this.findByPlate(raw), () => this.findByPhone(raw)];

    for (const find of order) {
      const booking = await find();
      if (!booking) continue;
      if (!booking.qrToken) {
        return { valid: false, reason: 'NOT_FOUND', message: 'Lich hen nay chua co ma QR', booking };
      }
      return this.validate(booking.qrToken);
    }

    return {
      valid: false,
      reason: 'NOT_FOUND',
      message: 'Khong tim thay lich hen nao cho bien so hay so dien thoai nay',
    };
  }

  /** Mot xe hay mot khach co the co nhieu lich — xem ghi chu o scopeToBooking. */
  private async findByPhone(phone: string): Promise<Booking | null> {
    const needle = squashPhone(phone);
    if (needle.length < 6) return null;

    /**
     * Go du so thi phai khop chinh xac.
     *
     * So khop theo duoi rat tien khi le tan chi nho may so cuoi, nhung
     * "+84969376966" va "+81969376966" la hai nguoi khac nhau ma chung
     * nhau chin so cuoi. Nen: co dau cong hoac go tu 10 so tro len thi
     * doi khop tron; ngan hon moi cho khop duoi.
     */
    const exactOnly = phone.trim().startsWith('+') || needle.length >= 10;
    const match = exactOnly
      ? `(regexp_replace(b.contact_phone, '[^0-9]', '', 'g') = :needle
          OR regexp_replace(c.phone, '[^0-9]', '', 'g') = :needle)`
      : `(regexp_replace(b.contact_phone, '[^0-9]', '', 'g') LIKE :tail
          OR regexp_replace(c.phone, '[^0-9]', '', 'g') LIKE :tail)`;

    return this.scopeToBooking()
      .where(match, { needle, tail: `%${needle}` })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .getOne();
  }

  private async findByPlate(plate: string): Promise<Booking | null> {
    const needle = squashPlate(plate);
    if (needle.length < 4) return null;
    return this.scopeToBooking()
      .where("regexp_replace(upper(v.plate_number), '[^A-Z0-9]', '', 'g') = :needle", { needle })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .getOne();
  }

  /**
   * Khung truy van dung chung cho hai cach tim.
   *
   * Mot xe hay mot khach co the co nhieu lich hen. Le tan dang can cai
   * khach toi hom nay, nen uu tien lich con cho xu ly truoc, roi moi den
   * lich gan nhat.
   */
  private scopeToBooking() {
    return this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.customer', 'c')
      .leftJoinAndSelect('b.vehicle', 'v')
      .leftJoinAndSelect('b.store', 's')
      .leftJoinAndSelect('b.services', 'bs')
      /**
       * Le tan dang doi mot khach den nhan xe, nen lich DA XAC NHAN phai
       * len truoc: do la cai co the tiep nhan ngay. Lich con cho xac nhan
       * xep sau, lich da xong xep cuoi.
       */
      .addSelect(
        `CASE b.status
           WHEN '${BookingStatus.CONFIRMED}' THEN 0
           WHEN '${BookingStatus.PENDING}' THEN 1
           ELSE 2 END`,
        'uu_tien',
      )
      .orderBy('uu_tien', 'ASC')
      .addOrderBy('b.scheduledAt', 'ASC');
  }

  /** Dung khi le tan nhap tay ma lich hen thay vi quet — FR-QR-08. */
  async validateByCode(code: string): Promise<QrScanResult> {
    const booking = await this.repo.findOne({ where: { code: code.trim().toUpperCase() } });
    if (!booking) {
      return { valid: false, reason: 'NOT_FOUND', message: 'Ma lich hen khong ton tai' };
    }
    if (!booking.qrToken) {
      throw new BadRequestException({
        code: 'QR_NOT_ISSUED',
        message: 'Lich hen nay chua co ma QR',
      });
    }
    return this.validate(booking.qrToken);
  }
}
