const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'nexopos',
  user: 'nexopos_user',
  password: 'nexopos123'
});

async function fixCustomerBalances() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Get all customers with credits
    const customersResult = await client.query(`
      SELECT DISTINCT "customerId"
      FROM customer_credits
      WHERE type = 'sale'
    `);

    console.log(`📊 Recalculando balances para ${customersResult.rows.length} clientes...\n`);

    for (const row of customersResult.rows) {
      const customerId = row.customerId;

      // Calculate totals from customer_credits
      const totalsResult = await client.query(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'sale' AND status NOT IN ('cancelled') THEN amount ELSE 0 END), 0) as total_credits,
          COALESCE(SUM(CASE WHEN type = 'sale' AND status NOT IN ('cancelled') THEN "paidAmount" ELSE 0 END), 0) as total_paid,
          COALESCE(SUM(CASE WHEN type = 'sale' AND status NOT IN ('cancelled') THEN balance ELSE 0 END), 0) as total_balance
        FROM customer_credits
        WHERE "customerId" = $1
      `, [customerId]);

      const { total_credits, total_paid, total_balance } = totalsResult.rows[0];

      // Update customer
      await client.query(`
        UPDATE customers
        SET
          "creditUsed" = $1,
          "creditAvailable" = "creditLimit" - $1,
          balance = $2
        WHERE id = $3
      `, [parseFloat(total_balance), parseFloat(total_balance), customerId]);

      // Get customer name
      const customerResult = await client.query(`
        SELECT "firstName", "lastName" FROM customers WHERE id = $1
      `, [customerId]);

      const customer = customerResult.rows[0];
      const name = `${customer.firstName} ${customer.lastName || ''}`.trim();

      console.log(`✅ ${name}:`);
      console.log(`   Créditos totales: $${total_credits}`);
      console.log(`   Pagado: $${total_paid}`);
      console.log(`   Balance actualizado: $${total_balance}\n`);
    }

    console.log('✅ Balances recalculados correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixCustomerBalances();
