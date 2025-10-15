import { MigrationInterface, QueryRunner } from "typeorm";

export class SetNullOnDeleteCustomerInSales1760555133634 implements MigrationInterface {
    name = 'SetNullOnDeleteCustomerInSales1760555133634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_3a92cf6add00043cef9833db1cd"`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_3a92cf6add00043cef9833db1cd"`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
