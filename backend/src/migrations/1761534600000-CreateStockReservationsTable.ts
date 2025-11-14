import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStockReservationsTable1761534600000 implements MigrationInterface {
  name = 'CreateStockReservationsTable1761534600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type for reservation status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE public.reservation_status_enum AS ENUM('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create stock_reservations table
    await queryRunner.query(`
      CREATE TABLE "stock_reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "stockId" uuid NOT NULL,
        "productId" character varying NOT NULL,
        "productVariantId" character varying NULL,
        "quantity" numeric(10,3) NOT NULL,
        "status" public.reservation_status_enum NOT NULL DEFAULT 'ACTIVE',
        "referenceType" character varying NULL,
        "referenceId" character varying NULL,
        "referenceNumber" character varying NULL,
        "userId" character varying NOT NULL,
        "notes" text NULL,
        "expiresAt" timestamp NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_reservations" PRIMARY KEY ("id")
      )
    `);

    // Add indexes for performance
    await queryRunner.query(`CREATE INDEX "IDX_stock_reservations_stockId" ON "stock_reservations" ("stockId")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_reservations_productId" ON "stock_reservations" ("productId")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_reservations_status" ON "stock_reservations" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_reservations_expiresAt" ON "stock_reservations" ("expiresAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_reservations_reference" ON "stock_reservations" ("referenceType", "referenceId")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_reservations_tenantId" ON "stock_reservations" ("tenantId")`);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "stock_reservations"
      ADD CONSTRAINT "FK_stock_reservations_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "stock_reservations"
      ADD CONSTRAINT "FK_stock_reservations_stock"
      FOREIGN KEY ("stockId") REFERENCES "inventory_stock"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "stock_reservations" DROP CONSTRAINT "FK_stock_reservations_stock"`);
    await queryRunner.query(`ALTER TABLE "stock_reservations" DROP CONSTRAINT "FK_stock_reservations_tenant"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_reservations_tenantId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_reservations_reference"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_reservations_expiresAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_reservations_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_reservations_productId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_reservations_stockId"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "stock_reservations"`);

    // Drop ENUM type
    await queryRunner.query(`DROP TYPE "public"."reservation_status_enum"`);
  }
}
