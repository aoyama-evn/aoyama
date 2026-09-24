import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { AuthUser, CurrentUser } from 'src/common/decorators';
import { PaymentMethod } from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AuditService } from 'src/modules/system/audit.service';
import { PaymentsService } from './payments.service';

class RecordPaymentDto {
  @IsInt() @Min(1) amount!: number;

  @IsEnum(PaymentMethod) method!: PaymentMethod;

  @IsOptional() @IsString() paidAt?: string;
  @IsOptional() @IsString() receiptNo?: string;
  @IsOptional() @IsString() note?: string;
}

class VoidPaymentDto {
  @IsString() @IsNotEmpty() reason!: string;
}

/** SA-14 — ghi nhan thanh toan tai cua hang. */
@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/work-orders/:workOrderId/payments')
export class AdminPaymentsController {
  constructor(
    private readonly service: PaymentsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'SA-14 — cac lan thu tien cua phieu' })
  list(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    return this.service.listByWorkOrder(workOrderId);
  }

  @Post()
  @ApiOperation({ summary: 'SA-14 — ghi nhan mot lan thu tien' })
  async record(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const payment = await this.service.record(workOrderId, dto, user.sub);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
      changes: { workOrderId, amount: dto.amount, method: dto.method },
    });
    return payment;
  }

  @Put(':paymentId/void')
  @ApiOperation({ summary: 'SA-14 — huy mot dong thu nham (FR-PAY-05)' })
  async voidPayment(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: VoidPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const payment = await this.service.voidPayment(paymentId, dto.reason);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'VOID_PAYMENT',
      entity: 'Payment',
      entityId: paymentId,
      changes: { reason: dto.reason },
    });
    return payment;
  }
}
