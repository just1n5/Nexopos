import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJournalEntryIdToCashRegister1760906596948 implements MigrationInterface {
    name = 'AddJournalEntryIdToCashRegister1760906596948'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cash_registers" ADD "journalEntryId" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cash_registers" DROP COLUMN "journalEntryId"`);
    }
}
