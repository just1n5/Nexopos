import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

config({ path: '.env' });

const fileExtensions = ['ts', 'js'];
const entities = fileExtensions.map((ext) => join(__dirname, '..', 'modules', '**', `*.entity.${ext}`));
const migrations = fileExtensions.map((ext) => join(__dirname, '..', 'migrations', `*.${ext}`));

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: 'dpg-d3qm5j8dl3ps73c2td30-a',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'nexopos_user',
  password: process.env.DB_PASSWORD ?? 'nexopos123',
  database: process.env.DB_NAME ?? 'nexopos',
  schema: process.env.DB_SCHEMA ?? 'public',
  synchronize: (process.env.DB_SYNC ?? 'false') === 'true',
  logging: (process.env.DB_LOGGING ?? 'false') === 'true',
  entities,
  migrations,
};

export const AppDataSource = new DataSource(dataSourceOptions);
