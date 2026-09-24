import { registerAs } from '@nestjs/config';

export default registerAs('notification', () => ({
  sms: {
    driver: process.env.SMS_DRIVER ?? 'console',
    apiKey: process.env.SMS_API_KEY ?? '',
    sender: process.env.SMS_SENDER ?? 'AOYAMA',
  },
  mail: {
    driver: process.env.MAIL_DRIVER ?? 'console',
    host: process.env.MAIL_HOST ?? '',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER ?? '',
    password: process.env.MAIL_PASSWORD ?? '',
    from: process.env.MAIL_FROM ?? 'no-reply@aoyama-service.jp',
  },
}));
