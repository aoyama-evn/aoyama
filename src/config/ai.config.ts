import { registerAs } from '@nestjs/config';

/**
 * AI-01..AI-05. Khi AI_ENABLED=false hoac dich vu khong phan hoi, cac module
 * nghiep vu van phai dung duoc o che do thu cong (OV-2026-001 §9, nguyen tac 4).
 */
export default registerAs('ai', () => ({
  enabled: process.env.AI_ENABLED === 'true',
  provider: process.env.AI_PROVIDER ?? 'anthropic',
  apiKey: process.env.AI_API_KEY ?? '',
  model: process.env.AI_MODEL ?? 'claude-sonnet-5',
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? '10000', 10),
}));
