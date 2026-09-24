import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { IsIn, IsOptional, IsUUID, Matches } from 'class-validator';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { ExportService } from './export.service';
import { ReportsService } from './reports.service';

class RangeQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) from!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) to!: string;
  @IsOptional() @IsUUID('4') storeId?: string;
}

class ExportQueryDto extends RangeQueryDto {
  @IsIn(['excel', 'pdf']) format!: 'excel' | 'pdf';

  @IsOptional() @IsIn(['summary', 'revenue', 'parts']) report?: 'summary' | 'revenue' | 'parts';
}

/** SA-02, SA-36, SA-37, SA-38 — bang dieu khien va bao cao. */
@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/reports')
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly exporter: ExportService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'SA-02 — so lieu nhanh tren bang dieu khien' })
  dashboard(@Query('storeId') storeId?: string) {
    return this.reports.dashboard(storeId);
  }

  @Get()
  @ApiOperation({ summary: 'SA-36 — bao cao tong hop' })
  summary(@Query() query: RangeQueryDto) {
    return this.reports.summary(query);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'SA-37 — bao cao doanh thu' })
  revenue(@Query() query: RangeQueryDto) {
    return this.reports.revenue(query);
  }

  @Get('parts')
  @ApiOperation({ summary: 'SA-38 — bao cao phu tung va ton kho' })
  parts(@Query() query: RangeQueryDto) {
    return this.reports.partsReport(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'FR-RPT-12 — xuat bao cao ra Excel hoac PDF' })
  async export(@Query() query: ExportQueryDto, @Res() res: Response): Promise<void> {
    const report = query.report ?? 'summary';
    const { title, columns, rows } = await this.buildExportData(report, query);
    const fileBase = `aoyama-${report}-${query.from}_${query.to}`;

    if (query.format === 'excel') {
      const buffer = await this.exporter.toExcel(title, columns, rows);
      res
        .status(200)
        .setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        .setHeader('Content-Disposition', `attachment; filename="${fileBase}.xlsx"`)
        .send(buffer);
      return;
    }

    const buffer = await this.exporter.toPdf(title, columns, rows, `${query.from} — ${query.to}`);
    res
      .status(200)
      .setHeader('Content-Type', 'application/pdf')
      .setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`)
      .send(buffer);
  }

  /** Gom du lieu va cot theo tung loai bao cao de hai dinh dang xuat dung chung. */
  private async buildExportData(
    report: 'summary' | 'revenue' | 'parts',
    range: RangeQueryDto,
  ): Promise<{
    title: string;
    columns: { header: string; key: string; width?: number }[];
    rows: Record<string, unknown>[];
  }> {
    if (report === 'revenue') {
      const data = await this.reports.revenue(range);
      return {
        title: 'Bao cao doanh thu',
        columns: [
          { header: 'Ngay', key: 'date', width: 14 },
          { header: 'Doanh thu (JPY)', key: 'amount', width: 18 },
          { header: 'So phieu', key: 'workOrders', width: 12 },
        ],
        rows: data.byDay,
      };
    }

    if (report === 'parts') {
      const data = await this.reports.partsReport(range);
      return {
        title: 'Bao cao phu tung',
        columns: [
          { header: 'Ma phu tung', key: 'partCode', width: 18 },
          { header: 'Ten phu tung', key: 'partName', width: 32 },
          { header: 'So luong', key: 'quantity', width: 12 },
          { header: 'Thanh tien (JPY)', key: 'amount', width: 18 },
        ],
        rows: data.topUsed,
      };
    }

    const data = await this.reports.summary(range);
    return {
      title: 'Bao cao tong hop',
      columns: [
        { header: 'Ngay', key: 'date', width: 14 },
        { header: 'So lich hen', key: 'count', width: 14 },
      ],
      rows: data.bookings.byDay,
    };
  }
}
