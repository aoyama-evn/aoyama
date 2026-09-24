import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AuthUser, CurrentUser, Public } from 'src/common/decorators';
import { PaginationQueryDto } from 'src/common/dto';
import { Language } from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AiService } from './ai.service';

class StartSessionDto {
  @IsString() @IsNotEmpty() sessionKey!: string;
  @IsOptional() @IsEnum(Language) language?: Language;
  @IsOptional() @IsString() vehicleMaker?: string;
  @IsOptional() @IsString() vehicleModel?: string;

  @IsOptional() @IsIn(['MAINTENANCE', 'REPAIR']) serviceIntent?: string;
}

class SendMessageDto {
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsOptional() @IsString() audioUrl?: string;
  @IsOptional() @IsString() transcript?: string;
}

class RecognizePartDto {
  @IsArray() @IsString({ each: true }) imageUrls!: string[];
}

class AskTechnicalDto {
  @IsString() @IsNotEmpty() question!: string;
  @IsOptional() @IsString() maker?: string;
  @IsOptional() @IsString() model?: string;
}

class AddDocumentDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) applicableMakers?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) applicableModels?: string[];
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() fileType?: string;
  @IsOptional() @IsString() content?: string;
}

class DocumentQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsString() category?: string;
}

/** SC-10, SC-11 — chatbox AI chan doan cho khach. */
@ApiTags('ai')
@Controller('ai/diagnosis')
export class PublicAiController {
  constructor(private readonly service: AiService) {}

  @Public()
  @Post('sessions')
  @ApiOperation({ summary: 'SC-10 — mo phien chan doan' })
  start(@Body() dto: StartSessionDto, @CurrentUser() user?: AuthUser) {
    return this.service.startSession({ ...dto, customerId: user?.sub ?? null });
  }

  @Public()
  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'SC-10 — gui mo ta, anh hoac ghi am de AI phan tich' })
  send(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SendMessageDto) {
    return this.service.sendMessage(id, dto);
  }

  @Public()
  @Get('sessions/:id')
  @ApiOperation({ summary: 'SC-11 — ket qua chan doan kem muc do khop' })
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findSession(id);
  }
}

/** SA-12 (goi y bao gia), SA-27 (nhan dang phu tung), SA-30, SA-31. */
@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/ai')
export class AdminAiController {
  constructor(private readonly service: AiService) {}

  @Get('quotation-suggestion/:workOrderId')
  @ApiOperation({ summary: 'SA-12 — AI goi y hang muc va phu tung cho bao gia (AI-02)' })
  suggestQuotation(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    return this.service.suggestQuotation(workOrderId);
  }

  @Post('part-recognition')
  @ApiOperation({ summary: 'SA-27 — nhan dang phu tung tu anh, dien san bieu mau (AI-04)' })
  recognizePart(@Body() dto: RecognizePartDto) {
    return this.service.recognizePart(dto.imageUrls);
  }

  @Post('tech-assistant')
  @ApiOperation({ summary: 'SA-30 — hoi tro ly ky thuat, tra loi kem trich dan (AI-03)' })
  ask(@Body() dto: AskTechnicalDto) {
    return this.service.askTechnical(dto.question, { maker: dto.maker, model: dto.model });
  }

  @Get('knowledge-base')
  @ApiOperation({ summary: 'SA-31 — kho tai lieu ky thuat' })
  documents(@Query() query: DocumentQueryDto) {
    return this.service.listDocuments(query);
  }

  @Post('knowledge-base')
  @ApiOperation({ summary: 'SA-31 — them tai lieu ky thuat' })
  addDocument(@Body() dto: AddDocumentDto, @CurrentUser() user: AuthUser) {
    return this.service.addDocument({ ...dto, uploadedById: user.sub });
  }

  @Delete('knowledge-base/:id')
  removeDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeDocument(id);
  }
}
