import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './common/guards';
import { LoggingInterceptor } from './common/interceptors';
import { configurations } from './config';
import { dataSourceOptions } from './database/data-source';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ContentModule } from './modules/content/content.module';
import { CustomersModule } from './modules/customers/customers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PartsModule } from './modules/parts/parts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { StoresModule } from './modules/stores/stores.module';
import { SystemModule } from './modules/system/system.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: configurations, cache: true }),
    TypeOrmModule.forRoot({ ...dataSourceOptions, autoLoadEntities: false }),
    ScheduleModule.forRoot(),

    // M-18 dat truoc vi cac module khac doc cau hinh va ghi nhat ky qua no.
    SystemModule,
    NotificationsModule,

    AuthModule,
    AdminUsersModule,
    CustomersModule,
    VehiclesModule,
    StoresModule,
    CatalogModule,
    PartsModule,
    BookingsModule,
    WorkOrdersModule,
    QuotationsModule,
    PaymentsModule,
    AiModule,
    ReportsModule,
    ContentModule,
    SchedulerModule,
  ],
  providers: [
    // Mac dinh moi tuyen deu can dang nhap; tuyen cong khai danh dau bang @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
