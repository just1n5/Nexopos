const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL o DB_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addCashMovementsColumns() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Agregando columnas faltantes a cash_movements...\n');

    // 1. Crear enum MovementCategory si no existe
    console.log('📦 Verificando enum movement_category_enum...');
    const enumExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_type
        WHERE typname = 'movement_category_enum'
      );
    `);

    if (!enumExists.rows[0].exists) {
      await client.query(`
        CREATE TYPE movement_category_enum AS ENUM (
          'SALES_INCOME',
          'OTHER_INCOME',
          'SUPPLIER_PAYMENT',
          'RENT',
          'UTILITIES',
          'SALARIES',
          'MAINTENANCE',
          'SUPPLIES',
          'TRANSPORT',
          'OTHER_EXPENSE',
          'CASH_IN',
          'CASH_OUT',
          'CORRECTION',
          'SYSTEM'
        );
      `);
      console.log('   ✅ Enum movement_category_enum creado');
    } else {
      console.log('   ℹ️  Enum movement_category_enum ya existe');
    }

    // 2. Verificar columnas actuales
    const currentColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'cash_movements';
    `);

    const existingColumns = currentColumns.rows.map(row => row.column_name);
    console.log(`\n   Columnas actuales: ${existingColumns.join(', ')}\n`);

    // 3. Agregar columnas faltantes
    const columnsToAdd = [
      { name: 'category', sql: 'ADD COLUMN category movement_category_enum' },
      { name: 'balanceBefore', sql: 'ADD COLUMN "balanceBefore" DECIMAL(12,2)' },
      { name: 'balanceAfter', sql: 'ADD COLUMN "balanceAfter" DECIMAL(12,2)' },
      { name: 'referenceType', sql: 'ADD COLUMN "referenceType" VARCHAR(50)' },
      { name: 'referenceId', sql: 'ADD COLUMN "referenceId" VARCHAR(100)' },
      { name: 'refundId', sql: 'ADD COLUMN "refundId" UUID' },
      { name: 'paymentMethod', sql: 'ADD COLUMN "paymentMethod" VARCHAR(50)' },
      { name: 'notes', sql: 'ADD COLUMN notes TEXT' },
      { name: 'documentNumber', sql: 'ADD COLUMN "documentNumber" VARCHAR(100)' },
      { name: 'documentType', sql: 'ADD COLUMN "documentType" VARCHAR(50)' },
      { name: 'supplierName', sql: 'ADD COLUMN "supplierName" VARCHAR(255)' },
      { name: 'supplierNit', sql: 'ADD COLUMN "supplierNit" VARCHAR(50)' },
      { name: 'requiresApproval', sql: 'ADD COLUMN "requiresApproval" BOOLEAN DEFAULT false' },
      { name: 'isApproved', sql: 'ADD COLUMN "isApproved" BOOLEAN DEFAULT false' },
      { name: 'approvedBy', sql: 'ADD COLUMN "approvedBy" UUID' },
      { name: 'approvedAt', sql: 'ADD COLUMN "approvedAt" TIMESTAMP WITH TIME ZONE' },
      { name: 'updatedAt', sql: 'ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()' }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const col of columnsToAdd) {
      if (existingColumns.includes(col.name)) {
        console.log(`   ⏭️  Columna "${col.name}" ya existe`);
        skippedCount++;
        continue;
      }

      try {
        await client.query(`ALTER TABLE cash_movements ${col.sql};`);
        console.log(`   ✅ Columna "${col.name}" agregada`);
        addedCount++;
      } catch (error) {
        console.error(`   ❌ Error agregando "${col.name}": ${error.message}`);
      }
    }

    console.log(`\n📊 Resumen: ${addedCount} columnas agregadas, ${skippedCount} ya existían\n`);

    // 4. Agregar foreign key para approvedBy si no existe
    console.log('🔗 Agregando foreign key para approvedBy...');
    try {
      const fkExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_cash_movements_approvedBy'
          AND table_name = 'cash_movements'
        );
      `);

      if (!fkExists.rows[0].exists && addedCount > 0) {
        await client.query(`
          ALTER TABLE cash_movements
          ADD CONSTRAINT "FK_cash_movements_approvedBy"
          FOREIGN KEY ("approvedBy") REFERENCES users(id);
        `);
        console.log('   ✅ Foreign key para approvedBy agregada');
      } else if (fkExists.rows[0].exists) {
        console.log('   ℹ️  Foreign key para approvedBy ya existe');
      }
    } catch (error) {
      console.log(`   ⚠️  No se pudo agregar foreign key: ${error.message}`);
    }

    // 5. Agregar foreign key para refundId si no existe
    console.log('🔗 Agregando foreign key para refundId...');
    try {
      const fkExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_cash_movements_refund'
          AND table_name = 'cash_movements'
        );
      `);

      if (!fkExists.rows[0].exists && addedCount > 0) {
        await client.query(`
          ALTER TABLE cash_movements
          ADD CONSTRAINT "FK_cash_movements_refund"
          FOREIGN KEY ("refundId") REFERENCES sales(id);
        `);
        console.log('   ✅ Foreign key para refundId agregada');
      } else if (fkExists.rows[0].exists) {
        console.log('   ℹ️  Foreign key para refundId ya existe');
      }
    } catch (error) {
      console.log(`   ⚠️  No se pudo agregar foreign key: ${error.message}`);
    }

    // 6. Verificar estructura final
    console.log('\n📊 Verificando estructura final de cash_movements:');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cash_movements'
      ORDER BY ordinal_position;
    `);

    console.log(`\n   Total de columnas: ${finalColumns.rows.length}\n`);
    finalColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    await client.end();
    console.log('\n✅ Columnas de cash_movements completadas exitosamente\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

addCashMovementsColumns();
