import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto';
import { QuotationStatus } from 'src/common/enums';

export class QuotationItemDto {
  @ApiPropertyOptional({ enum: ['LABOR', 'PART', 'OTHER'], default: 'LABOR' })
  @IsOptional()
  @IsIn(['LABOR', 'PART', 'OTHER'])
  kind?: string;

  @IsOptional() @IsUUID('4') serviceId?: string;
  @IsOptional() @IsUUID('4') partId?: string;

  @IsString() @IsNotEmpty() name!: string;

  @IsOptional() @IsString() description?: string;

  @IsInt() @Min(0) unitPrice!: number;
  @IsInt() @Min(1) quantity!: number;

  @ApiPropertyOptional({ description: 'Hang muc khach co the bo khi phan hoi — FR-QUO-08' })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional({ description: 'Danh dau dong do AI-02 goi y, Admin van phai duyet' })
  @IsOptional()
  @IsBoolean()
  suggestedByAi?: boolean;
}

export class CreateQuotationDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items!: QuotationItemDto[];

  @IsOptional() @IsInt() @Min(0) discountAmount?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) taxRate?: number;
  @IsOptional() @IsString() validUntil?: string;

  @ApiPropertyOptional({ description: 'SA-12 — so tien coc yeu cau khach tra truoc' })
  @IsOptional()
  @IsInt()
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({ description: 'SA-12 — han dat coc' })
  @IsOptional()
  @IsString()
  depositDueAt?: string;

  @IsOptional() @IsString() note?: string;

  @ApiPropertyOptional({ description: 'Ban goi y goc cua AI de doi chieu do chinh xac' })
  @IsOptional()
  @IsObject()
  aiSuggestion?: Record<string, unknown>;
}

export class RespondQuotationDto {
  @ApiProperty({ description: 'true = dong y, false = tu choi' })
  @IsBoolean()
  accept!: boolean;

  @ApiPropertyOptional({ description: 'Cac hang muc tuy chon khach khong lam' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  rejectedItemIds?: string[];

  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() comment?: string;

  @ApiPropertyOptional({
    description: 'Khach muon mot ban bao gia khac chu khong phai thoi han — SC-27',
  })
  @IsOptional()
  @IsBoolean()
  requestRevision?: boolean;
}

export class QuotationQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(QuotationStatus) status?: QuotationStatus;
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsUUID('4') storeId?: string;
}
