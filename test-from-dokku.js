const { Client } = require('pg');

async function testSupabase() {
  console.log('Testing Supabase connection from Dokku server...\n');

  const connectionStrings = [
    'postgresql://postgres:Tomateatomico41%2A@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres',
    'postgresql://postgres.vohlomomrskxnuksodmt:Tomateatomico41%2A@aws-0-us-east-2.pooler.supabase.com:5432/postgres',
    'postgresql://postgres:Tomateatomico41*@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres',
    'postgresql://postgres.vohlomomrskxnuksodmt:Tomateatomico41*@aws-0-us-east-2.pooler.supabase.com:5432/postgres'
  ];

  for (const connStr of connectionStrings) {
    const cleanConnStr = connStr.replace(/:[^:@]*@/, ':****@');
    console.log(`\nTesting: ${cleanConnStr}`);

    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      const result = await client.query('SELECT version(), current_database(), current_user');
      console.log('✅ SUCCESS!');
      console.log('  Version:', result.rows[0].version.substring(0, 60));
      console.log('  Database:', result.rows[0].current_database);
      console.log('  User:', result.rows[0].current_user);

      // Test schema
      const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5");
      console.log('  Tables found:', tables.rows.map(r => r.table_name).join(', '));

      await client.end();

      console.log('\n🎉 WORKING CONNECTION STRING:');
      console.log(connStr);
      return;
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }

  console.log('\n❌ None of the connection strings worked.');
}

testSupabase().catch(console.error);
