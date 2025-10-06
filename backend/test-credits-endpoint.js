const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'nexopos',
  user: 'nexopos_user',
  password: 'nexopos123'
});

async function testCreditsQuery() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Simular la query que hace el servicio de créditos
    const result = await client.query(`
      SELECT
        credit.*,
        customer.id as "customer_id",
        customer."firstName" as "customer_firstName",
        customer."lastName" as "customer_lastName",
        customer.phone as "customer_phone",
        customer.email as "customer_email"
      FROM customer_credits credit
      LEFT JOIN customers customer ON customer.id = credit."customerId"
      WHERE credit.type = 'sale'
      ORDER BY credit."createdAt" DESC
      LIMIT 5
    `);

    console.log('📊 RESULTADOS DE LA QUERY (simulando el endpoint):');
    console.log('='.repeat(80));

    result.rows.forEach(row => {
      console.log(`\nCrédito ID: ${row.id}`);
      console.log(`  customerId en tabla: ${row.customerId}`);
      console.log(`  Customer ID (join): ${row.customer_id}`);
      console.log(`  Customer nombre: ${row.customer_firstName} ${row.customer_lastName || ''}`);
      console.log(`  Customer phone: ${row.customer_phone || 'Sin teléfono'}`);
      console.log(`  Monto: $${row.amount}`);
      console.log(`  Balance: $${row.balance}`);
      console.log(`  Estado: ${row.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testCreditsQuery();
