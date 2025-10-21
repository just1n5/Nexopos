const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

async function createSuperAdmin() {
  console.log('Starting createSuperAdmin script...');
  console.log('Connecting to the database using environment variables...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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

    // Ensure a tenant exists
    console.log('🏢 Verificando la existencia del tenant...');
    let tenantResult = await queryRunner.query(
      `SELECT id FROM tenants WHERE name = $1`,
      ['Default Tenant']
    );

    let tenantId;
    if (tenantResult.length === 0) {
      console.log('Tenant no encontrado, creando "Default Tenant"...');
      const newTenantResult = await queryRunner.query(
        `INSERT INTO tenants (name, "ownerEmail", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id`,
        ['Default Tenant', 'jserna@cloutionsas.com', 'ACTIVE']
      );
      tenantId = newTenantResult[0].id;
      console.log(`✅ Tenant "Default Tenant" creado con ID: ${tenantId}\n`);
    } else {
      tenantId = tenantResult[0].id;
      console.log(`✅ Tenant "Default Tenant" ya existe con ID: ${tenantId}\n`);
    }

    if (existingUsers.length > 0) {
      console.log('⚠️  El usuario ya existe, promoviendo a SUPER_ADMIN y asociando a tenant...\n');

      await queryRunner.query(
        `UPDATE users SET role = 'SUPER_ADMIN', "tenantId" = $1 WHERE email = $2`,
        [tenantId, 'jserna@cloutionsas.com']
      );

      console.log('✅ Usuario promovido a SUPER_ADMIN y asociado al tenant exitosamente\n');
    } else {
      // Hash de la contraseña
      const password = 'Aguacate41*';
      console.log('🔐 Hasheando contraseña...');
      const hashedPassword = await bcrypt.hash(password, 12);
      console.log('Password hashed.');

      // Crear usuario
      console.log('👤 Creando usuario SUPER_ADMIN y asociando a tenant...\n');
      const result = await queryRunner.query(
        `INSERT INTO users ("firstName", "lastName", email, password, role, "isActive", "tenantId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id, email, "firstName", "lastName", role, "tenantId"`,
        ['Justine', 'Serna', 'jserna@cloutionsas.com', hashedPassword, 'SUPER_ADMIN', true, tenantId]
      );

      console.log('✅ Usuario SUPER_ADMIN creado exitosamente:\n');
      console.log(`   ID: ${result[0].id}`);
      console.log(`   Nombre: ${result[0].firstName} ${result[0].lastName}`);
      console.log(`   Email: ${result[0].email}`);
      console.log(`   Rol: ${result[0].role}`);
      console.log(`   Tenant ID: ${result[0].tenantId}`);
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