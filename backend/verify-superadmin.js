
const { DataSource } = require('typeorm');

async function verifySuperAdmin() {
  console.log('🔍 Iniciando script de verificación...');
  console.log('🔄 Conectando a la base de datos de Render...');

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

    // 1. Verificar el Tenant
    console.log('🏢 Verificando el "Default Tenant"...');
    const tenantResult = await queryRunner.query(
      `SELECT id, "businessName" FROM tenants WHERE "businessName" = $1`,
      ['Default Tenant']
    );

    if (tenantResult.length > 0) {
      console.log('  -> ✅ Tenant encontrado:');
      console.log(`     ID: ${tenantResult[0].id}`);
      console.log(`     Name: ${tenantResult[0].name}`);
    } else {
      console.log('  -> ❌ No se encontró el "Default Tenant".\n');
    }

    // 2. Verificar el Usuario
    console.log('👤 Verificando el usuario "jserna@cloutionsas.com"...');
    const userResult = await queryRunner.query(
      `SELECT id, email, role, "tenantId" FROM users WHERE email = $1`,
      ['jserna@cloutionsas.com']
    );

    if (userResult.length > 0) {
      console.log('  -> ✅ Usuario encontrado:');
      console.log(`     ID: ${userResult[0].id}`);
      console.log(`     Email: ${userResult[0].email}`);
      console.log(`     Rol: ${userResult[0].role}`);
      console.log(`     Tenant ID: ${userResult[0].tenantId}`);

      // 3. Verificar la asociación
      if (tenantResult.length > 0 && userResult[0].tenantId === tenantResult[0].id) {
        console.log('\n✅ La asociación entre el usuario y el tenant es correcta.');
      } else {
        console.log('\n❌ Error: El ID del tenant del usuario no coincide con el "Default Tenant".');
      }

    } else {
      console.log('  -> ❌ No se encontró el usuario.\n');
    }

    await queryRunner.release();
    await dataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    await dataSource.destroy();
    process.exit(1);
  }
}

verifySuperAdmin();
