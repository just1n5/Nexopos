import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaxColumnsToProductVariants1760908184416 implements MigrationInterface {
    name = 'AddTaxColumnsToProductVariants1760908184416'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "taxRate" numeric(5,2) NOT NULL DEFAULT '19'`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "taxIncluded" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "isTaxExcluded" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "isTaxExcluded"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "taxIncluded"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "taxRate"`);
    }
}
