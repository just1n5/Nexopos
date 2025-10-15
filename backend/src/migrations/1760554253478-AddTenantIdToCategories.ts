import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantIdToCategories1760554253478 implements MigrationInterface {
    name = 'AddTenantIdToCategories1760554253478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ADD "tenantId" uuid`);
        await queryRunner.query(`UPDATE "categories" SET "tenantId" = (SELECT id FROM tenants LIMIT 1) WHERE "tenantId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "tenantId" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_46a85229c9953b2b94f768190b" ON "categories" ("tenantId") `);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_46a85229c9953b2b94f768190b2" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_46a85229c9953b2b94f768190b2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46a85229c9953b2b94f768190b"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "tenantId"`);
    }

}
