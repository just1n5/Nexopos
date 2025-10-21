import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryStockTable1760908184417 implements MigrationInterface {
  name = 'CreateInventoryStockTable1760908184417';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE public.stock_status_enum AS ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'RESERVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create inventory_stock table
    await queryRunner.query(`
      CREATE TABLE "inventory_stock" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "productVariantId" uuid NULL,
        "quantity" numeric(10,3) NOT NULL DEFAULT 0,
        "availableQuantity" numeric(10,3) NOT NULL DEFAULT 0,
        "reservedQuantity" numeric(10,3) NOT NULL DEFAULT 0,
        "minStockLevel" numeric(10,3) NOT NULL DEFAULT 0,
        "maxStockLevel" numeric(10,3) NOT NULL DEFAULT 0,
        "reorderPoint" numeric(10,3) NOT NULL DEFAULT 0,
        "reorderQuantity" numeric(10,3) NOT NULL DEFAULT 0,
        "status" public.stock_status_enum NOT NULL DEFAULT 'IN_STOCK',
        "averageCost" numeric(12,2) NOT NULL DEFAULT 0,
        "lastCost" numeric(12,2) NOT NULL DEFAULT 0,
        "totalValue" numeric(12,2) NOT NULL DEFAULT 0,
        "batchNumber" character varying NULL,
        "expiryDate" date NULL,
        "manufacturingDate" date NULL,
        "warehouseId" uuid NULL,
        "warehouseName" character varying NULL,
        "locationId" uuid NULL,
        "locationName" character varying NULL,
        "bin" character varying NULL,
        "lastMovementId" uuid NULL,
        "lastMovementDate" timestamp NULL,
        "lastCountDate" timestamp NULL,
        "lastCountQuantity" numeric(10,3) NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_stock" PRIMARY KEY ("id")
      )
    `);

    // Add unique constraint
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_inventory_stock_product_variant_warehouse_batch" ON "inventory_stock" ("productId", "productVariantId", "warehouseId", "batchNumber") WHERE "batchNumber" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_inventory_stock_product_variant_warehouse_no_batch" ON "inventory_stock" ("productId", "productVariantId", "warehouseId") WHERE "batchNumber" IS NULL`);

    // Add indexes
    await queryRunner.query(`CREATE INDEX "IDX_inventory_stock_productId" ON "inventory_stock" ("productId")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_stock_productVariantId" ON "inventory_stock" ("productVariantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_stock_warehouseId" ON "inventory_stock" ("warehouseId")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_stock_status" ON "inventory_stock" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_stock_tenantId" ON "inventory_stock" ("tenantId")`);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "inventory_stock"
      ADD CONSTRAINT "FK_inventory_stock_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_stock"
      ADD CONSTRAINT "FK_inventory_stock_product"
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_stock"
      ADD CONSTRAINT "FK_inventory_stock_productVariant"
      FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    // Assuming a warehouses table exists
    // await queryRunner.query(`
    //   ALTER TABLE "inventory_stock"
    //   ADD CONSTRAINT "FK_inventory_stock_warehouse"
    //   FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    // await queryRunner.query(`ALTER TABLE "inventory_stock" DROP CONSTRAINT "FK_inventory_stock_warehouse"`);
    await queryRunner.query(`ALTER TABLE "inventory_stock" DROP CONSTRAINT "FK_inventory_stock_productVariant"`);
    await queryRunner.query(`ALTER TABLE "inventory_stock" DROP CONSTRAINT "FK_inventory_stock_product"`);
    await queryRunner.query(`ALTER TABLE "inventory_stock" DROP CONSTRAINT "FK_inventory_stock_tenant"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_stock_tenantId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_stock_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_stock_warehouseId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_stock_productVariantId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_stock_productId"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_inventory_stock_product_variant_warehouse_no_batch"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_inventory_stock_product_variant_warehouse_batch"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "inventory_stock"`);

    // Drop ENUM type
    await queryRunner.query(`DROP TYPE "public"."stock_status_enum"`);
  }
}
