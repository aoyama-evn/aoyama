import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { QrService } from './qr.service';

class ScanDto {
  @IsOptional() @IsString() token?: string;

  @IsOptional() @IsString() code?: string;
}

class ScanTokenDto {
  @IsString() @IsNotEmpty() token!: string;
}

/** SA-07 — quet ma QR tai quay. */
@ApiTags('qr')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/scan')
export class QrController {
  constructor(private readonly qr: QrService) {}

  @Post()
  @ApiOperation({
    summary: 'SA-07 — kiem tra ma QR hoac ma lich hen nhap tay (FR-QR-05, FR-QR-08)',
  })
  async scan(@Body() dto: ScanDto) {
    if (dto.token) return this.qr.validate(dto.token);
    if (dto.code) return this.qr.validateByCode(dto.code);
    return { valid: false, reason: 'NOT_FOUND', message: 'Can ma QR hoac ma lich hen' };
  }

  @Post('validate')
  @ApiOperation({ summary: 'SA-07 — kiem tra rieng theo token QR' })
  validate(@Body() dto: ScanTokenDto) {
    return this.qr.validate(dto.token);
  }
}
