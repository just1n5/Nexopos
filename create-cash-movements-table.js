const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createCashMovementsTable() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Creando tabla cash_movements...\n');

    // 1. Verificar si la tabla ya existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'cash_movements'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('   ℹ️  Tabla cash_movements ya existe');
      await client.end();
      process.exit(0);
    }

    // 2. Crear enum para MovementType
    const movementTypeEnumExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'cash_movements_type_enum'
      );
    `);

    if (!movementTypeEnumExists.rows[0].exists) {
      await client.query(`
        CREATE TYPE cash_movements_type_enum AS ENUM (
          'SALE',
          'REFUND',
          'RETURN',
          'EXPENSE',
          'DEPOSIT',
          'WITHDRAWAL',
          'ADJUSTMENT',
          'OPENING',
          'CLOSING'
        );
      `);
      console.log('   ✅ Enum cash_movements_type_enum creado');
    } else {
      console.log('   ℹ️  Enum cash_movements_type_enum ya existe');
    }

    // 3. Crear enum para MovementCategory
    const movementCategoryEnumExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'cash_movements_category_enum'
      );
    `);

    if (!movementCategoryEnumExists.rows[0].exists) {
      await client.query(`
        CREATE TYPE cash_movements_category_enum AS ENUM (
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
      console.log('   ✅ Enum cash_movements_category_enum creado');
    } else {
      console.log('   ℹ️  Enum cash_movements_category_enum ya existe');
    }

    // 4. Crear tabla cash_movements
    await client.query(`
      CREATE TABLE cash_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "cashRegisterId" UUID NOT NULL,
        type cash_movements_type_enum NOT NULL,
        category cash_movements_category_enum,
        amount DECIMAL(12,2) NOT NULL,
        "balanceBefore" DECIMAL(12,2) NOT NULL,
        "balanceAfter" DECIMAL(12,2) NOT NULL,
        "referenceType" VARCHAR,
        "referenceId" VARCHAR,
        "saleId" VARCHAR,
        "refundId" VARCHAR,
        "expenseId" VARCHAR,
        "paymentMethod" VARCHAR,
        description VARCHAR NOT NULL,
        notes TEXT,
        "documentNumber" VARCHAR,
        "documentType" VARCHAR,
        "userId" UUID NOT NULL,
        "supplierName" VARCHAR,
        "supplierNit" VARCHAR,
        "requiresApproval" BOOLEAN DEFAULT false,
        "isApproved" BOOLEAN DEFAULT false,
        "approvedBy" VARCHAR,
        "approvedAt" TIMESTAMP,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT "FK_cash_movements_cashRegister" FOREIGN KEY ("cashRegisterId")
          REFERENCES cash_register(id) ON DELETE CASCADE,
        CONSTRAINT "FK_cash_movements_user" FOREIGN KEY ("userId")
          REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('   ✅ Tabla cash_movements creada');

    // 5. Crear índices
    await client.query(`
      CREATE INDEX "IDX_cash_movements_cashRegisterId" ON cash_movements("cashRegisterId");
    `);
    console.log('   ✅ Índice IDX_cash_movements_cashRegisterId creado');

    await client.query(`
      CREATE INDEX "IDX_cash_movements_type" ON cash_movements(type);
    `);
    console.log('   ✅ Índice IDX_cash_movements_type creado');

    await client.query(`
      CREATE INDEX "IDX_cash_movements_createdAt" ON cash_movements("createdAt");
    `);
    console.log('   ✅ Índice IDX_cash_movements_createdAt creado');

    // 6. Verificar la estructura
    console.log('\n📊 Verificando estructura de la tabla cash_movements:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'cash_movements'
      ORDER BY ordinal_position;
    `);

    console.log(`\n   Total de columnas: ${columns.rows.length}`);
    console.log('\n   Primeras 10 columnas:');
    columns.rows.slice(0, 10).forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    await client.end();
    console.log('\n✅ Migración completada exitosamente\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

createCashMovementsTable();
