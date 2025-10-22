import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddQuantityBeforeAndAfterToInventoryMovements1800000000012 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('inventory_movements', [
            new TableColumn({
                name: 'quantityBefore',
                type: 'decimal',
                precision: 10,
                scale: 3,
                isNullable: false,
                default: 0
            }),
            new TableColumn({
                name: 'quantityAfter',
                type: 'decimal',
                precision: 10,
                scale: 3,
                isNullable: false,
                default: 0
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('inventory_movements', ['quantityBefore', 'quantityAfter']);
    }

}
