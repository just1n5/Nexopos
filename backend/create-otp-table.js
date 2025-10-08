const { DataSource } = require('typeorm');

const DB_URL = process.env.DB_URL || 'postgresql://nexopos_user:0B13dRjho45aqVdVThYiLGhlsxbv3Q1E@dpg-d3hiuoj3fgac739rg2hg-a.virginia-postgres.render.com/nexopos';

async function createOtpTable() {
  console.log('🔄 Conectando a la base de datos...');

  const dataSource = new DataSource({
    type: 'postgres',
    url: DB_URL,
    synchronize: false,
    logging: true,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión exitosa\n');

    const queryRunner = dataSource.createQueryRunner();

    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'otp_codes'
      );
    `);

    if (tableExists[0].exists) {
      console.log('✅ La tabla otp_codes ya existe');
      await queryRunner.release();
      await dataSource.destroy();
      process.exit(0);
    }

    console.log('📝 Creando tabla otp_codes...\n');

    // Crear tipo enum para purpose
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE otp_purpose_enum AS ENUM ('ACCOUNT_DELETION', 'ACCOUNT_SUSPENSION');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Crear tabla otp_codes
    await queryRunner.query(`
      CREATE TABLE otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(6) NOT NULL,
        email VARCHAR(120) NOT NULL,
        purpose otp_purpose_enum NOT NULL,
        "relatedTenantId" UUID,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "isUsed" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Tabla otp_codes creada exitosamente\n');

    // Crear índices
    console.log('📝 Creando índices...\n');

    await queryRunner.query(`
      CREATE INDEX idx_otp_email ON otp_codes(email);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_otp_expires ON otp_codes("expiresAt");
    `);

    await queryRunner.query(`
      CREATE INDEX idx_otp_used ON otp_codes("isUsed");
    `);

    console.log('✅ Índices creados exitosamente\n');

    console.log('✅ Estructura de la tabla otp_codes:');
    console.log('   - id: UUID (Primary Key)');
    console.log('   - code: VARCHAR(6) - Código OTP');
    console.log('   - email: VARCHAR(120) - Email del destinatario');
    console.log('   - purpose: ENUM - ACCOUNT_DELETION | ACCOUNT_SUSPENSION');
    console.log('   - relatedTenantId: UUID - ID del tenant relacionado');
    console.log('   - expiresAt: TIMESTAMPTZ - Fecha de expiración');
    console.log('   - isUsed: BOOLEAN - Si el código fue usado');
    console.log('   - createdAt: TIMESTAMPTZ - Fecha de creación\n');

    await queryRunner.release();
    await dataSource.destroy();
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await dataSource.destroy();
    process.exit(1);
  }
}

createOtpTable();
