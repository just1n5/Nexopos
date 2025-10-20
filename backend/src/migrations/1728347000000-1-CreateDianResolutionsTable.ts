import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDianResolutionsTable1728347000000_1 implements MigrationInterface {
    name = 'CreateDianResolutionsTable1728347000000_1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "dian_resolutions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "resolutionNumber" character varying NOT NULL,
                "resolutionDate" date NOT NULL,
                "validFrom" date NOT NULL,
                "validUntil" date NOT NULL,
                "prefix" character varying NOT NULL,
                "rangeFrom" bigint NOT NULL,
                "rangeTo" bigint NOT NULL,
                "currentNumber" bigint NOT NULL,
                "technicalKey" character varying NOT NULL,
                "testSetId" character varying,
                "status" character varying NOT NULL DEFAULT 'ACTIVE',
                "invoicesIssued" bigint NOT NULL DEFAULT 0,
                "usedCount" bigint NOT NULL DEFAULT 0,
                "invoicesRemaining" bigint NOT NULL,
                "alertThreshold" integer NOT NULL DEFAULT 100,
                "alertSent" boolean NOT NULL DEFAULT false,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_dian_resolutions_prefix" UNIQUE ("prefix"),
                CONSTRAINT "PK_dian_resolutions" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "dian_resolutions"`);
    }
}
