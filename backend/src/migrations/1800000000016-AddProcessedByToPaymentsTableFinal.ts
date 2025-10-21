import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcessedByToPaymentsTableFinal1800000000016 implements MigrationInterface {
  name = 'AddProcessedByToPaymentsTableFinal1800000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN "processedById" uuid NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_processedBy"
      FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_processedBy"`);
    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN "processedById";
    `);
  }
}
