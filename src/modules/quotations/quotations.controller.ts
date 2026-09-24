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
  CreateQuotationDto,
  QuotationQueryDto,
  RespondQuotationDto,
} from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';

/** SC-27, SC-28 — khach xem va phan hoi bao gia qua duong dan kho doan. */
@ApiTags('quotations')
@Controller('quotations')
export class PublicQuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Public()
  @Get(':token')
  @ApiOperation({ summary: 'SC-27 — xem bao gia' })
  detail(@Param('token') token: string) {
    return this.service.findByPublicToken(token);
  }

  @Public()
  @Post(':token/respond')
  @ApiOperation({ summary: 'SC-28 — dong y hoac tu choi bao gia' })
  respond(@Param('token') token: string, @Body() dto: RespondQuotationDto) {
    return this.service.respond(token, dto);
  }
}

/** SA-12, SA-13 — lap va quan ly bao gia. */
@ApiTags('quotations')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin')
export class AdminQuotationsController {
  constructor(
    private readonly service: QuotationsService,
    private readonly audit: AuditService,
  ) {}

  @Get('quotations')
  @ApiOperation({ summary: 'SA-13 — danh sach bao gia' })
  list(@Query() query: QuotationQueryDto) {
    return this.service.search(query);
  }

  @Get('quotations/:id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Get('work-orders/:workOrderId/quotations')
  @ApiOperation({ summary: 'SA-12 — cac ban bao gia cua mot phieu dich vu' })
  byWorkOrder(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    return this.service.findByWorkOrder(workOrderId);
  }

  @Post('work-orders/:workOrderId/quotations')
  @ApiOperation({ summary: 'SA-12 — lap bao gia (ban moi thay the ban cu, BR-34)' })
  async create(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Body() dto: CreateQuotationDto,
    @CurrentUser() user: AuthUser,
  ) {
    const quotation = await this.service.create(workOrderId, dto, user.sub);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'CREATE',
      entity: 'Quotation',
      entityId: quotation.id,
    });
    return quotation;
  }

  @Put('quotations/:id/send')
  @ApiOperation({ summary: 'SA-12 — gui bao gia cho khach' })
  async send(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    const quotation = await this.service.send(id);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'SEND',
      entity: 'Quotation',
      entityId: id,
    });
    return quotation;
  }

  @Delete('quotations/:id')
  @ApiOperation({ summary: 'SA-13 — xoa ban nhap' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
