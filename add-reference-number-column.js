const { Client } = require('pg');

const dbUrl = process.env.DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Error: DB_URL o DATABASE_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

async function addReferenceNumberColumn() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Verificar si la columna ya existe
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'inventory_movements'
      AND column_name = 'referenceNumber';
    `;

    const checkResult = await client.query(checkQuery);

    if (checkResult.rows.length > 0) {
      console.log('ℹ️  La columna "referenceNumber" ya existe en inventory_movements');
    } else {
      // Agregar la columna
      const alterQuery = `
        ALTER TABLE inventory_movements
        ADD COLUMN "referenceNumber" VARCHAR;
      `;

      await client.query(alterQuery);
      console.log('✅ Columna "referenceNumber" agregada exitosamente a inventory_movements');
    }

    await client.end();
    console.log('✅ Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    await client.end();
    process.exit(1);
  }
}

addReferenceNumberColumn();
