const { DataSource } = require('typeorm');

const DB_URL = process.env.DB_URL || 'postgresql://nexopos_user:0B13dRjho45aqVdVThYiLGhlsxbv3Q1E@dpg-d3hiuoj3fgac739rg2hg-a.virginia-postgres.render.com/nexopos';

async function promoteToSuperAdmin() {
  const args = process.argv.slice(2);
  const email = args[0];

  if (!email) {
    console.error('❌ Error: Debes proporcionar un email de usuario');
    console.log('\nUso: node promote-to-superadmin.js <email>');
    console.log('Ejemplo: node promote-to-superadmin.js admin@nexopos.com');
    process.exit(1);
  }

  console.log('🔄 Conectando a la base de datos...');

  const dataSource = new DataSource({
    type: 'postgres',
    url: DB_URL,
    synchronize: false,
    logging: false,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión exitosa\n');

    const queryRunner = dataSource.createQueryRunner();

    // Buscar usuario
    const users = await queryRunner.query(
      `SELECT id, email, "firstName", "lastName", role FROM users WHERE email = $1`,
      [email]
    );

    if (users.length === 0) {
      console.error(`❌ No se encontró ningún usuario con el email: ${email}`);
      await queryRunner.release();
      await dataSource.destroy();
      process.exit(1);
    }

    const user = users[0];

    console.log('📋 Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol actual: ${user.role}\n`);

    if (user.role === 'SUPER_ADMIN') {
      console.log('✅ El usuario ya es SUPER_ADMIN');
      await queryRunner.release();
      await dataSource.destroy();
      process.exit(0);
    }

    // Promover a SUPER_ADMIN
    await queryRunner.query(
      `UPDATE users SET role = 'SUPER_ADMIN' WHERE id = $1`,
      [user.id]
    );

    console.log('✅ Usuario promovido a SUPER_ADMIN exitosamente\n');

    console.log('🔐 Permisos de SUPER_ADMIN:');
    console.log('   ✓ Gestión completa de beta keys');
    console.log('   ✓ Ver todas las claves (usadas y disponibles)');
    console.log('   ✓ Generar nuevas beta keys');
    console.log('   ✓ Eliminar beta keys no usadas');
    console.log('   ✓ Gestionar participantes beta\n');

    console.log('⚠️  IMPORTANTE:');
    console.log('   - Este rol es para administración de plataforma');
    console.log('   - Los usuarios ADMIN normales NO pueden ver beta keys');
    console.log('   - Solo debe haber 1-2 SUPER_ADMIN máximo\n');

    await queryRunner.release();
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await dataSource.destroy();
    process.exit(1);
  }
}

promoteToSuperAdmin();
