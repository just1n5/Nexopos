import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddProcessedAtToPayments1800000000011 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('payments', new TableColumn({
            name: 'processedAt',
            type: 'timestamp',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('payments', 'processedAt');
    }

}
