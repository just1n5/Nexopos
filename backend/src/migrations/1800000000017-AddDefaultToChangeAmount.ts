import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultToChangeAmount1800000000017 implements MigrationInterface {
  name = 'AddDefaultToChangeAmount1800000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add DEFAULT 0 to changeAmount column for existing data
    await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "changeAmount" SET DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      ALTER COLUMN "changeAmount" DROP DEFAULT;
    `);
  }
}
