import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: (process.env.DB_TYPE as 'postgres') ?? 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
  // synchronize is OFF. Schema is migration-driven. See RFC section 7.
  synchronize: false,
  migrationsTableName: 'migrations',
  // Glob paths point at the compiled .js. Same convention as the main
  // FlowBrand backend, so deploys can reuse the existing tarball pipeline.
  entities: [process.env.DB_ENTITIES ?? 'dist/modules/**/entities/**/*.entity{.ts,.js}'],
  migrations: [process.env.DB_MIGRATIONS ?? 'dist/database/migrations/*{.ts,.js}'],
};

const dataSource = new DataSource(dataSourceOptions);

export async function initializeDataSource(): Promise<DataSource> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
}

export default dataSource;
