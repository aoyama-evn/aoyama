import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ENTITIES } from './entities';

loadEnv();

/**
 * Cau hinh dung chung cho ung dung va cho TypeORM CLI.
 * synchronize luon tat — moi thay doi lieu do di qua migration (NFR-MA-04).
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'aoyama',
  password: process.env.DB_PASSWORD ?? 'aoyama',
  database: process.env.DB_NAME ?? 'aoyama_service',
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
};

export default new DataSource(dataSourceOptions);
