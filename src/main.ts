import { networkInterfaces } from 'node:os';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';

/**
 * Anh hien trang xe va anh gui cho tro ly AI duoc truyen duoi dang data URL,
 * nen gioi han 100kb mac dinh cua Express la qua chat. Khi chuyen sang luu tru
 * tep rieng thi ha con so nay xuong.
 */
const BODY_LIMIT = '15mb';

/** Cac dia chi IPv4 may dang dung trong mang noi bo, de in ra cho de doc. */
function diaChiMangNoiBo(): string[] {
  return Object.values(networkInterfaces())
    .flatMap((list) => list ?? [])
    .filter((net) => net.family === 'IPv4' && !net.internal)
    .map((net) => net.address);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  const port = config.get<number>('app.port', 3001);
  const prefix = config.get<string>('app.apiPrefix', 'api');
  const corsOrigins = config.get<string[]>('app.corsOrigins', []);

  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  /**
   * Ngoai cac dia chi khai bao san, o moi truong phat trien cho phep ca
   * may khac trong mang noi bo goi vao.
   *
   * Demo tren dien thoai thi trang mo bang dia chi IP cua may chu
   * ("http://10.1.40.16:3000"), khong phai localhost — khong mo them thi
   * trinh duyet chan het moi loi goi API. Khong ap dung cho ban that:
   * ngoai do chi nhung dia chi ghi ro trong CORS_ORIGINS moi vao duoc.
   */
  const LAN_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)[^/]*$/;
  const choMangNoiBo = config.get<string>('app.env') !== 'production';

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) return callback(null, true);
      if (choMangNoiBo && LAN_ORIGIN.test(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  });
  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: BODY_LIMIT }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger chi bat ngoai moi truong that — NFR-SE-09.
  if (config.get<string>('app.env') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AOYAMA Service API')
      .setDescription(
        'API he thong quan ly dich vu bao duong va sua chua xe may AOYAMA. ' +
          'Tham chieu tai lieu RD-2026-001, SM-2026-001, SS-2026-001.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'M-01 Xac thuc va tai khoan')
      .addTag('public', 'M-02 Noi dung cong khai')
      .addTag('ai', 'M-03 Chatbox AI chan doan, M-12 Tro ly ky thuat')
      .addTag('bookings', 'M-04 Dat lich')
      .addTag('qr', 'M-05 Ma QR va tiep nhan xe')
      .addTag('work-orders', 'M-06 Phieu dich vu')
      .addTag('quotations', 'M-07 Bao gia')
      .addTag('vehicles', 'M-08 Phuong tien va lich su')
      .addTag('customers', 'M-09 Khach hang')
      .addTag('catalog', 'M-10 Dich vu va bang gia')
      .addTag('parts', 'M-11 Phu tung va ton kho')
      .addTag('payments', 'M-13 Thanh toan')
      .addTag('notifications', 'M-14 Thong bao')
      .addTag('reports', 'M-15 Bao cao va thong ke')
      .addTag('stores', 'M-16 Cua hang va lich lam viec')
      .addTag('admin-users', 'M-17 Nguoi dung va phan quyen')
      .addTag('system', 'M-18 Cau hinh va nhat ky')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${prefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // 0.0.0.0: may khac trong mang goi vao duoc, khong chi may dang chay.
  await app.listen(port, '0.0.0.0');

  const log = new Logger('Bootstrap');
  log.log(`API chay tai http://localhost:${port}/${prefix}`);
  for (const dia of diaChiMangNoiBo()) {
    log.log(`  — trong mang noi bo: http://${dia}:${port}/${prefix}`);
  }
}

void bootstrap();
