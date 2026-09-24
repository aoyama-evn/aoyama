import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Public } from 'src/common/decorators';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AuditService } from 'src/modules/system/audit.service';
import {
  AddPhotoDto,
  ChangeWorkOrderStatusDto,
  IntakeDto,
  UpdateAmountsDto,
  UpdateDiagnosisDto,
  UpdateProgressDto,
  WorkOrderQueryDto,
} from './dto/work-order.dto';
import { WorkOrdersService } from './work-orders.service';

/** SC-26, SC-32 — tien do va chi tiet phieu phia khach hang. */
@ApiTags('work-orders')
@Controller('bookings')
export class PublicWorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Public()
  @Get(':code/progress')
  @ApiOperation({ summary: 'SC-26 — theo doi tien do sua chua' })
  progress(@Param('code') code: string) {
    return this.service.getPublicProgress(code);
  }
}

/** SA-08..SA-11 — tiep nhan xe va phieu dich vu. */
@ApiTags('work-orders')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/work-orders')
export class AdminWorkOrdersController {
  constructor(
    private readonly service: WorkOrdersService,
    private readonly audit: AuditService,
  ) {}

  @Post('intake')
  @ApiOperation({ summary: 'SA-08 — tiep nhan xe va mo phieu dich vu' })
  async intake(@Body() dto: IntakeDto, @CurrentUser() user: AuthUser) {
    const workOrder = await this.service.intake(dto, {
      type: 'ADMIN',
      id: user.sub,
      name: user.name,
    });
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'INTAKE',
      entity: 'WorkOrder',
      entityId: workOrder.id,
      changes: { bookingId: dto.bookingId, odometer: dto.intakeOdometer },
    });
    return workOrder;
  }

  @Get()
  @ApiOperation({ summary: 'SA-09 — danh sach phieu dich vu' })
  list(@Query() query: WorkOrderQueryDto) {
    return this.service.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'SA-10 — chi tiet phieu dich vu' })
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Put(':id/diagnosis')
  @ApiOperation({ summary: 'SA-11 — ghi chan doan, hang muc cong viec va phu tung' })
  updateDiagnosis(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiagnosisDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateDiagnosis(id, dto, { type: 'ADMIN', id: user.sub, name: user.name });
  }

  @Put(':id/amounts')
  @ApiOperation({ summary: 'SA-10 — dieu chinh giam gia va thue' })
  updateAmounts(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAmountsDto) {
    return this.service.updateAmounts(id, dto);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'SA-10 — cap nhat tien do hien cho khach o SC-26' })
  updateProgress(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProgressDto) {
    return this.service.updateProgress(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'SA-10 — chuyen trang thai phieu (RD muc 5.2)' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeWorkOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    const workOrder = await this.service.changeStatus(
      id,
      dto.status,
      { type: 'ADMIN', id: user.sub, name: user.name },
      dto.note,
    );
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: `STATUS_${dto.status}`,
      entity: 'WorkOrder',
      entityId: id,
    });
    return workOrder;
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'SA-10 — them anh qua trinh lam viec' })
  addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPhotoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.addPhoto(id, dto, { type: 'ADMIN', id: user.sub, name: user.name });
  }

  @Delete(':id/photos/:photoId')
  removePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.service.removePhoto(id, photoId);
  }
}
