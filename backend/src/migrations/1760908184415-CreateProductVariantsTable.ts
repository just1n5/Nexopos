import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateProductVariantsTable1760908184415 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "product_variants",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
                { name: "name", type: "varchar", length: "120" },
                { name: "sku", type: "varchar", length: "80" },
                { name: "barcode", type: "varchar", length: "80", isNullable: true },
                { name: "size", type: "varchar", length: "40", isNullable: true },
                { name: "color", type: "varchar", length: "40", isNullable: true },
                { name: "priceDelta", type: "decimal", precision: 12, scale: 2, default: 0 },
                { name: "stock", type: "integer", default: 0 },
                { name: "taxRate", type: "decimal", precision: 5, scale: 2, default: 19 },
                { name: "taxIncluded", type: "boolean", default: true },
                { name: "isTaxExcluded", type: "boolean", default: false },
                { name: "productId", type: "uuid" },
                { name: "createdAt", type: "timestamptz", default: "now()" },
                { name: "updatedAt", type: "timestamptz", default: "now()" },
            ],
        }), true);

        await queryRunner.createIndex("product_variants", new TableIndex({
            name: "IDX_product_variants_sku",
            columnNames: ["sku"],
            isUnique: true,
        }));

        await queryRunner.createForeignKey("product_variants", new TableForeignKey({
            columnNames: ["productId"],
            referencedColumnNames: ["id"],
            referencedTableName: "products",
            onDelete: "CASCADE",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("product_variants");
    }

}
