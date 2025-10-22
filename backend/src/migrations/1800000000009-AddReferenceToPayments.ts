import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddReferenceToPayments1800000000009 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('payments', new TableColumn({
            name: 'reference',
            type: 'varchar',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('payments', 'reference');
    }

}
