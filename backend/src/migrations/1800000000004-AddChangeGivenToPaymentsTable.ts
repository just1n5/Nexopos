import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChangeGivenToPaymentsTable1800000000004 implements MigrationInterface {
  name = 'AddChangeGivenToPaymentsTable1800000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN "changeGiven" numeric(12,2) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN "changeGiven";
    `);
  }
}
