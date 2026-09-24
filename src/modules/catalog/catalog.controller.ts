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
import { AuthUser, CurrentUser, Public, Roles } from 'src/common/decorators';
import { AdminRole, ServiceType } from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AuditService } from 'src/modules/system/audit.service';
import { CatalogService } from './catalog.service';
import {
  CreateServiceDto,
  ServiceQueryDto,
  UpdateServiceDto,
  UpsertPriceRuleDto,
} from './dto/catalog.dto';

/** SC-02, SC-03, SC-04 — dich vu va bang gia tham khao cho site khach hang. */
@ApiTags('catalog')
@Controller('services')
export class PublicCatalogController {
  constructor(private readonly service: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'SC-02 — danh sach dich vu' })
  list(@Query('type') type?: ServiceType) {
    return this.service.findPublic(type);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'SC-01 — dich vu noi bat tren trang chu' })
  featured() {
    return this.service.findFeatured();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'SC-03 — chi tiet dich vu' })
  detail(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }
}

/** SA-22, SA-23, SA-24 — quan tri danh muc dich vu va bang gia. */
@ApiTags('catalog')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin')
export class AdminCatalogController {
  constructor(
    private readonly service: CatalogService,
    private readonly audit: AuditService,
  ) {}

  @Get('services')
  @ApiOperation({ summary: 'SA-22 — danh sach dich vu' })
  list(@Query() query: ServiceQueryDto) {
    return this.service.search(query);
  }

  @Get('services/:id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('services')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-23 — them dich vu' })
  async create(@Body() dto: CreateServiceDto, @CurrentUser() user: AuthUser) {
    const created = await this.service.create(dto);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'CREATE',
      entity: 'Service',
      entityId: created.id,
    });
    return created;
  }

  @Put('services/:id')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-23 — sua dich vu' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.service.update(id, dto);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'UPDATE',
      entity: 'Service',
      entityId: id,
      changes: dto as unknown as Record<string, unknown>,
    });
    return updated;
  }

  @Delete('services/:id')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-22 — ngung ban dich vu (khong xoa cung, FR-SVC-10)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }

  @Get('pricing')
  @ApiOperation({ summary: 'SA-24 — danh sach quy tac gia' })
  priceRules(@Query('serviceId') serviceId?: string) {
    return this.service.listPriceRules(serviceId);
  }

  @Post('pricing')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-24 — them hoac sua quy tac gia' })
  upsertPriceRule(@Body() dto: UpsertPriceRuleDto) {
    return this.service.upsertPriceRule(dto);
  }

  @Delete('pricing/:id')
  @Roles(AdminRole.ADMIN)
  deletePriceRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deletePriceRule(id);
  }
}
