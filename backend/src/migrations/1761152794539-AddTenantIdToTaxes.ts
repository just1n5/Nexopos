import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddTenantIdToTaxes1761152794539 implements MigrationInterface {
    name = 'AddTenantIdToTaxes1761152794539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('taxes', new TableColumn({
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
        }));

        await queryRunner.createForeignKey('taxes', new TableForeignKey({
            columnNames: ['tenantId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'tenants',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('taxes', 'FK_taxes_tenantId'); // Assuming TypeORM generates this name
        await queryRunner.dropColumn('taxes', 'tenantId');
    }
}
