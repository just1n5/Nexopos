import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomerCreditsTable1800000000013 implements MigrationInterface {
    name = 'CreateCustomerCreditsTable1800000000013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums
        await queryRunner.query(`
            CREATE TYPE "public"."customer_credits_type_enum" AS ENUM('sale', 'payment', 'adjustment', 'return')
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."customer_credits_status_enum" AS ENUM('pending', 'partial', 'paid', 'overdue', 'cancelled')
        `);

        // Create table
        await queryRunner.query(`
            CREATE TABLE "customer_credits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "customerId" uuid NOT NULL,
                "type" "public"."customer_credits_type_enum" NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "paidAmount" numeric(12,2) NOT NULL DEFAULT '0',
                "balance" numeric(12,2) NOT NULL DEFAULT '0',
                "referenceType" character varying(50),
                "referenceId" uuid,
                "referenceNumber" character varying(50),
                "description" text,
                "dueDate" date,
                "paidDate" TIMESTAMP,
                "status" "public"."customer_credits_status_enum" NOT NULL DEFAULT 'pending',
                "daysOverdue" integer NOT NULL DEFAULT '0',
                "remindersSent" integer NOT NULL DEFAULT '0',
                "lastReminderDate" TIMESTAMP,
                "notes" text,
                "createdBy" uuid,
                "metadata" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_customer_credits" PRIMARY KEY ("id")
            )
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_customer_credits_customerId" ON "customer_credits" ("customerId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_customer_credits_type" ON "customer_credits" ("type")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_customer_credits_status" ON "customer_credits" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_customer_credits_dueDate" ON "customer_credits" ("dueDate")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_customer_credits_reference" ON "customer_credits" ("referenceType", "referenceId")
        `);

        // Add foreign key
        await queryRunner.query(`
            ALTER TABLE "customer_credits"
            ADD CONSTRAINT "FK_customer_credits_customerId"
            FOREIGN KEY ("customerId")
            REFERENCES "customers"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key
        await queryRunner.query(`
            ALTER TABLE "customer_credits" DROP CONSTRAINT "FK_customer_credits_customerId"
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_credits_reference"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_credits_dueDate"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_credits_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_credits_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_credits_customerId"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "customer_credits"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE "public"."customer_credits_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."customer_credits_type_enum"`);
    }
}
