import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsNull, LessThan, Repository } from 'typeorm';
import { generateNumericOtp, normalizePhone } from 'src/common/utils';
import { OtpCode } from './entities/otp-code.entity';

export type OtpPurpose = 'LOGIN' | 'REGISTER' | 'BOOKING_VERIFY';

/**
 * Sinh va kiem tra ma OTP — FR-AUTH-03, FR-AUTH-04, BR-02, BR-03.
 * Ma goc khong bao gio duoc luu; chi luu bam bcrypt (NFR-SE-05).
 */
@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpCode) private readonly repo: Repository<OtpCode>,
    private readonly config: ConfigService,
  ) {}

  /**
   * Tao ma moi. Tra ve ca ma goc de tang gui di ngay trong cung mot luot,
   * khong luu lai o bat ky dau khac.
   */
  async issue(
    rawPhone: string,
    purpose: OtpPurpose,
    ipAddress?: string,
  ): Promise<{ code: string; expiresAt: Date }> {
    const phone = normalizePhone(rawPhone);
    const length = this.config.get<number>('auth.otp.length', 6);
    const ttl = this.config.get<number>('auth.otp.ttlSeconds', 300);
    const cooldown = this.config.get<number>('auth.otp.resendCooldownSeconds', 60);

    // BR-03 — chan gui lien tiep qua nhanh cho cung mot so.
    const recent = await this.repo.findOne({
      where: { phone, purpose, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < cooldown * 1000) {
      const waitSeconds = Math.ceil(
        (cooldown * 1000 - (Date.now() - recent.createdAt.getTime())) / 1000,
      );
      throw new BadRequestException({
        code: 'OTP_COOLDOWN',
        message: `Vui long doi ${waitSeconds} giay truoc khi gui lai ma`,
        details: { waitSeconds },
      });
    }

    // Vo hieu hoa cac ma cu chua dung de chi mot ma con hieu luc tai mot thoi diem.
    await this.repo.update({ phone, purpose, consumedAt: IsNull() }, { consumedAt: new Date() });

    const code = generateNumericOtp(length);
    const expiresAt = new Date(Date.now() + ttl * 1000);
    await this.repo.save(
      this.repo.create({
        phone,
        purpose,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt,
        ipAddress: ipAddress ?? null,
      }),
    );
    return { code, expiresAt };
  }

  /** Kiem tra ma. Dung xong thi danh dau da tieu de khong dung lai duoc. */
  async verify(rawPhone: string, purpose: OtpPurpose, code: string): Promise<void> {
    const phone = normalizePhone(rawPhone);
    const maxAttempts = this.config.get<number>('auth.otp.maxAttempts', 5);

    const record = await this.repo.findOne({
      where: { phone, purpose, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!record) {
      throw new BadRequestException({
        code: 'OTP_NOT_FOUND',
        message: 'Chua co ma xac thuc nao duoc gui cho so nay',
      });
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException({ code: 'OTP_EXPIRED', message: 'Ma xac thuc da het han' });
    }
    if (record.attemptCount >= maxAttempts) {
      throw new BadRequestException({
        code: 'OTP_TOO_MANY_ATTEMPTS',
        message: 'Nhap sai qua nhieu lan, vui long yeu cau ma moi',
      });
    }

    const matched = await bcrypt.compare(code, record.codeHash);
    if (!matched) {
      record.attemptCount += 1;
      await this.repo.save(record);
      throw new BadRequestException({
        code: 'OTP_INVALID',
        message: 'Ma xac thuc khong dung',
        details: { remainingAttempts: Math.max(0, maxAttempts - record.attemptCount) },
      });
    }

    record.consumedAt = new Date();
    await this.repo.save(record);
  }

  /** Don ma het han — chay dinh ky de bang khong phinh vo han. */
  async purgeExpired(): Promise<number> {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date(Date.now() - 86_400_000)),
    });
    return result.affected ?? 0;
  }
}
