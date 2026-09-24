import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  const port = config.get<number>('app.port', 3001);
  const prefix = config.get<string>('app.apiPrefix', 'api');
  const corsOrigins = config.get<string[]>('app.corsOrigins', []);

  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: corsOrigins, credentials: true });

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

  await app.listen(port);
  new Logger('Bootstrap').log(`API chay tai http://localhost:${port}/${prefix}`);
}

void bootstrap();
