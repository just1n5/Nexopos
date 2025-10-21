import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantIdToInventoryStockTable1800000000014 implements MigrationInterface {
  name = 'AddTenantIdToInventoryStockTable1800000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inventory_stock"
      ADD COLUMN "tenantId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    `);
    // Update existing rows with a default tenantId if necessary
    // This assumes a default tenant exists or will be handled by application logic
    // For now, we'll use a dummy UUID, which should be replaced by actual tenantId in production
    await queryRunner.query(`
      UPDATE "inventory_stock"
      SET "tenantId" = (SELECT id FROM "tenants" LIMIT 1)
      WHERE "tenantId" = '00000000-0000-0000-0000-000000000000';
    `);
    await queryRunner.query(`ALTER TABLE "inventory_stock" ADD CONSTRAINT "FK_inventory_stock_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_stock_tenantId" ON "inventory_stock" ("tenantId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inventory_stock" DROP CONSTRAINT "FK_inventory_stock_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_inventory_stock_tenantId"`);
    await queryRunner.query(`ALTER TABLE "inventory_stock" DROP COLUMN "tenantId"`);
  }
}
