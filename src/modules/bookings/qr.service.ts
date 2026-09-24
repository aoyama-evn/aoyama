import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as QRCode from 'qrcode';
import { Repository } from 'typeorm';
import { BookingStatus } from 'src/common/enums';
import { generatePublicToken, hoursBetween } from 'src/common/utils';
import { Booking } from './entities/booking.entity';

export interface QrScanResult {
  valid: boolean;
  reason?: 'NOT_FOUND' | 'ALREADY_RECEIVED' | 'CANCELLED' | 'EXPIRED' | 'NOT_CONFIRMED';
  message?: string;
  booking?: Booking;
}

/**
 * M-05 — Ma QR va tiep nhan xe. FR-QR-01..08, BR-17.
 * QR sinh khi lich hen duoc xac nhan; ma chi dung duoc mot lan.
 */
@Injectable()
export class QrService {
  constructor(@InjectRepository(Booking) private readonly repo: Repository<Booking>) {}

  /** FR-QR-01 — sinh token QR khi lich hen chuyen sang CONFIRMED. */
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

  /** Dung khi le tan nhap tay ma lich hen thay vi quet — FR-QR-08. */
  async validateByCode(code: string): Promise<QrScanResult> {
    const booking = await this.repo.findOne({ where: { code: code.trim().toUpperCase() } });
    if (!booking) {
      return { valid: false, reason: 'NOT_FOUND', message: 'Ma lich hen khong ton tai' };
    }
    if (!booking.qrToken) {
      throw new BadRequestException({
        code: 'QR_NOT_ISSUED',
        message: 'Lich hen chua duoc xac nhan nen chua co ma QR',
      });
    }
    return this.validate(booking.qrToken);
  }
}
