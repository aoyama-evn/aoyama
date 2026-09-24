import { Injectable, Logger } from '@nestjs/common';

export interface MailSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export const MAIL_PROVIDER = 'MAIL_PROVIDER';

export interface MailProvider {
  send(to: string, subject: string, body: string): Promise<MailSendResult>;
}

/** Driver mac dinh khi phat trien — in ra log thay vi gui that. */
@Injectable()
export class ConsoleMailProvider implements MailProvider {
  private readonly logger = new Logger('MAIL');

  async send(to: string, subject: string, body: string): Promise<MailSendResult> {
    this.logger.log(`[console] gui email toi ${to} — ${subject}`);
    this.logger.debug(body);
    return { success: true, providerMessageId: `console-${Date.now()}` };
  }
}
