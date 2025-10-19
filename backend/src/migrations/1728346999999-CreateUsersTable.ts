import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1728346999999 implements MigrationInterface {
    name = 'CreateUsersTable1728346999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(120) NOT NULL,
                "password" character varying NOT NULL,
                "firstName" character varying(60) NOT NULL,
                "lastName" character varying(60) NOT NULL,
                "role" character varying NOT NULL DEFAULT 'CASHIER',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
