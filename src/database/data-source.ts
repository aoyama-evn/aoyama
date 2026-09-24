import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ENTITIES } from './entities';

loadEnv();

/**
 * Cau hinh dung chung cho ung dung va cho TypeORM CLI.
 *
 * synchronize chi duoc bat khi DB_SYNCHRONIZE=true VA khong phai moi truong that.
 * Muc dich la de chay duoc ngay sau `docker compose up` khi chua co migration nao;
 * truoc khi phat hanh, sinh migration bang `npm run migration:generate` roi tat co
 * nay di — moi thay doi lieu do phai qua migration (NFR-MA-04).
 */
const synchronize =
  process.env.DB_SYNCHRONIZE === 'true' && process.env.NODE_ENV !== 'production';
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'aoyama',
  password: process.env.DB_PASSWORD ?? 'aoyama',
  database: process.env.DB_NAME ?? 'aoyama_service',
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize,
  logging: process.env.DB_LOGGING === 'true',
};

export default new DataSource(dataSourceOptions);
