const { Client } = require('pg');

const dbUrl = process.env.DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Error: DB_URL o DATABASE_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

// Lista de columnas que deben existir en inventory_movements
const requiredColumns = [
  { name: 'referenceNumber', type: 'VARCHAR' },
  { name: 'batchNumber', type: 'VARCHAR' },
  { name: 'expiryDate', type: 'TIMESTAMP' },
  { name: 'warehouseId', type: 'VARCHAR' },
  { name: 'warehouseName', type: 'VARCHAR' },
  { name: 'locationId', type: 'VARCHAR' },
  { name: 'locationName', type: 'VARCHAR' },
  { name: 'notes', type: 'VARCHAR(500)' },
  { name: 'reason', type: 'VARCHAR' },
  { name: 'userId', type: 'VARCHAR' },
];

async function addMissingColumns() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    let columnsAdded = 0;
    let columnsExist = 0;

    for (const column of requiredColumns) {
      // Verificar si la columna existe
      const checkQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'inventory_movements'
        AND column_name = $1;
      `;

      const checkResult = await client.query(checkQuery, [column.name]);

      if (checkResult.rows.length > 0) {
        console.log(`   ℹ️  Columna "${column.name}" ya existe`);
        columnsExist++;
      } else {
        // Agregar la columna
        const alterQuery = `
          ALTER TABLE inventory_movements
          ADD COLUMN "${column.name}" ${column.type};
        `;

        await client.query(alterQuery);
        console.log(`   ✅ Columna "${column.name}" agregada (${column.type})`);
        columnsAdded++;
      }
    }

    await client.end();

    console.log('\n📊 Resumen:');
    console.log(`   - Columnas existentes: ${columnsExist}`);
    console.log(`   - Columnas agregadas: ${columnsAdded}`);
    console.log(`   - Total verificadas: ${requiredColumns.length}`);
    console.log('\n✅ Migración completada exitosamente');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    await client.end();
    process.exit(1);
  }
}

addMissingColumns();
