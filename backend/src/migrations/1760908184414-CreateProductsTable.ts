import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsTable1760908184414 implements MigrationInterface {
    name = 'CreateProductsTable1760908184414'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(120) NOT NULL,
                "description" character varying(500),
                "sku" character varying(80) NOT NULL,
                "barcode" character varying(80),
                "basePrice" numeric(12,2) NOT NULL,
                "status" character varying NOT NULL DEFAULT 'ACTIVE',
                "sale_type" character varying NOT NULL DEFAULT 'UNIT',
                "price_per_gram" numeric(12,4),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
                CONSTRAINT "PK_products" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "products"`);
    }
}