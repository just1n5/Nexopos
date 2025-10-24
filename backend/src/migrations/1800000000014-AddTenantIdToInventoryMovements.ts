import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddTenantIdToInventoryMovements1800000000014 implements MigrationInterface {
    name = 'AddTenantIdToInventoryMovements1800000000014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('inventory_movements', new TableColumn({
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
            default: 'uuid_generate_v4()'
        }));

        await queryRunner.createForeignKey('inventory_movements', new TableForeignKey({
            columnNames: ['tenantId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'tenants',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('inventory_movements', 'FK_inventory_movements_tenantId');
        await queryRunner.dropColumn('inventory_movements', 'tenantId');
    }
}
