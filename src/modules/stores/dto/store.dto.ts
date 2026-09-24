import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { I18nText } from 'src/common/types';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateStoreDto {
  @IsString() @IsNotEmpty() code!: string;
  @IsObject() name!: I18nText;
  @IsObject() address!: I18nText;
  @IsString() @IsNotEmpty() phone!: string;

  @IsOptional() @IsObject() description?: I18nText;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() latitude?: string;
  @IsOptional() @IsString() longitude?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photoUrls?: string[];

  @ApiPropertyOptional({ description: 'Nang luc tiep nhan mac dinh cho khung gio' })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultCapacity?: number;

  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateStoreDto extends CreateStoreDto {
  @IsOptional() @IsString() @IsNotEmpty() declare code: string;
  @IsOptional() @IsObject() declare name: I18nText;
  @IsOptional() @IsObject() declare address: I18nText;
  @IsOptional() @IsString() @IsNotEmpty() declare phone: string;
}

export class BusinessHourDto {
  @IsInt() @Min(0) @Max(6) weekday!: number;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @Matches(TIME_PATTERN, { message: 'Gio mo cua phai co dang HH:mm' })
  openTime?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @Matches(TIME_PATTERN, { message: 'Gio dong cua phai co dang HH:mm' })
  closeTime?: string;

  @IsOptional() @IsBoolean() isClosed?: boolean;
}

export class ReplaceBusinessHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHourDto)
  hours!: BusinessHourDto[];
}

export class CreateHolidayDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngay phai co dang yyyy-MM-dd' })
  date!: string;

  @IsOptional() @IsString() reason?: string;
}

export class TimeSlotDto {
  @IsInt() @Min(0) @Max(6) weekday!: number;

  @Matches(TIME_PATTERN, { message: 'Gio bat dau phai co dang HH:mm' })
  startTime!: string;

  @Matches(TIME_PATTERN, { message: 'Gio ket thuc phai co dang HH:mm' })
  endTime!: string;

  @ApiPropertyOptional({ description: 'So luot xe toi da trong khung gio — BR-07' })
  @IsInt()
  @Min(0)
  capacity!: number;

  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ReplaceTimeSlotsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  slots!: TimeSlotDto[];
}
