import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpensesTable1800000000007 implements MigrationInterface {
  name = 'CreateExpensesTable1800000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE public.expense_type_enum AS ENUM(
          'INVENTORY_PURCHASE', 'RENT', 'UTILITIES', 'INTERNET_PHONE',
          'PAYROLL', 'PROFESSIONAL_SERVICES', 'INSURANCE', 'MAINTENANCE',
          'TRAVEL', 'ADVERTISING', 'OFFICE_SUPPLIES', 'TAXES_FEES', 'OTHER'
        );
        CREATE TYPE public.expense_status_enum AS ENUM('PENDING', 'PAID', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create expenses table
    await queryRunner.query(`
      CREATE TABLE "expenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "expenseNumber" character varying(50) NULL,
        "type" public.expense_type_enum NOT NULL,
        "status" public.expense_status_enum NOT NULL DEFAULT 'PENDING',
        "expenseDate" date NOT NULL,
        "supplierName" character varying(200) NOT NULL,
        "invoiceNumber" character varying(100) NULL,
        "description" text NULL,
        "subtotal" numeric(12,2) NOT NULL,
        "taxAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "total" numeric(12,2) NOT NULL,
        "paymentMethod" public.payment_method_enum NOT NULL,
        "paymentDate" date NULL,
        "invoiceImageUrl" text NULL,
        "notes" text NULL,
        "processedById" uuid NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expenses" PRIMARY KEY ("id")
      )
    `);

    // Add indexes
    await queryRunner.query(`CREATE INDEX "IDX_expenses_tenantId_expenseDate" ON "expenses" ("tenantId", "expenseDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_expenses_status" ON "expenses" ("status")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_expenses_tenantId_expenseNumber" ON "expenses" ("tenantId", "expenseNumber") WHERE "expenseNumber" IS NOT NULL`);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_processedBy"
      FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_processedBy"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_expenses_tenantId_expenseNumber"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_expenses_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_expenses_tenantId_expenseDate"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TYPE "public"."expense_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."expense_type_enum"`);
  }
}
