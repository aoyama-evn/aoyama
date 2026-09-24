import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  driver: process.env.STORAGE_DRIVER ?? 'local',
  localDir: process.env.STORAGE_LOCAL_DIR ?? './storage',
  publicUrl: process.env.STORAGE_PUBLIC_URL ?? 'http://localhost:3001/files',
}));
