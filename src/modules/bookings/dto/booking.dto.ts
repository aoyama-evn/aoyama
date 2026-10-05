import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto';
import { BookingServiceType, BookingStatus } from 'src/common/enums';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class VehicleInputDto {
  @ApiPropertyOptional({ description: 'Chon xe da co; bo trong thi khai bao xe moi ben duoi' })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @IsOptional() @IsString() plateNumber?: string;
  @IsOptional() @IsString() maker?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsInt() @Min(0) engineCc?: number;
  @IsOptional() @IsInt() @Min(0) odometer?: number;
}

/** SC-12 → SC-15 — du lieu gui len khi xac nhan dat lich. */
export class CreateBookingDto {
  @IsUUID('4') storeId!: string;

  @ApiProperty({ enum: BookingServiceType })
  @IsEnum(BookingServiceType)
  serviceType!: BookingServiceType;

  @ApiProperty({ description: 'Ma dich vu khach chon o SC-12', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  serviceIds!: string[];

  @ApiProperty({ example: '2026-10-05' })
  @Matches(DATE_PATTERN, { message: 'Ngay phai co dang yyyy-MM-dd' })
  date!: string;

  @ApiProperty({ example: '10:00', description: 'Gio bat dau khung gio theo gio Nhat Ban' })
  @Matches(TIME_PATTERN, { message: 'Gio phai co dang HH:mm' })
  startTime!: string;

  @ApiProperty({ description: 'Ten lien he — Guest chi can ten va so dien thoai (FR-BOOK-01)' })
  @IsString()
  @IsNotEmpty()
  contactName!: string;

  @IsString() @IsNotEmpty() contactPhone!: string;

  @IsOptional() @IsEmail() contactEmail?: string;

  @IsOptional()
  @Type(() => VehicleInputDto)
  vehicle?: VehicleInputDto;

  @IsOptional() @IsString() symptomDescription?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) symptomPhotoUrls?: string[];

  @ApiPropertyOptional({ description: 'SC-12 — mot doan video ngan ve tinh trang xe' })
  @IsOptional()
  @IsString()
  symptomVideoUrl?: string;

  @ApiPropertyOptional({ description: 'Phien chan doan AI dan sang tu SC-11' })
  @IsOptional()
  @IsUUID('4')
  aiDiagnosisId?: string;

  @ApiPropertyOptional({ description: 'Ma OTP khi cau hinh bat buoc xac thuc Guest — OQ-05' })
  @IsOptional()
  @IsString()
  otpCode?: string;
}

/** SA-06 — Admin dat lich thay khach, BR-12. */
export class AdminCreateBookingDto extends CreateBookingDto {
  @ApiPropertyOptional({
    description: 'Ho so khach da co; bo trong thi tao tu ten va so dien thoai',
  })
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @IsOptional() @IsString() adminNote?: string;
}

export class RescheduleBookingDto {
  @Matches(DATE_PATTERN, { message: 'Ngay phai co dang yyyy-MM-dd' })
  date!: string;

  @Matches(TIME_PATTERN, { message: 'Gio phai co dang HH:mm' })
  startTime!: string;

  @IsOptional() @IsUUID('4') storeId?: string;
  @IsOptional() @IsString() reason?: string;

  /**
   * SC-23 cho khach sua ca hang muc, so km va ghi chu trong cung mot lan luu,
   * nen nhung truong nay di kem voi ngay gio moi.
   */
  @ApiPropertyOptional({ description: 'SC-23 — danh sach hang muc sau khi sua' })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  serviceIds?: string[];

  @ApiPropertyOptional({ description: 'SC-23 — so km cap nhat cho xe cua lich hen' })
  @IsOptional()
  @IsInt()
  @Min(0)
  odometer?: number;

  @ApiPropertyOptional({ description: 'SC-23 — ghi chu them cho cua hang' })
  @IsOptional()
  @IsString()
  symptomDescription?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ description: 'Ly do huy — hien o SA-05 va bao cao FR-RPT-04' })
  @IsOptional()
  @IsString()
  reason?: string;
}

/** SA-03 — xac nhan nhieu lich hen cung luc. */
export class ConfirmManyDto {
  @ApiProperty({ type: [String], description: 'Danh sach ma lich hen can xac nhan' })
  @IsArray()
  @ArrayNotEmpty()
  // Chan mot lan bam keo ca nghin ban ghi: moi lich con sinh ma QR va gui SMS.
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids!: string[];
}

/**
 * SC-20 — mot o duy nhat cho ca ma lich hen lan so dien thoai, giong o tra
 * cuu cua le tan: khach khong phai doan xem minh dang go kieu nao.
 */
export class LookupBookingDto {
  @ApiProperty({ example: 'B-202610081226001', description: 'Ma lich hen hoac so dien thoai' })
  @IsString()
  @IsNotEmpty()
  term!: string;
}

/**
 * SC-20 — noi dung doc duoc tu anh ma QR khach tai len. Anh QR he thong sinh
 * ra chua token cua lich hen chu khong phai ma lich hen, nen tra cuu bang
 * duong nay khong doi so dien thoai: cam duoc anh QR la du chung minh, giong
 * nhu khi dua ma cho le tan quet.
 */
export class LookupQrDto {
  @ApiProperty({ description: 'Chuoi doc duoc tu anh ma QR' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class BookingQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsUUID('4') storeId?: string;
  @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;
  @IsOptional() @IsEnum(BookingServiceType) serviceType?: BookingServiceType;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(DATE_PATTERN)
  from?: string;

  @IsOptional() @Matches(DATE_PATTERN) to?: string;

  /** SC-01a va SC-21 — chi lay lich hen con o phia truoc. */
  @ApiPropertyOptional({ description: 'Chi lay lich hen chua dien ra' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  upcoming?: boolean;
}

export class CalendarQueryDto {
  @IsUUID('4') storeId!: string;

  @Matches(DATE_PATTERN)
  from!: string;

  @ApiPropertyOptional({ default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}

export class AvailabilityQueryDto {
  @IsUUID('4') storeId!: string;

  @ApiProperty({ example: '2026-10-05' })
  @Matches(DATE_PATTERN)
  from!: string;

  @ApiPropertyOptional({ default: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}

export class RebookDto {
  @ApiPropertyOptional({ description: 'Ngay mong muon; bo trong thi he thong de xuat theo chu ky' })
  @IsOptional()
  @Matches(DATE_PATTERN)
  date?: string;

  @IsOptional() @Matches(TIME_PATTERN) startTime?: string;
  @IsOptional() @IsUUID('4') storeId?: string;
}
