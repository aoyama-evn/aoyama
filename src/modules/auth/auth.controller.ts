import { Body, Controller, Get, HttpCode, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser, CurrentUser, Public } from 'src/common/decorators';
import { AdminGuard } from 'src/common/guards';
import { AuditService } from 'src/modules/system/audit.service';
import { AuthService } from './auth.service';
import {
  AdminLoginDto,
  ChangePasswordDto,
  RefreshTokenDto,
  RequestOtpDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './dto/auth.dto';

function requestMeta(req: Request) {
  return {
    userAgent: req.headers['user-agent']?.slice(0, 255),
    ip: req.ip,
  };
}

/** M-01 — SC-17, SC-18, SC-19, SC-33, SC-34, SA-01. */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly audit: AuditService,
  ) {}

  @Public()
  @Post('otp/request')
  @HttpCode(200)
  @ApiOperation({ summary: 'SC-18 — gui ma OTP toi so dien thoai' })
  requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    return this.service.requestOtp(dto.phone, dto.purpose ?? 'LOGIN', dto.language, req.ip);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'SC-19 — xac thuc OTP va dang nhap' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const result = await this.service.verifyOtpAndLogin(
      dto.phone,
      dto.code,
      dto.purpose ?? 'LOGIN',
      { name: dto.name, email: dto.email, language: dto.language },
      requestMeta(req),
    );
    return {
      ...result.tokens,
      isNewAccount: result.isNewAccount,
      user: {
        id: result.customer.id,
        name: result.customer.name,
        phone: result.customer.phone,
        email: result.customer.email,
        language: result.customer.language,
      },
    };
  }

  @Public()
  @Post('admin/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'SA-01 — dang nhap trang quan tri' })
  async adminLogin(@Body() dto: AdminLoginDto, @Req() req: Request) {
    const result = await this.service.adminLogin(dto.username, dto.password, requestMeta(req));
    await this.audit.record({
      actorId: result.user.id,
      actorName: result.user.fullName,
      actorType: 'ADMIN',
      action: 'LOGIN',
      entity: 'AdminUser',
      entityId: result.user.id,
      ipAddress: req.ip,
    });
    return {
      ...result.tokens,
      user: {
        id: result.user.id,
        username: result.user.username,
        fullName: result.user.fullName,
        role: result.user.role,
        storeId: result.user.storeId,
        language: result.user.language,
        mustChangePassword: result.user.mustChangePassword,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'SY-05 — lam moi phien dang nhap' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.service.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Body() dto: RefreshTokenDto) {
    return this.service.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Thong tin phien hien tai' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'SC-33 — ho so ca nhan' })
  profile(@CurrentUser() user: AuthUser) {
    return this.service.getProfile(user.sub);
  }

  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'SC-33, SC-34 — cap nhat ho so, ngon ngu, kenh nhan thong bao' })
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Put('admin/password')
  @HttpCode(204)
  @ApiOperation({ summary: 'SA-40 — doi mat khau tai khoan quan tri' })
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.service.changeAdminPassword(user.sub, dto.currentPassword, dto.newPassword);
  }
}
