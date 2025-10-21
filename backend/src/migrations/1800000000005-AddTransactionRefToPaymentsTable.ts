import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionRefToPaymentsTable1800000000005 implements MigrationInterface {
  name = 'AddTransactionRefToPaymentsTable1800000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN "transactionRef" character varying(255) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN "transactionRef";
    `);
  }
}
