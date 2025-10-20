import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSalesTable1760555133633 implements MigrationInterface {
    name = 'CreateSalesTable1760555133633'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "sales" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "saleNumber" character varying NOT NULL,
                "type" character varying NOT NULL DEFAULT 'REGULAR',
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "customerId" uuid,
                "userId" uuid NOT NULL,
                "cashRegisterId" uuid,
                "subtotal" numeric(12,2) NOT NULL,
                "discountAmount" numeric(12,2) NOT NULL DEFAULT 0,
                "discountPercent" numeric(5,2) NOT NULL DEFAULT 0,
                "taxAmount" numeric(12,2) NOT NULL,
                "total" numeric(12,2) NOT NULL,
                "paidAmount" numeric(12,2) NOT NULL DEFAULT 0,
                "changeAmount" numeric(12,2) NOT NULL DEFAULT 0,
                "creditAmount" numeric(12,2) NOT NULL DEFAULT 0,
                "creditDueDate" date,
                "creditPaidDate" date,
                "completedAt" TIMESTAMP,
                "cancelledAt" TIMESTAMP,
                "cancelledBy" character varying,
                "cancellationReason" character varying(500),
                "requiresInvoice" boolean NOT NULL DEFAULT false,
                "notes" character varying(500),
                "invoiceId" character varying,
                "invoiceNumber" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_sales_saleNumber" UNIQUE ("saleNumber"),
                CONSTRAINT "PK_sales" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sales"`);
    }
}
