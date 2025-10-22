import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcessedByToPaymentsTable1800000000009 implements MigrationInterface {
  name = 'AddProcessedByToPaymentsTable1800000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN "processedById" uuid NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN "processedById";
    `);
  }
}
