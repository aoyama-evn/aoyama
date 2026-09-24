import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuthUser } from 'src/common/decorators';
import {
  AdminRole,
  Language,
  NotificationChannel,
  NotificationEvent,
  UserRole,
} from 'src/common/enums';
import { normalizePhone } from 'src/common/utils';
import { AdminUser } from 'src/modules/admin-users/entities/admin-user.entity';
import { CustomersService } from 'src/modules/customers/customers.service';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { OtpPurpose, OtpService } from './otp.service';
import { TokenPair, TokenService } from './token.service';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

/**
 * M-01 — Xac thuc va tai khoan.
 * Khach dang nhap bang so dien thoai kem OTP (FR-AUTH-02, FR-AUTH-03);
 * tai khoan quan tri dung ten dang nhap va mat khau (FR-AUTH-09).
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(AdminUser) private readonly adminRepo: Repository<AdminUser>,
    private readonly customers: CustomersService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------- Khach hang (SC-17, SC-18, SC-19) ----------

  /**
   * Gui ma OTP. Tra ve cung mot phan hoi du so dien thoai da co tai khoan hay chua,
   * de khong lo danh sach khach hang (NFR-SE-06).
   */
  async requestOtp(
    rawPhone: string,
    purpose: OtpPurpose,
    language: Language = Language.JA,
    ipAddress?: string,
  ): Promise<{ expiresAt: Date }> {
    const phone = normalizePhone(rawPhone);
    const { code, expiresAt } = await this.otp.issue(phone, purpose, ipAddress);

    const customer = await this.customerRepo.findOne({ where: { phone } });
    await this.notifications.send({
      event: NotificationEvent.OTP,
      channel: NotificationChannel.SMS,
      language: customer?.language ?? language,
      recipient: phone,
      customerId: customer?.id ?? null,
      variables: { otpCode: code, minutes: Math.round((expiresAt.getTime() - Date.now()) / 60000) },
    });

    return { expiresAt };
  }

  /**
   * FR-AUTH-01, FR-AUTH-02 — dang ky va dang nhap di chung mot cua.
   * Ma dung thi tao ho so neu chua co, va nang ho so Guest len khach da dang ky.
   */
  async verifyOtpAndLogin(
    rawPhone: string,
    code: string,
    purpose: OtpPurpose,
    profile?: { name?: string; email?: string; language?: Language },
    meta?: { userAgent?: string; ip?: string },
  ): Promise<{ tokens: TokenPair; customer: Customer; isNewAccount: boolean }> {
    const phone = normalizePhone(rawPhone);
    await this.otp.verify(phone, purpose, code);

    let customer = await this.customerRepo.findOne({ where: { phone } });
    let isNewAccount = false;

    if (!customer) {
      customer = await this.customers.create({
        phone,
        name: profile?.name?.trim() || 'Khach hang',
        email: profile?.email ?? null,
        language: profile?.language ?? Language.JA,
        isGuest: false,
      });
      isNewAccount = true;
    } else if (customer.isGuest) {
      // Ho so sinh tu luong dat lich Guest nay da co chu — nang cap len tai khoan.
      customer.isGuest = false;
      if (profile?.name?.trim()) customer.name = profile.name.trim();
      if (profile?.email && !customer.email) customer.email = profile.email;
      isNewAccount = true;
    }

    if (!customer.isActive) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DISABLED',
        message: 'Tai khoan da bi khoa',
      });
    }

    customer.lastLoginAt = new Date();
    await this.customerRepo.save(customer);

    const tokens = await this.tokens.issue(
      {
        sub: customer.id,
        role: UserRole.USER,
        phone: customer.phone,
        name: customer.name,
      },
      meta,
    );
    return { tokens, customer, isNewAccount };
  }

  // ---------- Quan tri (SA-01) ----------

  /**
   * FR-AUTH-09, NFR-SE-04 — khoa tam sau nhieu lan sai.
   * Thong bao loi giong nhau cho moi truong hop sai de khong lo ten dang nhap nao ton tai.
   */
  async adminLogin(
    username: string,
    password: string,
    meta?: { userAgent?: string; ip?: string },
  ): Promise<{ tokens: TokenPair; user: AdminUser }> {
    const invalid = new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: 'Ten dang nhap hoac mat khau khong dung',
    });

    const user = await this.adminRepo.findOne({ where: { username: username.trim() } });
    if (!user) throw invalid;

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_LOCKED',
        message: 'Tai khoan tam khoa do dang nhap sai nhieu lan',
        details: { lockedUntil: user.lockedUntil },
      });
    }
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DISABLED',
        message: 'Tai khoan da bi khoa',
      });
    }

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) {
      user.failedLoginCount += 1;
      if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
        user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
        user.failedLoginCount = 0;
      }
      await this.adminRepo.save(user);
      throw invalid;
    }

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.adminRepo.save(user);

    const tokens = await this.tokens.issue(
      {
        sub: user.id,
        role: UserRole.ADMIN,
        adminRole: user.role,
        storeId: user.storeId,
        name: user.fullName,
      },
      meta,
    );
    return { tokens, user };
  }

  // ---------- Chung ----------

  async refresh(refreshToken: string): Promise<TokenPair> {
    return this.tokens.rotate(refreshToken, async (subjectId) => this.rebuildPayload(subjectId));
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revokeOne(refreshToken);
  }

  /**
   * Dung lai thong tin phien khi xoay token — quyen phai lay lai tu CSDL,
   * neu khong thi tai khoan bi ha quyen van giu quyen cu den khi het han token.
   */
  private async rebuildPayload(subjectId: string): Promise<AuthUser> {
    const admin = await this.adminRepo.findOne({ where: { id: subjectId } });
    if (admin) {
      if (!admin.isActive) {
        throw new UnauthorizedException({
          code: 'ACCOUNT_DISABLED',
          message: 'Tai khoan da bi khoa',
        });
      }
      return {
        sub: admin.id,
        role: UserRole.ADMIN,
        adminRole: admin.role as AdminRole,
        storeId: admin.storeId,
        name: admin.fullName,
      };
    }

    const customer = await this.customerRepo.findOne({ where: { id: subjectId } });
    if (!customer || !customer.isActive) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DISABLED',
        message: 'Tai khoan khong con hieu luc',
      });
    }
    return {
      sub: customer.id,
      role: UserRole.USER,
      phone: customer.phone,
      name: customer.name,
    };
  }

  /** SC-33 — ho so ca nhan cua khach dang dang nhap. */
  async getProfile(customerId: string): Promise<Customer> {
    return this.customers.findById(customerId);
  }

  async updateProfile(customerId: string, data: Partial<Customer>): Promise<Customer> {
    const allowed: Partial<Customer> = {
      name: data.name,
      nameKana: data.nameKana,
      email: data.email,
      address: data.address,
      language: data.language,
      notifySms: data.notifySms,
      notifyEmail: data.notifyEmail,
    };
    Object.keys(allowed).forEach((key) => {
      if (allowed[key as keyof Customer] === undefined) delete allowed[key as keyof Customer];
    });
    return this.customers.update(customerId, allowed);
  }

  async changeAdminPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.adminRepo.findOneOrFail({ where: { id: adminId } });
    const matched = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Mat khau hien tai khong dung',
      });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await this.adminRepo.save(user);
    // Doi mat khau thi moi phien cu deu mat hieu luc.
    await this.tokens.revokeAll(adminId);
  }
}
