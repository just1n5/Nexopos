import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSupplierNitToExpenses1800000000010 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('expenses', new TableColumn({
            name: 'supplierNit',
            type: 'varchar',
            length: '20',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('expenses', 'supplierNit');
    }

}
