import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSaleItemsTable1800000000002 implements MigrationInterface {
  name = 'CreateSaleItemsTable1800000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sale_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "saleId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "productVariantId" uuid NULL,
        "productName" character varying NOT NULL,
        "productSku" character varying NOT NULL,
        "variantName" character varying NULL,
        "quantity" numeric(10,3) NOT NULL,
        "unitPrice" numeric(12,2) NOT NULL,
        "costPrice" numeric(12,2) NOT NULL,
        "discountAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "discountPercent" numeric(5,2) NOT NULL DEFAULT 0,
        "taxRate" numeric(5,2) NOT NULL DEFAULT 0,
        "taxAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "taxCode" character varying NULL,
        "subtotal" numeric(12,2) NOT NULL,
        "total" numeric(12,2) NOT NULL,
        "notes" character varying(255) NULL,
        CONSTRAINT "PK_sale_items" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_sale_items_saleId_productId" ON "sale_items" ("saleId", "productId")`);

    await queryRunner.query(`
      ALTER TABLE "sale_items"
      ADD CONSTRAINT "FK_sale_items_sale"
      FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_sale_items_sale"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sale_items_saleId_productId"`);
    await queryRunner.query(`DROP TABLE "sale_items"`);
  }
}
