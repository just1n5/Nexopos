const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

const DB_URL = process.env.DB_URL || 'postgresql://nexopos_user:0B13dRjho45aqVdVThYiLGhlsxbv3Q1E@dpg-d3hiuoj3fgac739rg2hg-a.virginia-postgres.render.com/nexopos';

async function createSuperAdmin() {
  console.log('Starting createSuperAdmin script...');
  console.log(`DB_URL: ${DB_URL}`);
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
    console.log('QueryRunner created.');

    // Verificar si el usuario ya existe
    console.log('Checking if user jserna@cloutionsas.com already exists...');
    const existingUsers = await queryRunner.query(
      `SELECT id FROM users WHERE email = $1`,
      ['jserna@cloutionsas.com']
    );
    console.log(`Existing users found: ${existingUsers.length}`);

    if (existingUsers.length > 0) {
      console.log('⚠️  El usuario ya existe, promoviendo a SUPER_ADMIN...\n');

      await queryRunner.query(
        `UPDATE users SET role = 'SUPER_ADMIN' WHERE email = $1`,
        ['jserna@cloutionsas.com']
      );

      console.log('✅ Usuario promovido a SUPER_ADMIN exitosamente\n');
    } else {
      // Hash de la contraseña
      const password = 'Aguacate41*';
      console.log('🔐 Hasheando contraseña...');
      const hashedPassword = await bcrypt.hash(password, 12);
      console.log('Password hashed.');

      // Crear usuario
      console.log('👤 Creando usuario...\n');
      const result = await queryRunner.query(
        `INSERT INTO users ("firstName", "lastName", email, password, role, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, email, "firstName", "lastName", role`,
        ['Justine', 'Serna', 'jserna@cloutionsas.com', hashedPassword, 'SUPER_ADMIN', true]
      );

      console.log('✅ Usuario SUPER_ADMIN creado exitosamente:\n');
      console.log(`   ID: ${result[0].id}`);
      console.log(`   Nombre: ${result[0].firstName} ${result[0].lastName}`);
      console.log(`   Email: ${result[0].email}`);
      console.log(`   Rol: ${result[0].role}`);
      console.log(`   Contraseña: Aguacate41*\n`);
    }

    console.log('🔐 Permisos de SUPER_ADMIN:');
    console.log('   ✓ Gestión completa de beta keys');
    console.log('   ✓ Ver todas las claves (usadas y disponibles)');
    console.log('   ✓ Generar nuevas beta keys');
    console.log('   ✓ Eliminar beta keys no usadas');
    console.log('   ✓ Gestionar participantes beta');
    console.log('   ✓ Todos los permisos de ADMIN\n');

    console.log('Releasing query runner...');
    await queryRunner.release();
    console.log('Query runner released.');

    console.log('Destroying data source...');
    await dataSource.destroy();
    console.log('Data source destroyed.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en createSuperAdmin:', error.message);
    console.error(error);
    await dataSource.destroy();
    process.exit(1);
  }
}

createSuperAdmin();