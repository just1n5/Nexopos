import { AppDataSource } from '../config/data-source';

async function fixMigrationTable() {
  console.log('Connecting to the database...');
  try {
    await AppDataSource.initialize();
    console.log('Database connected.');

    const queryRunner = AppDataSource.createQueryRunner();

    console.log('Checking for AddBetaKeysAndTenants1728347000000 migration record...');
    const migrationRecord = await queryRunner.query(
      `SELECT * FROM "migrations" WHERE "name" = 'AddBetaKeysAndTenants1728347000000'`
    );

    if (migrationRecord.length > 0) {
      console.log('Migration record already exists. No action needed.');
      return;
    }

    console.log('Inserting missing migration record...');
    await queryRunner.query(
      `INSERT INTO "migrations" ("timestamp", "name") VALUES (1728347000000, 'AddBetaKeysAndTenants1728347000000')`
    );
    console.log('Migration record inserted successfully.');
  } catch (error) {
    console.error('Error fixing migration table:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed.');
    }
  }
}

fixMigrationTable();
