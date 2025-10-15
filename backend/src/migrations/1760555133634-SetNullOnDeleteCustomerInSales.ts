import { MigrationInterface, QueryRunner } from "typeorm";

export class SetNullOnDeleteCustomerInSales1760555133634 implements MigrationInterface {
    name = 'SetNullOnDeleteCustomerInSales1760555133634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_3a92cf6add00043cef9833db1cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c44ac33a05b144dd0d9ddcf932"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_76e0c2eac19b205cdd0b821efb"`);
        await queryRunner.query(`CREATE TYPE "public"."otp_codes_purpose_enum" AS ENUM('ACCOUNT_DELETION', 'ACCOUNT_SUSPENSION', 'EMAIL_VERIFICATION')`);
        await queryRunner.query(`CREATE TABLE "otp_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(6) NOT NULL, "email" character varying(120) NOT NULL, "purpose" "public"."otp_codes_purpose_enum" NOT NULL, "relatedTenantId" uuid, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9d0487965ac1837d57fec4d6a26" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" ADD "barcode" character varying(80)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "tenantId" uuid`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "barcode" character varying(80)`);
        await queryRunner.query(`ALTER TABLE "dian_resolutions" ADD "tenantId" uuid`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CASHIER'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_6804855ba1a19523ea57e0769b" ON "products" ("tenantId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1b6c1ded9006ffc8e024caa715" ON "products" ("tenantId", "sku") `);
        await queryRunner.query(`CREATE INDEX "IDX_37c1a605468d156e6a8f78f1dc" ON "customers" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_37c1a605468d156e6a8f78f1dc" ON "customers" ("tenantId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7c2e7e05bcc42557130da81f6d" ON "customers" ("tenantId", "documentType", "documentNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_46a85229c9953b2b94f768190b" ON "categories" ("tenantId") `);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_6804855ba1a19523ea57e0769b4" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dian_resolutions" ADD CONSTRAINT "FK_c72c4832bd12c9f83c1f3b0f169" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_37c1a605468d156e6a8f78f1dc5" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_46a85229c9953b2b94f768190b2" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_46a85229c9953b2b94f768190b2"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_37c1a605468d156e6a8f78f1dc5"`);
        await queryRunner.query(`ALTER TABLE "dian_resolutions" DROP CONSTRAINT "FK_c72c4832bd12c9f83c1f3b0f169"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_6804855ba1a19523ea57e0769b4"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_3a92cf6add00043cef9833db1cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46a85229c9953b2b94f768190b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c2e7e05bcc42557130da81f6d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37c1a605468d156e6a8f78f1dc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37c1a605468d156e6a8f78f1dc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b6c1ded9006ffc8e024caa715"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6804855ba1a19523ea57e0769b"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('ADMIN', 'MANAGER', 'CASHIER')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CASHIER'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "dian_resolutions" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "barcode"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "barcode"`);
        await queryRunner.query(`DROP TABLE "otp_codes"`);
        await queryRunner.query(`DROP TYPE "public"."otp_codes_purpose_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_76e0c2eac19b205cdd0b821efb" ON "customers" ("documentNumber", "documentType") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c44ac33a05b144dd0d9ddcf932" ON "products" ("sku") `);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
