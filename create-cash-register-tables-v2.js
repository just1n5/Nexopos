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

async function createCashRegisterTables() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Creando tablas cash_register y cash_movements...\n');

    // 1. Verificar si ya existen las tablas
    const tablesExist = await client.query(`
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_register') as cash_register,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_movements') as cash_movements;
    `);

    const { cash_register, cash_movements } = tablesExist.rows[0];

    // 2. Crear enum para cash_movements si no existe
    console.log('📦 Verificando enum cash_movements_type_enum...');
    const enumExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_type
        WHERE typname = 'cash_movements_type_enum'
      );
    `);

    if (!enumExists.rows[0].exists) {
      await client.query(`
        CREATE TYPE cash_movements_type_enum AS ENUM (
          'OPENING',
          'DEPOSIT',
          'WITHDRAWAL',
          'SALE_PAYMENT',
          'EXPENSE',
          'CREDIT_PAYMENT'
        );
      `);
      console.log('   ✅ Enum cash_movements_type_enum creado');
    } else {
      console.log('   ℹ️  Enum cash_movements_type_enum ya existe');
    }

    // 3. Crear tabla cash_register si no existe
    if (!cash_register) {
      console.log('\n📦 Creando tabla cash_register...');
      await client.query(`
        CREATE TABLE cash_register (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "tenantId" UUID NOT NULL,
          "openedById" UUID NOT NULL,
          "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
          "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
          "expectedBalance" DECIMAL(12,2) DEFAULT NULL,
          difference DECIMAL(12,2) DEFAULT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
          notes TEXT,
          "openedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "closedAt" TIMESTAMP WITH TIME ZONE,
          "closedById" UUID,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          CONSTRAINT "FK_cash_register_tenant" FOREIGN KEY ("tenantId")
            REFERENCES tenants(id) ON DELETE CASCADE,
          CONSTRAINT "FK_cash_register_openedBy" FOREIGN KEY ("openedById")
            REFERENCES users(id),
          CONSTRAINT "FK_cash_register_closedBy" FOREIGN KEY ("closedById")
            REFERENCES users(id)
        );
      `);
      console.log('   ✅ Tabla cash_register creada');

      // Crear índices
      await client.query(`
        CREATE INDEX "IDX_cash_register_tenantId" ON cash_register("tenantId");
      `);
      await client.query(`
        CREATE INDEX "IDX_cash_register_status" ON cash_register(status);
      `);
      await client.query(`
        CREATE INDEX "IDX_cash_register_openedAt" ON cash_register("openedAt");
      `);
      console.log('   ✅ Índices de cash_register creados');
    } else {
      console.log('\n   ℹ️  Tabla cash_register ya existe');
    }

    // 4. Crear tabla cash_movements si no existe
    if (!cash_movements) {
      console.log('\n📦 Creando tabla cash_movements...');
      await client.query(`
        CREATE TABLE cash_movements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "cashRegisterId" UUID NOT NULL,
          type cash_movements_type_enum NOT NULL,
          amount DECIMAL(12,2) NOT NULL,
          description TEXT,
          "userId" UUID,
          "saleId" UUID,
          "expenseId" UUID,
          "paymentId" UUID,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          CONSTRAINT "FK_cash_movements_cashRegister" FOREIGN KEY ("cashRegisterId")
            REFERENCES cash_register(id) ON DELETE CASCADE,
          CONSTRAINT "FK_cash_movements_user" FOREIGN KEY ("userId")
            REFERENCES users(id),
          CONSTRAINT "FK_cash_movements_sale" FOREIGN KEY ("saleId")
            REFERENCES sales(id),
          CONSTRAINT "FK_cash_movements_payment" FOREIGN KEY ("paymentId")
            REFERENCES payments(id)
        );
      `);
      console.log('   ✅ Tabla cash_movements creada');

      // Crear índices
      await client.query(`
        CREATE INDEX "IDX_cash_movements_cashRegisterId" ON cash_movements("cashRegisterId");
      `);
      await client.query(`
        CREATE INDEX "IDX_cash_movements_type" ON cash_movements(type);
      `);
      await client.query(`
        CREATE INDEX "IDX_cash_movements_createdAt" ON cash_movements("createdAt");
      `);
      console.log('   ✅ Índices de cash_movements creados');
    } else {
      console.log('\n   ℹ️  Tabla cash_movements ya existe');
    }

    // 5. Verificar estructura final
    console.log('\n📊 Verificando estructura de las tablas:');

    const cashRegisterColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cash_register'
      ORDER BY ordinal_position;
    `);

    console.log(`\n   Tabla cash_register (${cashRegisterColumns.rows.length} columnas):`);
    cashRegisterColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    const cashMovementsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cash_movements'
      ORDER BY ordinal_position;
    `);

    console.log(`\n   Tabla cash_movements (${cashMovementsColumns.rows.length} columnas):`);
    cashMovementsColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    await client.end();
    console.log('\n✅ Tablas de caja registradora creadas exitosamente\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la creación de tablas:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

createCashRegisterTables();
