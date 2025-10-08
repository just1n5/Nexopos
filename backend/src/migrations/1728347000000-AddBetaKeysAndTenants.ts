import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBetaKeysAndTenants1728347000000 implements MigrationInterface {
  name = 'AddBetaKeysAndTenants1728347000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "businessName" character varying(200) NOT NULL,
        "nit" character varying(50) NOT NULL,
        "businessType" character varying(100) NOT NULL,
        "address" character varying(500) NOT NULL,
        "phone" character varying(20) NULL,
        "email" character varying(100) NULL,
        "betaKeyUsed" character varying(20) NULL,
        "maxAdmins" integer NOT NULL DEFAULT '1',
        "maxManagers" integer NOT NULL DEFAULT '1',
        "maxCashiers" integer NOT NULL DEFAULT '2',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenant_nit" UNIQUE ("nit"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    // Create beta_keys table
    await queryRunner.query(`
      CREATE TABLE "beta_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying(20) NOT NULL,
        "isUsed" boolean NOT NULL DEFAULT false,
        "usedByTenantId" uuid NULL,
        "usedAt" TIMESTAMP NULL,
        "notes" text NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_beta_key" UNIQUE ("key"),
        CONSTRAINT "PK_beta_keys" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key for beta_keys -> tenants
    await queryRunner.query(`
      ALTER TABLE "beta_keys"
      ADD CONSTRAINT "FK_beta_keys_tenant"
      FOREIGN KEY ("usedByTenantId")
      REFERENCES "tenants"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // Modify users table to add tenant relationship
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "tenantId" uuid NULL,
      ADD COLUMN "isOwner" boolean NOT NULL DEFAULT false,
      ADD COLUMN "documentId" character varying(20) NULL,
      ADD COLUMN "phoneNumber" character varying(20) NULL
    `);

    // Add foreign key for users -> tenants
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_tenant"
      FOREIGN KEY ("tenantId")
      REFERENCES "tenants"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Create indices for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_beta_keys_used" ON "beta_keys" ("isUsed")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_tenant" ON "users" ("tenantId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_beta_keys_used"`);

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "beta_keys" DROP CONSTRAINT IF EXISTS "FK_beta_keys_tenant"`,
    );

    // Drop new columns from users table
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "tenantId",
      DROP COLUMN IF EXISTS "isOwner",
      DROP COLUMN IF EXISTS "documentId",
      DROP COLUMN IF EXISTS "phoneNumber"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "beta_keys"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
  }
}
