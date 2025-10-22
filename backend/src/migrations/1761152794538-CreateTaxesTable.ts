import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from "typeorm";
import { TaxType } from "../modules/taxes/entities/tax.entity"; // Assuming TaxType is exported

export class CreateTaxesTable1761152794538 implements MigrationInterface {
    name = 'CreateTaxesTable1761152794538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "taxes",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "uuid_generate_v4()",
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "100",
                },
                {
                    name: "description",
                    type: "varchar",
                    length: "500",
                    isNullable: true,
                },
                {
                    name: "type",
                    type: "enum",
                    enum: Object.values(TaxType), // Use enum values
                    default: `'${TaxType.IVA}'`, // Default value
                },
                {
                    name: "rate",
                    type: "decimal",
                    precision: 5,
                    scale: 2,
                },
                {
                    name: "isActive",
                    type: "boolean",
                    default: true,
                },
                {
                    name: "isDefault",
                    type: "boolean",
                    default: false,
                },
                {
                    name: "code",
                    type: "varchar",
                    length: "50",
                    isNullable: true,
                },
                {
                    name: "tenantId", // Added tenantId here
                    type: "uuid",
                    isNullable: false,
                },
                {
                    name: "createdAt",
                    type: "timestamptz",
                    default: "now()",
                },
                {
                    name: "updatedAt",
                    type: "timestamptz",
                    default: "now()",
                },
            ],
        }), true);

        await queryRunner.createIndex("taxes", new TableIndex({
            name: "IDX_taxes_name",
            columnNames: ["name"],
        }));

        await queryRunner.createForeignKey("taxes", new TableForeignKey({
            columnNames: ["tenantId"],
            referencedColumnNames: ["id"],
            referencedTableName: "tenants",
            onDelete: "CASCADE",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("taxes", "FK_taxes_tenantId"); // Assuming TypeORM generates this name
        await queryRunner.dropTable("taxes");
    }
}
