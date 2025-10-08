const { DataSource } = require('typeorm');

const DB_URL = process.env.DB_URL || 'postgresql://nexopos_user:0B13dRjho45aqVdVThYiLGhlsxbv3Q1E@dpg-d3hiuoj3fgac739rg2hg-a.virginia-postgres.render.com/nexopos';

function generateBetaKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part2 = Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `BETA-${part1}-${part2}`;
}

async function seedBetaKeys() {
  console.log('🔄 Conectando a la base de datos de producción...');

  const dataSource = new DataSource({
    type: 'postgres',
    url: DB_URL,
    synchronize: false,
    logging: true,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión exitosa');

    const queryRunner = dataSource.createQueryRunner();

    console.log('\n🔑 Generando 60 beta keys...');
    const keys = [];

    for (let i = 0; i < 60; i++) {
      let key = generateBetaKey();
      // Verificar que sea única
      while (keys.includes(key)) {
        key = generateBetaKey();
      }
      keys.push(key);

      await queryRunner.query(
        `INSERT INTO beta_keys (key, "isUsed", notes) VALUES ($1, false, $2)`,
        [key, 'Generada para beta cerrada - Lote inicial']
      );
    }

    console.log('✅ 60 beta keys generadas exitosamente');
    console.log('\n📋 Primeras 5 claves:');
    keys.slice(0, 5).forEach((key, i) => {
      console.log(`  ${i + 1}. ${key}`);
    });

    console.log('\n📊 Estadísticas:');
    const stats = await queryRunner.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN "isUsed" = false THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN "isUsed" = true THEN 1 ELSE 0 END) as used
      FROM beta_keys
    `);
    console.log(stats[0]);

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seedBetaKeys();
