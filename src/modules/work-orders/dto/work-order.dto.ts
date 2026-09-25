import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto';
import { PaymentStatus, WorkDifficulty, WorkOrderStatus } from 'src/common/enums';

/** SA-08 — tiep nhan xe. BR-18 doi hoi so km va anh hien trang. */
export class IntakeDto {
  @ApiPropertyOptional({ description: 'Bo trong khi khach den truc tiep, khong qua dat lich' })
  @IsOptional()
  @IsUUID('4')
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Bat buoc khi khong co bookingId' })
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @IsOptional() @IsUUID('4') vehicleId?: string;
  @IsOptional() @IsUUID('4') storeId?: string;

  @ApiProperty({ description: 'So km hien tai — bat buoc theo BR-18' })
  @IsInt()
  @Min(0)
  intakeOdometer!: number;

  @ApiPropertyOptional({ description: 'Muc nhien lieu theo phan tu binh: 0..4' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  intakeFuelLevel?: number;

  @ApiPropertyOptional({ description: 'SA-08 — phu kien khach de lai cung xe' })
  @IsOptional()
  @IsString()
  intakeAccessories?: string;

  @IsOptional() @IsString() intakeNote?: string;
  @IsOptional() @IsString() customerSymptom?: string;

  @ApiProperty({ description: 'Anh hien trang xe — bat buoc it nhat mot anh (BR-18)' })
  @IsArray()
  @IsString({ each: true })
  intakePhotoUrls!: string[];
}

export class WorkOrderItemDto {
  @IsOptional() @IsUUID('4') id?: string;
  @IsOptional() @IsUUID('4') serviceId?: string;

  @IsString() @IsNotEmpty() name!: string;

  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(0) unitPrice!: number;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsInt() @Min(0) laborMinutes?: number;
  @IsOptional() @IsBoolean() suggestedByAi?: boolean;
  @IsOptional() @IsBoolean() isDone?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class WorkOrderPartDto {
  @IsOptional() @IsUUID('4') id?: string;
  @IsOptional() @IsUUID('4') partId?: string;

  @IsString() @IsNotEmpty() partName!: string;

  @IsOptional() @IsString() partCode?: string;
  @IsInt() @Min(0) unitPrice!: number;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsBoolean() suggestedByAi?: boolean;
}

/** SA-11 — chan doan va hang muc cong viec. */
export class UpdateDiagnosisDto {
  @IsOptional() @IsString() diagnosisNote?: string;
  @IsOptional() @IsString() diagnosisCause?: string;
  @IsOptional() @IsUUID('4') assignedTechnicianId?: string;
  @IsOptional() @IsEnum(WorkDifficulty) difficulty?: WorkDifficulty;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderItemDto)
  items?: WorkOrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderPartDto)
  parts?: WorkOrderPartDto[];
}

/** SA-10 — cap nhat tien do hien cho khach o SC-26. */
export class UpdateProgressDto {
  @IsInt() @Min(0) @Max(100) progressPercent!: number;

  @IsOptional() @IsString() progressNote?: string;
  @IsOptional() @IsString() estimatedCompletionAt?: string;
}

export class ChangeWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus) status!: WorkOrderStatus;

  @IsOptional() @IsString() note?: string;
}

export class AddPhotoDto {
  @ApiProperty({ enum: ['INTAKE', 'PROGRESS', 'COMPLETION'] })
  @IsString()
  stage!: string;

  @IsString() @IsNotEmpty() url!: string;

  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsBoolean() visibleToCustomer?: boolean;
}

export class WorkOrderQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsUUID('4') storeId?: string;
  @IsOptional() @IsEnum(WorkOrderStatus) status?: WorkOrderStatus;
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}

export class UpdateAmountsDto {
  @IsOptional() @IsInt() @Min(0) discountAmount?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) taxRate?: number;
}
