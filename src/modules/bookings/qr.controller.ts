import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthUser, CurrentUser } from 'src/common/decorators';
import { AdminGuard, RolesGuard, StoreScopeGuard, restrictedStoreId } from 'src/common/guards';
import { QrScanResult, QrService } from './qr.service';

class ScanDto {
  @IsOptional() @IsString() token?: string;

  @IsOptional() @IsString() code?: string;

  /** SA-07 — tra theo bien so khi khong quet duoc ma QR. */
  /** Bien so hay so dien thoai — mot o duy nhat o SA-07. */
  @IsOptional() @IsString() search?: string;
}

class ScanTokenDto {
  @IsString() @IsNotEmpty() token!: string;
}

/** SA-07 — quet ma QR tai quay. */
@ApiTags('qr')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard, StoreScopeGuard)
@Controller('admin/scan')
export class QrController {
  constructor(private readonly qr: QrService) {}

  @Post()
  @ApiOperation({
    summary: 'SA-07 — kiem tra ma QR hoac ma lich hen nhap tay (FR-QR-05, FR-QR-08)',
  })
  async scan(@Body() dto: ScanDto, @CurrentUser() user: AuthUser): Promise<QrScanResult> {
    if (dto.token) return this.cungCuaHang(await this.qr.validate(dto.token), user);
    if (dto.code) return this.cungCuaHang(await this.qr.validateByCode(dto.code), user);
    if (dto.search) return this.cungCuaHang(await this.qr.validateBySearch(dto.search), user);
    return { valid: false, reason: 'NOT_FOUND', message: 'Can ma QR, ma lich hen hoac bien so' };
  }

  @Post('validate')
  @ApiOperation({ summary: 'SA-07 — kiem tra rieng theo token QR' })
  async validate(@Body() dto: ScanTokenDto, @CurrentUser() user: AuthUser): Promise<QrScanResult> {
    return this.cungCuaHang(await this.qr.validate(dto.token), user);
  }

  /**
   * OQ-02 — quet o quay khong di qua bo loc cua hang nao ca, nen phai doi
   * chieu ngay tren ket qua. Tra ve dung "khong tim thay" thay vi mot ly do
   * rieng: le tan cua hang khac khong can biet lich hen do co ton tai hay
   * khong, va man SA-07 da hien san thong bao nay.
   */
  private cungCuaHang(ketQua: QrScanResult, user: AuthUser): QrScanResult {
    const cuaHang = restrictedStoreId(user);
    if (!cuaHang || !ketQua.booking || ketQua.booking.storeId === cuaHang) return ketQua;
    return {
      valid: false,
      reason: 'NOT_FOUND',
      message: 'Khong tim thay lich hen nao khop voi noi dung vua nhap',
    };
  }
}
