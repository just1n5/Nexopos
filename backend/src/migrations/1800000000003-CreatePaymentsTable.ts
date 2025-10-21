import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsTable1800000000003 implements MigrationInterface {
  name = 'CreatePaymentsTable1800000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE public.payment_method_enum AS ENUM('CASH', 'CARD', 'TRANSFER', 'NEQUI', 'DAVI_PLATA', 'CREDIT');
        CREATE TYPE public.payment_status_enum AS ENUM('PENDING', 'COMPLETED', 'REFUNDED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "saleId" uuid NOT NULL,
        "method" public.payment_method_enum NOT NULL,
        "status" public.payment_status_enum NOT NULL DEFAULT 'PENDING',
        "amount" numeric(12,2) NOT NULL,
        "receivedAmount" numeric(12,2) NOT NULL,
        "changeAmount" numeric(12,2) NOT NULL,
        "changeGiven" numeric(12,2) NULL,
        "transactionId" character varying(255) NULL,
        "notes" character varying(255) NULL,
        "processedById" uuid NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    // Add indexes
    await queryRunner.query(`CREATE INDEX "IDX_payments_saleId" ON "payments" ("saleId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_processedById" ON "payments" ("processedById")`);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_sale"
      FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_processedBy"
      FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_processedBy"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_sale"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_processedById"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_saleId"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payment_method_enum"`);
  }
}
