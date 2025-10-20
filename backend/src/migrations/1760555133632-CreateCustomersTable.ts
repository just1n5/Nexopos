import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomersTable1760555133632 implements MigrationInterface {
    name = 'CreateCustomersTable1760555133632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "customers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying NOT NULL DEFAULT 'individual',
                "documentType" character varying(20) NOT NULL,
                "documentNumber" character varying(20) NOT NULL,
                "firstName" character varying(100) NOT NULL,
                "lastName" character varying(100),
                "businessName" character varying(200),
                "email" character varying(100),
                "phone" character varying(20),
                "mobile" character varying(20),
                "address" text,
                "city" character varying(100),
                "state" character varying(100),
                "postalCode" character varying(10),
                "birthDate" date,
                "creditEnabled" boolean NOT NULL DEFAULT false,
                "creditLimit" numeric(12,2) NOT NULL DEFAULT 0,
                "creditUsed" numeric(12,2) NOT NULL DEFAULT 0,
                "creditAvailable" numeric(12,2) NOT NULL DEFAULT 0,
                "creditDays" integer NOT NULL DEFAULT 30,
                "totalPurchases" numeric(12,2) NOT NULL DEFAULT 0,
                "totalPayments" numeric(12,2) NOT NULL DEFAULT 0,
                "balance" numeric(12,2) NOT NULL DEFAULT 0,
                "purchaseCount" integer NOT NULL DEFAULT 0,
                "lastPurchaseDate" TIMESTAMP,
                "lastPaymentDate" TIMESTAMP,
                "loyaltyPoints" integer NOT NULL DEFAULT 0,
                "lifetimeValue" numeric(12,2) NOT NULL DEFAULT 0,
                "whatsapp" character varying(20),
                "acceptsMarketing" boolean NOT NULL DEFAULT true,
                "acceptsReminders" boolean NOT NULL DEFAULT true,
                "notes" text,
                "metadata" jsonb,
                "status" character varying NOT NULL DEFAULT 'active',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_customers" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "customers"`);
    }
}
