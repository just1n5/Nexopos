/**
 * Script para agregar EMAIL_VERIFICATION al enum otp_purpose_enum
 * Uso: DB_URL="postgresql://..." node add-email-verification-enum.js
 */

const { Client } = require('pg');

async function addEmailVerificationEnum() {
  const dbUrl = process.env.DB_URL;

  if (!dbUrl) {
    console.error('❌ Error: DB_URL no está configurada');
    console.log('Uso: DB_URL="postgresql://user:pass@host/db" node add-email-verification-enum.js');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado');

    // Verificar si el valor ya existe
    console.log('\n📋 Verificando enum actual...');
    const checkResult = await client.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = 'otp_purpose_enum'::regtype
      ORDER BY enumsortorder;
    `);

    console.log('Valores actuales del enum:');
    checkResult.rows.forEach(row => console.log(`  - ${row.enumlabel}`));

    const hasEmailVerification = checkResult.rows.some(
      row => row.enumlabel === 'EMAIL_VERIFICATION'
    );

    if (hasEmailVerification) {
      console.log('\n✅ EMAIL_VERIFICATION ya existe en el enum');
      return;
    }

    // Agregar el nuevo valor al enum
    console.log('\n🔧 Agregando EMAIL_VERIFICATION al enum...');
    await client.query(`
      ALTER TYPE otp_purpose_enum ADD VALUE 'EMAIL_VERIFICATION';
    `);

    console.log('✅ EMAIL_VERIFICATION agregado exitosamente');

    // Verificar el resultado
    const verifyResult = await client.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = 'otp_purpose_enum'::regtype
      ORDER BY enumsortorder;
    `);

    console.log('\n📋 Enum actualizado:');
    verifyResult.rows.forEach(row => console.log(`  - ${row.enumlabel}`));

    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

addEmailVerificationEnum();
