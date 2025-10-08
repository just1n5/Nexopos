const { DataSource } = require('typeorm');

// URL de conexión a la base de datos de Render
// Formato: postgresql://user:password@host/database
const DB_URL = process.env.DB_URL || 'postgresql://nexopos_user:0B13dRjho45aqVdVThYiLGhlsxbv3Q1E@dpg-d3hiuoj3fgac739rg2hg-a.virginia-postgres.render.com/nexopos';

async function runMigration() {
  console.log('🔄 Conectando a la base de datos de producción...');

  const dataSource = new DataSource({
    type: 'postgres',
    url: DB_URL,
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
    synchronize: false,
    logging: true,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión exitosa');

    console.log('\n📊 Verificando migraciones pendientes...');
    const pendingMigrations = await dataSource.showMigrations();

    if (pendingMigrations) {
      console.log('🚀 Ejecutando migraciones...');
      await dataSource.runMigrations();
      console.log('✅ Migraciones completadas exitosamente');
    } else {
      console.log('✅ No hay migraciones pendientes');
    }

    console.log('\n📋 Verificando tablas creadas...');
    const queryRunner = dataSource.createQueryRunner();

    const tables = await queryRunner.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('tenants', 'beta_keys')
      ORDER BY table_name
    `);

    console.log('Tablas encontradas:', tables);

    const userColumns = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('tenantId', 'isOwner', 'documentId', 'phoneNumber')
      ORDER BY column_name
    `);

    console.log('Nuevas columnas en users:', userColumns);

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runMigration();
