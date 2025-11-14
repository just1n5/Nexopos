const { Client } = require('pg');

async function testConnection(config, description) {
  console.log(`\n🔍 Probando: ${description}`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);

  const client = new Client(config);

  try {
    await client.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ ÉXITO! Conexión establecida');
    console.log(`   PostgreSQL: ${result.rows[0].version.substring(0, 50)}...`);
    await client.end();
    return { success: true, config };
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('PRUEBA DE CONEXIÓN A SUPABASE');
  console.log('='.repeat(80));

  const password = 'WHsA3FfvLFDCzQqv';

  // Construir usando parámetros separados en vez de URL
  const directConfig = {
    host: 'db.vohlomomrskxnuksodmt.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false }
  };

  const poolerConfigWithProject = {
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.vohlomomrskxnuksodmt',
    password: password,
    ssl: { rejectUnauthorized: false }
  };

  const poolerConfigSimple = {
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false }
  };

  const poolerPort6543 = {
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false }
  };

  const tests = [
    {
      config: poolerConfigSimple,
      desc: 'Pooler IPv4 - usuario simple "postgres"',
    },
    {
      config: poolerConfigWithProject,
      desc: 'Pooler IPv4 - usuario "postgres.PROJECT_ID"',
    },
    {
      config: poolerPort6543,
      desc: 'Pooler puerto 6543 - usuario simple',
    },
    {
      config: directConfig,
      desc: 'Direct Connection',
    }
  ];

  console.log(`\nPassword: ${password.replace(/./g, '*')}`);

  for (const test of tests) {
    const result = await testConnection(test.config, test.desc);
    if (result.success) {
      console.log('\n🎉 ¡ENCONTRADA! Configuración correcta:');
      console.log('\nPara backend/.env, usa:');
      const connStr = `postgresql://${result.config.user}:${result.config.password}@${result.config.host}:${result.config.port}/${result.config.database}`;
      console.log(`DATABASE_URL=${connStr}`);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo entre intentos
  }

  console.log('\n' + '='.repeat(80));
  console.log('Prueba completada');
  console.log('='.repeat(80));
}

main().catch(console.error);
