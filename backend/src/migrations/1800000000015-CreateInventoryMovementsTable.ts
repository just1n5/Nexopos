import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryMovementsTable1800000000015 implements MigrationInterface {
  name = 'CreateInventoryMovementsTable1800000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE public.movement_type_enum AS ENUM(
          'IN', 'OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT',
          'TRANSFER_IN', 'TRANSFER_OUT', 'SALE', 'PURCHASE', 'RETURN'
        );
        CREATE TYPE public.movement_status_enum AS ENUM('PENDING', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create inventory_movements table
    await queryRunner.query(`
      CREATE TABLE "inventory_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "productVariantId" uuid NULL,
        "warehouseId" uuid NULL,
        "type" public.movement_type_enum NOT NULL,
        "quantity" numeric(10,3) NOT NULL,
        "unitCost" numeric(12,2) NOT NULL,
        "totalCost" numeric(12,2) NOT NULL,
        "referenceType" character varying(50) NULL,
        "referenceId" uuid NULL,
        "notes" text NULL,
        "processedById" uuid NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_movements" PRIMARY KEY ("id")
      )
    `);

    // Add indexes
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_tenantId" ON "inventory_movements" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_productId" ON "inventory_movements" ("productId")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_warehouseId" ON "inventory_movements" ("warehouseId")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_reference" ON "inventory_movements" ("referenceType", "referenceId")`);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "FK_inventory_movements_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "FK_inventory_movements_product"
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "FK_inventory_movements_productVariant"
      FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    // Assuming a warehouses table exists
    // await queryRunner.query(`
    //   ALTER TABLE "inventory_movements"
    //   ADD CONSTRAINT "FK_inventory_movements_warehouse"
    //   FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    // `);
    await queryRunner.query(`
      ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "FK_inventory_movements_processedBy"
      FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_processedBy"`);
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_warehouse"`);
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_productVariant"`);
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_product"`);
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_reference"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_warehouseId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_productId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_tenantId"`);
    await queryRunner.query(`DROP TABLE "inventory_movements"`);
    await queryRunner.query(`DROP TYPE "public"."movement_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."movement_type_enum"`);
  }
}
