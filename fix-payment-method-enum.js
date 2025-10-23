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

    // 1. Verificar si el enum viejo existe
    const checkEnumQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'payment_method_enum_old'
      );
    `;

    const enumExists = await client.query(checkEnumQuery);

    if (!enumExists.rows[0].exists) {
      console.log('✅ El enum payment_method_enum_old no existe. No hay nada que limpiar.');
      await client.end();
      process.exit(0);
    }

    console.log('⚠️  Encontrado enum payment_method_enum_old\n');

    // 2. Buscar objetos que dependen del enum
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
      AND c.relkind = 'r';
    `;

    const deps = await client.query(findDepsQuery);

    if (deps.rows.length > 0) {
      console.log('📋 Columnas que usan payment_method_enum_old:');
      deps.rows.forEach(dep => {
        console.log(`   - ${dep.schema}.${dep.table}.${dep.column}`);
      });
      console.log();

      // 3. Para cada columna, cambiar el tipo a payment_method_enum (el actual)
      for (const dep of deps.rows) {
        console.log(`🔧 Cambiando tipo de ${dep.table}.${dep.column}...`);

        const alterQuery = `
          ALTER TABLE ${dep.schema}.${dep.table}
          ALTER COLUMN "${dep.column}"
          TYPE payment_method_enum
          USING "${dep.column}"::text::payment_method_enum;
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
      console.log('ℹ️  No se encontraron columnas usando payment_method_enum_old\n');
    }

    // 4. Intentar eliminar el enum viejo
    console.log('🗑️  Intentando eliminar payment_method_enum_old...');
    try {
      await client.query('DROP TYPE payment_method_enum_old CASCADE;');
      console.log('   ✅ payment_method_enum_old eliminado exitosamente\n');
    } catch (error) {
      console.log(`   ⚠️  No se pudo eliminar: ${error.message}\n`);
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
