import 'reflect-metadata';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

// Only load dotenv if DATABASE_URL is not already set (e.g., by Dokku)
if (!process.env.DATABASE_URL) {
  const { config } = require('dotenv');
  config({ path: '.env' });
}

const fileExtensions = ['ts', 'js'];
const entities = fileExtensions.map((ext) => join(__dirname, '..', 'modules', '**', `*.entity.${ext}`));
const migrations = fileExtensions.map((ext) => join(__dirname, '..', 'migrations', `*.${ext}`));

let dataSourceOptions: DataSourceOptions;

if (process.env.DATABASE_URL) {
  // Production configuration (for Dokku, Heroku, etc.)
  dataSourceOptions = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for many cloud database providers
    },
    entities,
    migrations,
  };
} else {
  // Local development configuration
  dataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
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
}

export const AppDataSource = new DataSource(dataSourceOptions);
