import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrCodeDataToPaymentsTableFinal1800000000013 implements MigrationInterface {
  name = 'AddQrCodeDataToPaymentsTableFinal1800000000013';

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
