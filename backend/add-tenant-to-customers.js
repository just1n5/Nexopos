/**
 * Script para agregar columna tenantId a la tabla customers
 * IMPORTANTE: Este script asigna todos los clientes existentes al primer tenant encontrado
 *
 * Uso: DB_URL="postgresql://..." node add-tenant-to-customers.js
 */

const { Client } = require('pg');

async function addTenantToCustomers() {
  const dbUrl = process.env.DB_URL;

  if (!dbUrl) {
    console.error('❌ Error: DB_URL no está configurada');
    console.log('Uso: DB_URL="postgresql://user:pass@host/db" node add-tenant-to-customers.js');
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

    // Verificar si la columna ya existe
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='customers'
      AND column_name='tenantId';
    `);

    if (checkColumn.rows.length > 0) {
      console.log('⚠️  La columna tenantId ya existe en customers');

      // Verificar si hay clientes sin tenantId
      const orphanCustomers = await client.query(`
        SELECT COUNT(*) as count FROM customers WHERE "tenantId" IS NULL;
      `);

      if (orphanCustomers.rows[0].count > 0) {
        console.log(`📋 Encontrados ${orphanCustomers.rows[0].count} clientes sin tenantId`);
        console.log('🔧 Asignando al primer tenant disponible...');

        const firstTenant = await client.query('SELECT id FROM tenants LIMIT 1');
        if (firstTenant.rows.length === 0) {
          throw new Error('No hay tenants en la base de datos');
        }

        await client.query(`
          UPDATE customers
          SET "tenantId" = $1
          WHERE "tenantId" IS NULL;
        `, [firstTenant.rows[0].id]);

        console.log('✅ Clientes actualizados con tenantId');
      } else {
        console.log('✅ Todos los clientes ya tienen tenantId');
      }

      return;
    }

    console.log('\n🔧 Agregando columna tenantId a customers...');

    // Obtener el primer tenant para asignar a clientes existentes
    const firstTenant = await client.query('SELECT id, "businessName" FROM tenants LIMIT 1');

    if (firstTenant.rows.length === 0) {
      throw new Error('No hay tenants en la base de datos. Crea al menos un tenant primero.');
    }

    const defaultTenantId = firstTenant.rows[0].id;
    const defaultTenantName = firstTenant.rows[0].businessName;

    console.log(`📌 Usando tenant por defecto: ${defaultTenantName} (${defaultTenantId})`);

    // Agregar columna tenantId (nullable inicialmente)
    await client.query(`
      ALTER TABLE customers
      ADD COLUMN "tenantId" UUID;
    `);
    console.log('✅ Columna tenantId agregada');

    // Asignar todos los clientes existentes al primer tenant
    const updateResult = await client.query(`
      UPDATE customers
      SET "tenantId" = $1
      WHERE "tenantId" IS NULL;
    `, [defaultTenantId]);

    console.log(`✅ ${updateResult.rowCount} clientes asignados al tenant por defecto`);

    // Hacer la columna NOT NULL
    await client.query(`
      ALTER TABLE customers
      ALTER COLUMN "tenantId" SET NOT NULL;
    `);
    console.log('✅ Columna tenantId configurada como NOT NULL');

    // Crear índice
    await client.query(`
      CREATE INDEX "IDX_customers_tenantId" ON customers ("tenantId");
    `);
    console.log('✅ Índice creado en tenantId');

    // Eliminar índice único anterior de (documentType, documentNumber)
    try {
      await client.query(`DROP INDEX IF EXISTS "IDX_9c321dfdcba9023c7e628c5e0d0";`);
      console.log('✅ Índice único anterior eliminado');
    } catch (e) {
      console.log('ℹ️  No había índice único anterior para eliminar');
    }

    // Crear índice único compuesto (tenantId, documentType, documentNumber)
    await client.query(`
      CREATE UNIQUE INDEX "IDX_customers_tenantId_document"
      ON customers ("tenantId", "documentType", "documentNumber");
    `);
    console.log('✅ Índice único compuesto (tenantId, documentType, documentNumber) creado');

    // Agregar foreign key
    await client.query(`
      ALTER TABLE customers
      ADD CONSTRAINT "FK_customers_tenantId"
      FOREIGN KEY ("tenantId") REFERENCES tenants(id)
      ON DELETE CASCADE;
    `);
    console.log('✅ Foreign key constraint agregada');

    console.log('\n✅ Migración completada exitosamente');
    console.log('\n📊 Resumen:');
    console.log(`   - Clientes migrados: ${updateResult.rowCount}`);
    console.log(`   - Tenant asignado: ${defaultTenantName}`);
    console.log('   - Índices creados: tenantId, (tenantId + documentType + documentNumber)');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

addTenantToCustomers();
