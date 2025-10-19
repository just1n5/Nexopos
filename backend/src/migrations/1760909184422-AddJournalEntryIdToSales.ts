import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJournalEntryIdToSales1760909184422 implements MigrationInterface {
    name = 'AddJournalEntryIdToSales1760909184422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" ADD "journalEntryId" uuid`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "taxWithholdingId" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "taxWithholdingId"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "journalEntryId"`);
    }
}
