import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrCodeDataToPaymentsTable1800000000006 implements MigrationInterface {
  name = 'AddQrCodeDataToPaymentsTable1800000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN "qrCodeData" text NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN "qrCodeData";
    `);
  }
}
