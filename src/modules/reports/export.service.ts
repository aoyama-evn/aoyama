import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * FR-RPT-12 — xuat bao cao ra Excel va PDF.
 * Tach rieng khoi ReportsService de logic so lieu khong dinh vao dinh dang tep.
 */
@Injectable()
export class ExportService {
  async toExcel(
    sheetName: string,
    columns: ExportColumn[],
    rows: Record<string, unknown>[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AOYAMA Service';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 18 }));
    sheet.getRow(1).font = { bold: true };
    sheet.addRows(rows);

    // Khoa dong tieu de de bang dai van doc duoc.
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async toPdf(
    title: string,
    columns: ExportColumn[],
    rows: Record<string, unknown>[],
    subtitle?: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(title, { align: 'left' });
      if (subtitle) {
        doc.moveDown(0.3).fontSize(10).fillColor('#555').text(subtitle);
      }
      doc.moveDown(0.8).fillColor('#000');

      const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const columnWidth = usableWidth / columns.length;

      const drawRow = (values: string[], bold = false) => {
        const y = doc.y;
        doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica');
        values.forEach((value, index) => {
          doc.text(value, doc.page.margins.left + index * columnWidth, y, {
            width: columnWidth - 6,
            ellipsis: true,
          });
        });
        doc.moveDown(0.6);
      };

      drawRow(
        columns.map((c) => c.header),
        true,
      );

      for (const row of rows) {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 30) {
          doc.addPage();
          drawRow(
            columns.map((c) => c.header),
            true,
          );
        }
        drawRow(columns.map((c) => formatCell(row[c.key])));
      }

      doc.end();
    });
  }
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value.toLocaleString('ja-JP');
  if (value instanceof Date) return value.toISOString().slice(0, 16).replace('T', ' ');
  return String(value);
}
