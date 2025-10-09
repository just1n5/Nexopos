/**
 * Script para agregar columna tenantId a la tabla products
 * IMPORTANTE: Este script asigna todos los productos existentes al primer tenant encontrado
 *
 * Uso: DB_URL="postgresql://..." node add-tenant-to-products.js
 */

const { Client } = require('pg');

async function addTenantToProducts() {
  const dbUrl = process.env.DB_URL;

  if (!dbUrl) {
    console.error('❌ Error: DB_URL no está configurada');
    console.log('Uso: DB_URL="postgresql://user:pass@host/db" node add-tenant-to-products.js');
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
      WHERE table_name='products'
      AND column_name='tenantId';
    `);

    if (checkColumn.rows.length > 0) {
      console.log('⚠️  La columna tenantId ya existe en products');

      // Verificar si hay productos sin tenantId
      const orphanProducts = await client.query(`
        SELECT COUNT(*) as count FROM products WHERE "tenantId" IS NULL;
      `);

      if (orphanProducts.rows[0].count > 0) {
        console.log(`📋 Encontrados ${orphanProducts.rows[0].count} productos sin tenantId`);
        console.log('🔧 Asignando al primer tenant disponible...');

        const firstTenant = await client.query('SELECT id FROM tenants LIMIT 1');
        if (firstTenant.rows.length === 0) {
          throw new Error('No hay tenants en la base de datos');
        }

        await client.query(`
          UPDATE products
          SET "tenantId" = $1
          WHERE "tenantId" IS NULL;
        `, [firstTenant.rows[0].id]);

        console.log('✅ Productos actualizados con tenantId');
      } else {
        console.log('✅ Todos los productos ya tienen tenantId');
      }

      return;
    }

    console.log('\n🔧 Agregando columna tenantId a products...');

    // Obtener el primer tenant para asignar a productos existentes
    const firstTenant = await client.query('SELECT id, "businessName" FROM tenants LIMIT 1');

    if (firstTenant.rows.length === 0) {
      throw new Error('No hay tenants en la base de datos. Crea al menos un tenant primero.');
    }

    const defaultTenantId = firstTenant.rows[0].id;
    const defaultTenantName = firstTenant.rows[0].businessName;

    console.log(`📌 Usando tenant por defecto: ${defaultTenantName} (${defaultTenantId})`);

    // Agregar columna tenantId (nullable inicialmente)
    await client.query(`
      ALTER TABLE products
      ADD COLUMN "tenantId" UUID;
    `);
    console.log('✅ Columna tenantId agregada');

    // Asignar todos los productos existentes al primer tenant
    const updateResult = await client.query(`
      UPDATE products
      SET "tenantId" = $1
      WHERE "tenantId" IS NULL;
    `, [defaultTenantId]);

    console.log(`✅ ${updateResult.rowCount} productos asignados al tenant por defecto`);

    // Hacer la columna NOT NULL
    await client.query(`
      ALTER TABLE products
      ALTER COLUMN "tenantId" SET NOT NULL;
    `);
    console.log('✅ Columna tenantId configurada como NOT NULL');

    // Crear índice
    await client.query(`
      CREATE INDEX "IDX_products_tenantId" ON products ("tenantId");
    `);
    console.log('✅ Índice creado en tenantId');

    // Eliminar índice único anterior de SKU (si existe)
    try {
      await client.query(`DROP INDEX IF EXISTS "IDX_products_sku";`);
      console.log('✅ Índice único anterior de SKU eliminado');
    } catch (e) {
      console.log('ℹ️  No había índice único de SKU para eliminar');
    }

    // Crear índice único compuesto (tenantId, sku)
    await client.query(`
      CREATE UNIQUE INDEX "IDX_products_tenantId_sku"
      ON products ("tenantId", sku);
    `);
    console.log('✅ Índice único compuesto (tenantId, sku) creado');

    // Agregar foreign key
    await client.query(`
      ALTER TABLE products
      ADD CONSTRAINT "FK_products_tenantId"
      FOREIGN KEY ("tenantId") REFERENCES tenants(id)
      ON DELETE CASCADE;
    `);
    console.log('✅ Foreign key constraint agregada');

    console.log('\n✅ Migración completada exitosamente');
    console.log('\n📊 Resumen:');
    console.log(`   - Productos migrados: ${updateResult.rowCount}`);
    console.log(`   - Tenant asignado: ${defaultTenantName}`);
    console.log('   - Índices creados: tenantId, (tenantId + sku)');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

addTenantToProducts();
