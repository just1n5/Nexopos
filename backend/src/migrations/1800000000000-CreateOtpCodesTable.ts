import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOtpCodesTable1800000000000 implements MigrationInterface {
  name = 'CreateOtpCodesTable1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear el tipo ENUM con todos los valores necesarios
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE public.otp_purpose_enum AS ENUM('ACCOUNT_DELETION', 'ACCOUNT_SUSPENSION', 'EMAIL_VERIFICATION');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Crear la tabla otp_codes
    await queryRunner.query(`
      CREATE TABLE "otp_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(6) NOT NULL,
        "email" character varying(120) NOT NULL,
        "purpose" public.otp_purpose_enum NOT NULL,
        "relatedTenantId" uuid,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "isUsed" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_otp_codes" PRIMARY KEY ("id")
      )
    `);

    // Crear índices
    await queryRunner.query(`CREATE INDEX "IDX_otp_email" ON "otp_codes" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_otp_expires" ON "otp_codes" ("expiresAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices y tabla
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_otp_expires"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_otp_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_codes"`);
    
    // Opcional: eliminar el tipo ENUM si no se usa en otras tablas
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."otp_purpose_enum"`);
  }
}
