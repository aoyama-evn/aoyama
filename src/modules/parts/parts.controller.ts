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
import { AuthUser, CurrentUser } from 'src/common/decorators';
import { PaginationQueryDto } from 'src/common/dto';
import { InventoryTxType } from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { I18nText } from 'src/common/types';
import { InventoryService } from './inventory.service';
import { PartsService } from './parts.service';

class PartBodyDto {
  @IsOptional() @IsString() @IsNotEmpty() code?: string;
  @IsOptional() @IsObject() name?: I18nText;
  @IsOptional() @IsString() maker?: string;
  @IsOptional() @IsString() makerPartNo?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() specification?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsInt() @Min(0) costPrice?: number;
  @IsOptional() @IsInt() @Min(0) sellPrice?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) compatibleVehicles?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsOptional() @IsString() createdSource?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

/** Ma phu tung do he thong sinh sau khi luu, nen khong doi o day — SA-26. */
class CreatePartDto extends PartBodyDto {
  @IsObject() declare name: I18nText;
}

class PartQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() maker?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() compatibleWith?: string;
}

class InventoryQueryDto extends PaginationQueryDto {
  @IsOptional() @IsUUID('4') storeId?: string;
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsBoolean() lowStockOnly?: boolean;
}

class AdjustStockDto {
  @IsUUID('4') storeId!: string;
  @IsUUID('4') partId!: string;
  @IsEnum(InventoryTxType) type!: InventoryTxType;
  @IsInt() quantity!: number;
  @IsOptional() @IsInt() @Min(0) unitCost?: number;
  @IsOptional() @IsString() reason?: string;
}

class TransactionQueryDto extends PaginationQueryDto {
  @IsOptional() @IsUUID('4') storeId?: string;
  @IsOptional() @IsUUID('4') partId?: string;
  @IsOptional() @IsEnum(InventoryTxType) type?: InventoryTxType;
}

class SetMinQuantityDto {
  @IsUUID('4') storeId!: string;
  @IsUUID('4') partId!: string;
  @IsInt() @Min(0) minQuantity!: number;
}

/** SA-25..SA-29 — phu tung va ton kho. */
@ApiTags('parts')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin')
export class AdminPartsController {
  constructor(
    private readonly parts: PartsService,
    private readonly inventory: InventoryService,
  ) {}

  @Get('parts')
  @ApiOperation({ summary: 'SA-25 — danh sach phu tung' })
  list(@Query() query: PartQueryDto) {
    return this.parts.search(query);
  }

  @Get('parts/categories')
  categories() {
    return this.parts.listCategories();
  }

  @Get('parts/:id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.parts.findById(id);
  }

  @Post('parts')
  @ApiOperation({ summary: 'SA-26 — them phu tung' })
  create(@Body() dto: CreatePartDto) {
    return this.parts.create(dto);
  }

  @Put('parts/:id')
  @ApiOperation({ summary: 'SA-26 — sua phu tung' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PartBodyDto) {
    return this.parts.update(id, dto);
  }

  @Delete('parts/:id')
  @ApiOperation({ summary: 'SA-25 — ngung dung phu tung (FR-PRT-14)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.parts.deactivate(id);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'SA-28 — ton kho theo cua hang' })
  inventoryList(@Query() query: InventoryQueryDto) {
    return this.inventory.list(query);
  }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'FR-PRT-12 — phu tung sap het' })
  lowStock(@Query('storeId') storeId?: string) {
    return this.inventory.findLowStock(storeId);
  }

  @Get('inventory/transactions')
  @ApiOperation({ summary: 'SA-29 — lich su bien dong kho' })
  transactions(@Query() query: TransactionQueryDto) {
    return this.inventory.listTransactions(query);
  }

  @Post('inventory/transactions')
  @ApiOperation({ summary: 'SA-29 — nhap, xuat hoac dieu chinh kho' })
  adjust(@Body() dto: AdjustStockDto, @CurrentUser() user: AuthUser) {
    return this.inventory.adjust({ ...dto, performedById: user.sub });
  }

  @Put('inventory/min-quantity')
  @ApiOperation({ summary: 'SA-28 — dat nguong canh bao ton kho' })
  setMinQuantity(@Body() dto: SetMinQuantityDto) {
    return this.inventory.setMinQuantity(dto.storeId, dto.partId, dto.minQuantity);
  }
}
