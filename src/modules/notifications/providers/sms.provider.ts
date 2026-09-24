import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export const SMS_PROVIDER = 'SMS_PROVIDER';

export interface SmsProvider {
  send(to: string, body: string): Promise<SmsSendResult>;
}

/**
 * Driver mac dinh khi phat trien — in ra log thay vi gui that.
 * Nha cung cap SMS thuc te con cho OQ-06; khi chot chi can them mot lop
 * cai dat SmsProvider va doi SMS_DRIVER.
 */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS');

  async send(to: string, body: string): Promise<SmsSendResult> {
    this.logger.log(`[console] gui SMS toi ${to}: ${body.replace(/\n/g, ' | ')}`);
    return { success: true, providerMessageId: `console-${Date.now()}` };
  }
}

/**
 * Khung san cho nha cung cap that. Giu nguyen chu ky de doi driver khong
 * anh huong toi NotificationsService.
 */
@Injectable()
export class HttpSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS');

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async send(to: string, body: string): Promise<SmsSendResult> {
    const apiKey = this.config.get<string>('notification.sms.apiKey');
    if (!apiKey) {
      return { success: false, error: 'Chua cau hinh SMS_API_KEY' };
    }
    // Chi tiet endpoint phu thuoc nha cung cap duoc chot tai OQ-06.
    this.logger.warn(`Chua cai dat driver SMS that, bo qua tin nhan toi ${to}`);
    return { success: false, error: 'SMS driver chua duoc cai dat' };
  }
}
