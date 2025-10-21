import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrCodeDataToPaymentsTableAgain1800000000008 implements MigrationInterface {
  name = 'AddQrCodeDataToPaymentsTableAgain1800000000008';

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
