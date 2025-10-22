import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from "typeorm";

export class AddTenantIdToCustomers1800000000008 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('customers', new TableColumn({
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
        }));

        await queryRunner.createForeignKey('customers', new TableForeignKey({
            columnNames: ['tenantId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'tenants',
            onDelete: 'CASCADE',
        }));

        await queryRunner.createIndex('customers', new TableIndex({ 
            name: 'IDX_customers_tenantId', 
            columnNames: ['tenantId'] 
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('customers', 'IDX_customers_tenantId');
        await queryRunner.dropForeignKey('customers', 'FK_customers_tenantId');
        await queryRunner.dropColumn('customers', 'tenantId');
    }

}
