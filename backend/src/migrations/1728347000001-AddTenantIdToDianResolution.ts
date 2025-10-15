import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantIdToDianResolution1728347000001 implements MigrationInterface {
    name = 'AddTenantIdToDianResolution1728347000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dian_resolutions" ADD "tenantId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_dian_resolutions_tenant" ON "dian_resolutions" ("tenantId")`);
        await queryRunner.query(`ALTER TABLE "dian_resolutions" ADD CONSTRAINT "FK_dian_resolutions_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dian_resolutions" DROP CONSTRAINT "FK_dian_resolutions_tenant"`);
        await queryRunner.query(`DROP INDEX "IDX_dian_resolutions_tenant"`);
        await queryRunner.query(`ALTER TABLE "dian_resolutions" DROP COLUMN "tenantId"`);
    }

}
