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

async function fixMovementTypeEnum() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Limpiando enum movement_type_enum_old...\n');

    // 1. Verificar si existe el enum viejo
    const oldEnumExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_type
        WHERE typname = 'movement_type_enum_old'
      );
    `);

    if (!oldEnumExists.rows[0].exists) {
      console.log('   ℹ️  No existe movement_type_enum_old, no hay nada que limpiar');
      await client.end();
      process.exit(0);
    }

    console.log('   ⚠️  Encontrado movement_type_enum_old');

    // 2. Buscar objetos que dependen de este enum
    const dependencies = await client.query(`
      SELECT
        n.nspname as schema,
        c.relname as table,
        a.attname as column,
        t.typname as type
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_type t ON a.atttypid = t.oid
      WHERE t.typname = 'movement_type_enum_old'
        AND a.attnum > 0
        AND NOT a.attisdropped;
    `);

    if (dependencies.rows.length > 0) {
      console.log(`\n   ⚠️  Encontradas ${dependencies.rows.length} columnas usando movement_type_enum_old:`);
      dependencies.rows.forEach(dep => {
        console.log(`      - ${dep.schema}.${dep.table}.${dep.column}`);
      });

      // 3. Intentar convertir cada columna al enum correcto
      for (const dep of dependencies.rows) {
        console.log(`\n   🔄 Convirtiendo ${dep.schema}.${dep.table}.${dep.column} a movement_type_enum...`);

        try {
          // Primero intentar sin casting
          await client.query(`
            ALTER TABLE ${dep.schema}.${dep.table}
            ALTER COLUMN ${dep.column} TYPE movement_type_enum
            USING ${dep.column}::text::movement_type_enum;
          `);
          console.log(`      ✅ Convertido exitosamente`);
        } catch (err) {
          console.log(`      ⚠️  Error al convertir: ${err.message}`);
          console.log(`      Intentando DROP CASCADE...`);

          // Si falla, intentar recrear la columna
          try {
            await client.query(`
              ALTER TABLE ${dep.schema}.${dep.table}
              DROP COLUMN ${dep.column} CASCADE;
            `);
            console.log(`      ✅ Columna eliminada (será recreada por TypeORM)`);
          } catch (dropErr) {
            console.log(`      ❌ No se pudo eliminar: ${dropErr.message}`);
          }
        }
      }
    }

    // 4. Intentar eliminar el enum viejo
    console.log(`\n   🗑️  Intentando eliminar movement_type_enum_old...`);
    try {
      await client.query(`DROP TYPE IF EXISTS movement_type_enum_old CASCADE;`);
      console.log('      ✅ Enum viejo eliminado');
    } catch (err) {
      console.log(`      ⚠️  No se pudo eliminar: ${err.message}`);
    }

    // 5. Verificar enums actuales
    console.log('\n📊 Enums relacionados con movement_type:');
    const enums = await client.query(`
      SELECT typname
      FROM pg_type
      WHERE typname LIKE '%movement_type%'
      ORDER BY typname;
    `);

    enums.rows.forEach(row => {
      console.log(`   - ${row.typname}`);
    });

    await client.end();
    console.log('\n✅ Limpieza completada\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

fixMovementTypeEnum();
