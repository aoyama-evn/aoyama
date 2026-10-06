import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminNotification } from './entities/admin-notification.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { MyNotificationsController, NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ConsoleMailProvider, MAIL_PROVIDER } from './providers/mail.provider';
import { ConsoleSmsProvider, HttpSmsProvider, SMS_PROVIDER } from './providers/sms.provider';

/** M-14 — Thong bao SMS va email. */
@Module({
  imports: [TypeOrmModule.forFeature([NotificationTemplate, NotificationLog, AdminNotification])],
  controllers: [NotificationsController, MyNotificationsController],
  providers: [
    NotificationsService,
    AdminNotificationsService,
    ConsoleSmsProvider,
    HttpSmsProvider,
    ConsoleMailProvider,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService, ConsoleSmsProvider, HttpSmsProvider],
      useFactory: (
        config: ConfigService,
        consoleDriver: ConsoleSmsProvider,
        httpDriver: HttpSmsProvider,
      ) => (config.get<string>('notification.sms.driver') === 'http' ? httpDriver : consoleDriver),
    },
    {
      provide: MAIL_PROVIDER,
      inject: [ConsoleMailProvider],
      useFactory: (consoleDriver: ConsoleMailProvider) => consoleDriver,
    },
  ],
  exports: [NotificationsService, AdminNotificationsService],
})
export class NotificationsModule {}
