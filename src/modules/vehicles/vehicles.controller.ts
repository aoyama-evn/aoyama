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
import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { AuthUser, CurrentUser } from 'src/common/decorators';
import { PaginationQueryDto } from 'src/common/dto';
import { VehicleFuelType } from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { VehiclesService } from './vehicles.service';

class VehicleBodyDto {
  @IsOptional() @IsString() plateNumber?: string;
  @IsOptional() @IsString() maker?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsInt() modelYear?: number;
  @IsOptional() @IsInt() @Min(0) engineCc?: number;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() vinNumber?: string;
  @IsOptional() @IsInt() @Min(0) currentOdometer?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) photoUrls?: string[];
  @IsOptional() @IsString() nickname?: string;
  @IsOptional() @IsEnum(VehicleFuelType) fuelType?: VehicleFuelType;
  @IsOptional() @IsString() note?: string;
}

class CreateVehicleDto extends VehicleBodyDto {
  @IsString() declare plateNumber: string;
  @IsString() declare maker: string;
  @IsString() declare model: string;
}

class AdminCreateVehicleDto extends CreateVehicleDto {
  @IsUUID('4') customerId!: string;
}

class VehicleQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsUUID('4') customerId?: string;
}

/** SC-29..SC-31 — xe cua toi va lich su dich vu. */
@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('account/vehicles')
export class MyVehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'SC-29 — danh sach xe cua toi' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.findByCustomer(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'SC-30 — them xe' })
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user: AuthUser) {
    return this.service.create({ ...dto, customerId: user.sub });
  }

  @Get(':id')
  @ApiOperation({ summary: 'SC-30, SC-31 — chi tiet xe cua toi' })
  async detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    const vehicle = await this.service.findOwnedBy(id, user.sub);
    return this.service.withMaintenanceHint(vehicle);
  }

  @Put(':id')
  @ApiOperation({ summary: 'SC-30 — sua xe' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VehicleBodyDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.service.findOwnedBy(id, user.sub);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'SC-29 — go xe khoi danh sach (xoa mem, FR-VEH-07)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    await this.service.findOwnedBy(id, user.sub);
    return this.service.remove(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'SC-31 — lich su dich vu cua xe' })
  async history(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.service.findOwnedBy(id, user.sub);
    return this.service.listHistory(id, query);
  }
}

/** SA-19..SA-21 — quan tri phuong tien. */
@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/vehicles')
export class AdminVehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'SA-19 — danh sach phuong tien' })
  list(@Query() query: VehicleQueryDto) {
    return this.service.search(query);
  }

  @Get('by-plate/:plateNumber')
  @ApiOperation({ summary: 'Tra cuu nhanh theo bien so khi tiep nhan xe' })
  byPlate(@Param('plateNumber') plateNumber: string) {
    return this.service.findByPlate(plateNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'SA-20 — chi tiet phuong tien' })
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    // SA-20 hien moc bao duong tiep theo ngay tren the chi so.
    return this.service.withMaintenanceHint(await this.service.findById(id));
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'SA-20 — lich su dich vu cua xe' })
  history(@Param('id', ParseUUIDPipe) id: string, @Query() query: PaginationQueryDto) {
    return this.service.listHistory(id, query);
  }

  @Post()
  @ApiOperation({ summary: 'SA-21 — them phuong tien' })
  create(@Body() dto: AdminCreateVehicleDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'SA-21 — sua phuong tien' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: VehicleBodyDto) {
    return this.service.update(id, dto);
  }
}
