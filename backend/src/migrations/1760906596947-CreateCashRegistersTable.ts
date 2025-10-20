import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCashRegistersTable1760906596947 implements MigrationInterface {
    name = 'CreateCashRegistersTable1760906596947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "cash_registers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sessionNumber" character varying NOT NULL,
                "userId" uuid NOT NULL,
                "terminalId" character varying,
                "status" character varying NOT NULL DEFAULT 'OPEN',
                "openingBalance" numeric(12,2) NOT NULL,
                "openedAt" TIMESTAMP NOT NULL,
                "openedBy" uuid NOT NULL,
                "closingBalance" numeric(12,2),
                "closingCashAmount" numeric(12,2),
                "expectedBalance" numeric(12,2),
                "expectedClosingBalance" numeric(12,2),
                "actualBalance" numeric(12,2),
                "difference" numeric(12,2),
                "discrepancy" numeric(12,2),
                "closedAt" TIMESTAMP,
                "closedBy" uuid,
                "totalTransactions" integer NOT NULL DEFAULT 0,
                "totalSales" numeric(12,2) NOT NULL DEFAULT 0,
                "totalCashSales" numeric(12,2) NOT NULL DEFAULT 0,
                "totalCardSales" numeric(12,2) NOT NULL DEFAULT 0,
                "totalDigitalSales" numeric(12,2) NOT NULL DEFAULT 0,
                "totalCreditSales" numeric(12,2) NOT NULL DEFAULT 0,
                "totalOtherSales" numeric(12,2) NOT NULL DEFAULT 0,
                "totalRefunds" numeric(12,2) NOT NULL DEFAULT 0,
                "totalExpenses" numeric(12,2) NOT NULL DEFAULT 0,
                "totalDeposits" numeric(12,2) NOT NULL DEFAULT 0,
                "totalWithdrawals" numeric(12,2) NOT NULL DEFAULT 0,
                "cashCount" jsonb,
                "totalCounted" numeric(12,2),
                "openingNotes" text,
                "closingNotes" text,
                "discrepancyReason" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_cash_registers_sessionNumber" UNIQUE ("sessionNumber"),
                CONSTRAINT "PK_cash_registers" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "cash_registers"`);
    }
}
