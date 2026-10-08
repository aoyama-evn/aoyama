import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ENTITIES } from './entities';

loadEnv();

/**
 * Cau hinh dung chung cho ung dung va cho TypeORM CLI.
 *
 * synchronize chi duoc bat khi DB_SYNCHRONIZE=true VA khong phai moi truong that.
 * Muc dich la de chay duoc ngay sau `docker compose up` khi chua co migration nao;
 * tren may chu that thi schema do migration dung len (NFR-MA-04) — xem
 * src/database/migrations.
 */
const synchronize = process.env.DB_SYNCHRONIZE === 'true' && process.env.NODE_ENV !== 'production';

/**
 * Chung chi SSL cua Postgres dich vu cho thue.
 *
 * Render, Fly, Neon, Supabase deu bat buoc SSL khi goi tu ngoai vao, nhung
 * chung ky bang CA rieng ma anh Node khong co san trong kho tin cay — khong
 * noi them thi bi tu choi ngay o buoc bat tay. Tat kiem tra chung chi chi
 * anh huong den viec xac minh danh tinh may chu, duong truyen van ma hoa.
 *
 * Dat DB_SSL=false neu Postgres nam cung mang noi bo (Render goi la internal
 * connection) — luc do khong can SSL va bat vao chi ton them mot vong bat tay.
 */
const ssl =
  process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

/**
 * Mot chuoi ket noi, hoac nam tham so roi.
 *
 * Dich vu cho thue phat ra DATABASE_URL va khong cho tach san tung phan; con
 * may lap trinh thi quen dat tung bien mot trong .env. Nhan ca hai, uu tien
 * chuoi ket noi vi khi no co mat thi gan nhu chac chan dang chay tren may chu.
 */
const base = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER ?? 'aoyama',
      password: process.env.DB_PASSWORD ?? 'aoyama',
      database: process.env.DB_NAME ?? 'aoyama_service',
    };

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...base,
  ssl,
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize,
  logging: process.env.DB_LOGGING === 'true',
};

export default new DataSource(dataSourceOptions);
