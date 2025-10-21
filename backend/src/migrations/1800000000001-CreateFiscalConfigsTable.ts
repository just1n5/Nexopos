import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiscalConfigsTable1800000000001 implements MigrationInterface {
  name = 'CreateFiscalConfigsTable1800000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE public.tax_regime_enum AS ENUM('SIMPLIFIED', 'COMMON', 'SPECIAL', 'GRANDES_CONTRIBUYENTES');
        CREATE TYPE public.vat_declaration_period_enum AS ENUM('MONTHLY', 'BIMONTHLY', 'QUARTERLY');
        CREATE TYPE public.person_type_enum AS ENUM('NATURAL', 'JURIDICA');
        CREATE TYPE public.fiscal_responsibility_enum AS ENUM(
          'R-01-IVA', 'R-02-RETEFUENTE', 'R-03-RETEIVA', 'R-04-RETEICA',
          'R-07-REGIMEN-SIMPLE', 'R-99-NO-RESPONSABLE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create fiscal_configs table
    await queryRunner.query(`
      CREATE TABLE "fiscal_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taxRegime" public.tax_regime_enum NOT NULL DEFAULT 'COMMON',
        "personType" public.person_type_enum NOT NULL DEFAULT 'NATURAL',
        "nit" character varying(20) NOT NULL,
        "nitVerificationDigit" character varying(1) NULL,
        "legalName" character varying(200) NOT NULL,
        "tradeName" character varying(200) NULL,
        "fiscalAddress" character varying(300) NOT NULL,
        "city" character varying(100) NOT NULL,
        "state" character varying(100) NOT NULL,
        "postalCode" character varying(20) NULL,
        "phone" character varying(50) NULL,
        "fiscalEmail" character varying(200) NULL,
        "fiscalResponsibilities" text array NOT NULL,
        "isRetentionAgent" boolean NOT NULL DEFAULT false,
        "retentionAgentSince" date NULL,
        "isVATResponsible" boolean NOT NULL DEFAULT true,
        "vatDeclarationPeriod" public.vat_declaration_period_enum NOT NULL DEFAULT 'BIMONTHLY',
        "ciiu" character varying(10) NULL,
        "economicActivity" character varying(300) NULL,
        "hasRUT" boolean NOT NULL DEFAULT false,
        "rutDocumentUrl" text NULL,
        "useElectronicInvoicing" boolean NOT NULL DEFAULT false,
        "electronicInvoiceProvider" character varying(100) NULL,
        "dianResolutionNumber" character varying(100) NULL,
        "dianResolutionDate" date NULL,
        "invoiceRangeFrom" bigint NULL,
        "invoiceRangeTo" bigint NULL,
        "invoicePrefix" character varying(10) NULL,
        "nextInvoiceNumber" bigint NOT NULL DEFAULT 1,
        "legalRepresentative" character varying(200) NULL,
        "legalRepresentativeId" character varying(20) NULL,
        "accountantName" character varying(200) NULL,
        "accountantProfessionalCard" character varying(50) NULL,
        "fiscalYearStart" integer NULL,
        "additionalConfig" jsonb NULL,
        "isConfigured" boolean NOT NULL DEFAULT false,
        "isVerifiedByAccountant" boolean NOT NULL DEFAULT false,
        "verifiedAt" timestamp NULL,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fiscal_configs" PRIMARY KEY ("id")
      )
    `);

    // Add unique index for tenantId
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fiscal_configs_tenantId" ON "fiscal_configs" ("tenantId")`);

    // Add foreign key to tenants table
    await queryRunner.query(`
      ALTER TABLE "fiscal_configs"
      ADD CONSTRAINT "FK_fiscal_configs_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fiscal_configs" DROP CONSTRAINT "FK_fiscal_configs_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fiscal_configs_tenantId"`);
    await queryRunner.query(`DROP TABLE "fiscal_configs"`);
    await queryRunner.query(`DROP TYPE "public"."fiscal_responsibility_enum"`);
    await queryRunner.query(`DROP TYPE "public"."person_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."vat_declaration_period_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tax_regime_enum"`);
  }
}
