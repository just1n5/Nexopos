const { DataSource } = require('typeorm');

const DB_URL = process.env.DB_URL || 'postgresql://nexopos_user:0B13dRjho45aqVdVThYiLGhlsxbv3Q1E@dpg-d3hiuoj3fgac739rg2hg-a.virginia-postgres.render.com/nexopos';

async function addSuperAdminToEnum() {
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

    // Verificar valores actuales del enum
    const currentValues = await queryRunner.query(
      `SELECT unnest(enum_range(NULL::users_role_enum))::text as value`
    );

    console.log('📋 Valores actuales del enum:');
    currentValues.forEach(v => console.log(`   - ${v.value}`));
    console.log('');

    // Verificar si SUPER_ADMIN ya existe
    const hasSuperAdmin = currentValues.some(v => v.value === 'SUPER_ADMIN');

    if (hasSuperAdmin) {
      console.log('✅ SUPER_ADMIN ya existe en el enum\n');
    } else {
      console.log('🔧 Agregando SUPER_ADMIN al enum...\n');

      // Agregar SUPER_ADMIN al enum
      await queryRunner.query(
        `ALTER TYPE users_role_enum ADD VALUE 'SUPER_ADMIN'`
      );

      console.log('✅ SUPER_ADMIN agregado exitosamente al enum\n');

      // Verificar nuevamente
      const newValues = await queryRunner.query(
        `SELECT unnest(enum_range(NULL::users_role_enum))::text as value`
      );

      console.log('📋 Nuevos valores del enum:');
      newValues.forEach(v => console.log(`   - ${v.value}`));
      console.log('');
    }

    await queryRunner.release();
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await dataSource.destroy();
    process.exit(1);
  }
}

addSuperAdminToEnum();
