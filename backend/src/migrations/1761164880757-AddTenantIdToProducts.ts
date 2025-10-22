import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddTenantIdToProducts1761164880757 implements MigrationInterface {
    name = 'AddTenantIdToProducts1761164880757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('products', new TableColumn({
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
        }));

        await queryRunner.createForeignKey('products', new TableForeignKey({
            columnNames: ['tenantId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'tenants',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('products', 'FK_products_tenantId'); // Assuming TypeORM generates this name
        await queryRunner.dropColumn('products', 'tenantId');
    }
}
