import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductVariantsTable1760908184415 implements MigrationInterface {
    name = 'CreateProductVariantsTable1760908184415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "product_variants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(120) NOT NULL,
                "sku" character varying(80) NOT NULL,
                "barcode" character varying(80),
                "size" character varying(40),
                "color" character varying(40),
                "priceDelta" numeric(12,2) NOT NULL DEFAULT 0,
                "stock" integer NOT NULL DEFAULT 0,
                "productId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_product_variants_sku" UNIQUE ("sku"),
                CONSTRAINT "PK_product_variants" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "product_variants"
            ADD CONSTRAINT "FK_product_variants_product"
            FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_product_variants_product"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
    }
}
