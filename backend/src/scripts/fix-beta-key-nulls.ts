import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

async function fixBetaKeyNulls() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const logger = new Logger('FixBetaKeyNullsScript');

  try {
    logger.log('Starting to fix NULL values for betaKeyUsed in tenants table...');
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateResult = await queryRunner.query(
        `UPDATE tenants SET "betaKeyUsed" = FALSE WHERE "betaKeyUsed" IS NULL;`
      );
      logger.log(`Updated ${updateResult.rowCount} rows in tenants table.`);
      await queryRunner.commitTransaction();
      logger.log('Successfully fixed NULL values for betaKeyUsed.');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      logger.error('Error during transaction, rolling back:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    logger.error('Failed to fix betaKeyUsed NULL values:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

fixBetaKeyNulls();
