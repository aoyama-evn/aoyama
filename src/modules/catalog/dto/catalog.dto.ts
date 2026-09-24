import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto';
import { ServiceType } from 'src/common/enums';
import { I18nText } from 'src/common/types';

export class CreateServiceDto {
  @IsString() @IsNotEmpty() code!: string;
  @IsString() @IsNotEmpty() slug!: string;
  @IsEnum(ServiceType) type!: ServiceType;
  @IsObject() name!: I18nText;

  @IsOptional() @IsObject() shortDescription?: I18nText;
  @IsOptional() @IsObject() description?: I18nText;
  @IsOptional() @IsArray() checklistItems?: I18nText[];
  @IsOptional() @IsInt() @Min(5) durationMinutes?: number;
  @IsOptional() @IsInt() @Min(0) basePrice?: number;
  @IsOptional() @IsBoolean() quoteOnly?: boolean;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;

  @ApiPropertyOptional({ description: 'Chu ky bao duong de xuat theo thang — nguon cho AI-05' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maintenanceIntervalMonths?: number;

  @IsOptional() @IsInt() @Min(1) maintenanceIntervalKm?: number;
}

export class UpdateServiceDto extends CreateServiceDto {
  @IsOptional() @IsString() @IsNotEmpty() declare code: string;
  @IsOptional() @IsString() @IsNotEmpty() declare slug: string;
  @IsOptional() @IsEnum(ServiceType) declare type: ServiceType;
  @IsOptional() @IsObject() declare name: I18nText;
}

export class ServiceQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsEnum(ServiceType) type?: ServiceType;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpsertPriceRuleDto {
  @IsOptional() @IsUUID('4') id?: string;
  @IsUUID('4') serviceId!: string;

  @IsOptional() @IsUUID('4') storeId?: string;
  @IsOptional() @IsInt() @Min(0) engineCcFrom?: number;
  @IsOptional() @IsInt() @Min(0) engineCcTo?: number;
  @IsOptional() @IsInt() @Min(1) difficultyLevel?: number;

  @IsInt() @Min(0) price!: number;

  @IsOptional() @IsInt() @Min(0) laborMinutes?: number;
  @IsOptional() @IsString() validFrom?: string;
  @IsOptional() @IsString() validTo?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() note?: string;
}
