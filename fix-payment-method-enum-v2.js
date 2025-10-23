const { Client } = require('pg');

const dbUrl = process.env.DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Error: DB_URL o DATABASE_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

async function fixPaymentMethodEnum() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Buscar el enum en TODOS los schemas
    const findEnumQuery = `
      SELECT
        n.nspname as schema,
        t.typname as enum_name
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE t.typname = 'payment_method_enum_old';
    `;

    const enumResult = await client.query(findEnumQuery);

    if (enumResult.rows.length === 0) {
      console.log('✅ El enum payment_method_enum_old no existe. No hay nada que limpiar.');
      await client.end();
      process.exit(0);
    }

    console.log('⚠️  Encontrado enum payment_method_enum_old en schemas:');
    enumResult.rows.forEach(row => {
      console.log(`   - ${row.schema}.${row.enum_name}`);
    });
    console.log();

    // 2. Para cada schema donde existe el enum
    for (const enumRow of enumResult.rows) {
      const schema = enumRow.schema;
      console.log(`📋 Procesando schema: ${schema}\n`);

      // 3. Buscar objetos que dependen del enum en este schema
      const findDepsQuery = `
        SELECT
          n.nspname as schema,
          c.relname as table,
          a.attname as column
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_type t ON a.atttypid = t.oid
        WHERE t.typname = 'payment_method_enum_old'
        AND n.nspname = $1
        AND c.relkind = 'r';
      `;

      const deps = await client.query(findDepsQuery, [schema]);

      if (deps.rows.length > 0) {
        console.log(`📋 Columnas en ${schema} que usan payment_method_enum_old:`);
        deps.rows.forEach(dep => {
          console.log(`   - ${dep.schema}.${dep.table}.${dep.column}`);
        });
        console.log();

        // 4. Para cada columna, cambiar el tipo a payment_method_enum (el actual)
        for (const dep of deps.rows) {
          console.log(`🔧 Cambiando tipo de ${dep.schema}.${dep.table}.${dep.column}...`);

          const alterQuery = `
            ALTER TABLE ${dep.schema}.${dep.table}
            ALTER COLUMN "${dep.column}"
            TYPE ${dep.schema}.payment_method_enum
            USING "${dep.column}"::text::${dep.schema}.payment_method_enum;
          `;

          try {
            await client.query(alterQuery);
            console.log(`   ✅ ${dep.table}.${dep.column} actualizado`);
          } catch (error) {
            console.log(`   ⚠️  Error al actualizar ${dep.table}.${dep.column}: ${error.message}`);
          }
        }
        console.log();
      } else {
        console.log(`ℹ️  No se encontraron columnas usando payment_method_enum_old en ${schema}\n`);
      }

      // 5. Intentar eliminar el enum viejo en este schema
      console.log(`🗑️  Intentando eliminar ${schema}.payment_method_enum_old...`);
      try {
        await client.query(`DROP TYPE ${schema}.payment_method_enum_old CASCADE;`);
        console.log(`   ✅ ${schema}.payment_method_enum_old eliminado exitosamente\n`);
      } catch (error) {
        console.log(`   ⚠️  No se pudo eliminar: ${error.message}\n`);
      }
    }

    await client.end();
    console.log('✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

fixPaymentMethodEnum();
