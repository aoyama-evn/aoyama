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
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  AuthUser,
  CurrentUser,
  ForceStoreFilter,
  Public,
  Roles,
  ScopeByStore,
} from 'src/common/decorators';
import { PaginationQueryDto } from 'src/common/dto';
import { AdminRole, Language } from 'src/common/enums';
import { AdminGuard, RolesGuard, StoreScopeGuard } from 'src/common/guards';
import { I18nText } from 'src/common/types';
import { ContentService } from './content.service';

class SubmitContactDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() message!: string;

  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsUUID('4') storeId?: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsEnum(Language) language?: Language;
}

class UpsertFaqDto {
  @IsOptional() @IsUUID('4') id?: string;
  @IsObject() question!: I18nText;
  @IsObject() answer!: I18nText;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

class ContactQueryDto extends PaginationQueryDto {
  @IsOptional() @IsBoolean() isHandled?: boolean;
  @IsOptional() @IsUUID('4') storeId?: string;
}

/** SC-07, SC-08 — noi dung cong khai. */
@ApiTags('public')
@Controller()
export class PublicContentController {
  constructor(private readonly service: ContentService) {}

  @Public()
  @Get('faqs')
  @ApiOperation({ summary: 'SC-07 — cau hoi thuong gap' })
  faqs(@Query('category') category?: string) {
    return this.service.listFaqs(category);
  }

  @Public()
  @Post('contact')
  @ApiOperation({ summary: 'SC-08 — gui lien he' })
  contact(@Body() dto: SubmitContactDto) {
    return this.service.submitContact(dto);
  }
}

/** Quan tri noi dung cong khai va hop thu lien he. */
@ApiTags('public')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard, StoreScopeGuard)
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly service: ContentService) {}

  @Get('faqs')
  faqs() {
    return this.service.listFaqs();
  }

  // Cau hoi thuong gap hien tren site khach cua ca chuoi — chi ADMIN sua.
  @Post('faqs')
  @Roles(AdminRole.ADMIN)
  upsertFaq(@Body() dto: UpsertFaqDto) {
    return this.service.upsertFaq(dto);
  }

  @Delete('faqs/:id')
  @Roles(AdminRole.ADMIN)
  removeFaq(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeFaq(id);
  }

  @Get('contacts')
  @ForceStoreFilter('query')
  @ApiOperation({ summary: 'Hop thu lien he tu SC-08' })
  contacts(@Query() query: ContactQueryDto) {
    return this.service.listContacts(query);
  }

  @Put('contacts/:id/handled')
  @ScopeByStore({ param: 'id', sql: 'select store_id from contact_messages where id = $1' })
  markHandled(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('note') note: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.markContactHandled(id, user.sub, note);
  }
}
