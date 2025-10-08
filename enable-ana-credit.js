#!/usr/bin/env node
/**
 * Script para habilitar crédito para Ana Lopez
 *
 * Uso:
 *   DB_URL="postgresql://..." node enable-ana-credit.js
 *
 * O con las credenciales separadas:
 *   DB_HOST=... DB_PORT=... DB_NAME=... DB_USER=... DB_PASSWORD=... node enable-ana-credit.js
 */

const { Client } = require('pg');

async function enableCreditForAna() {
  const dbUrl = process.env.DB_URL;

  const client = dbUrl
    ? new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      })
    : new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'nexopos',
        user: process.env.DB_USER || 'nexopos_user',
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      });

  try {
    console.log('📡 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // Buscar Ana Lopez
    console.log('🔍 Buscando cliente Ana Lopez...');
    const findQuery = `
      SELECT id, "firstName", "lastName", "creditEnabled", "creditLimit", "creditAvailable"
      FROM customers
      WHERE "firstName" = 'Ana' AND "lastName" = 'Lopez'
      LIMIT 1
    `;

    const findResult = await client.query(findQuery);

    if (findResult.rows.length === 0) {
      console.log('❌ No se encontró el cliente Ana Lopez');
      return;
    }

    const customer = findResult.rows[0];
    console.log('✅ Cliente encontrado:');
    console.log(`   ID: ${customer.id}`);
    console.log(`   Nombre: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Crédito habilitado: ${customer.creditEnabled}`);
    console.log(`   Límite de crédito: $${customer.creditLimit}`);
    console.log(`   Crédito disponible: $${customer.creditAvailable}\n`);

    if (customer.creditEnabled) {
      console.log('✅ El crédito ya está habilitado para este cliente');
      return;
    }

    // Habilitar crédito
    console.log('🔧 Habilitando crédito...');
    const updateQuery = `
      UPDATE customers
      SET "creditEnabled" = true
      WHERE id = $1
      RETURNING id, "firstName", "lastName", "creditEnabled", "creditLimit", "creditAvailable"
    `;

    const updateResult = await client.query(updateQuery, [customer.id]);
    const updated = updateResult.rows[0];

    console.log('✅ Crédito habilitado exitosamente:');
    console.log(`   ID: ${updated.id}`);
    console.log(`   Nombre: ${updated.firstName} ${updated.lastName}`);
    console.log(`   Crédito habilitado: ${updated.creditEnabled}`);
    console.log(`   Límite de crédito: $${updated.creditLimit}`);
    console.log(`   Crédito disponible: $${updated.creditAvailable}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('👋 Desconectado de la base de datos');
  }
}

enableCreditForAna()
  .then(() => {
    console.log('\n✨ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script falló:', error);
    process.exit(1);
  });
