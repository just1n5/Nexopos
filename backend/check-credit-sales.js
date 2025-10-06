const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'nexopos',
  user: 'nexopos_user',
  password: 'nexopos123'
});

async function checkCreditSales() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Check last sales
    console.log('📊 ÚLTIMAS 5 VENTAS:');
    console.log('='.repeat(80));
    const salesResult = await client.query(`
      SELECT
        id,
        "saleNumber",
        type,
        "customerId",
        total,
        "paidAmount",
        "creditAmount",
        status,
        "createdAt"
      FROM sales
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);

    salesResult.rows.forEach(sale => {
      console.log(`\nVenta: ${sale.saleNumber}`);
      console.log(`  Tipo: ${sale.type}`);
      console.log(`  Total: $${sale.total}`);
      console.log(`  Pagado: $${sale.paidAmount}`);
      console.log(`  Crédito: $${sale.creditAmount}`);
      console.log(`  Cliente ID: ${sale.customerId || 'Sin cliente'}`);
      console.log(`  Estado: ${sale.status}`);
      console.log(`  Fecha: ${sale.createdAt}`);
    });

    // Check customer_credits
    console.log('\n\n💳 REGISTROS DE CRÉDITO (customer_credits):');
    console.log('='.repeat(80));
    const creditsResult = await client.query(`
      SELECT
        id,
        "customerId",
        type,
        amount,
        "paidAmount",
        balance,
        "referenceId",
        status,
        "createdAt"
      FROM customer_credits
      WHERE type = 'sale'
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);

    if (creditsResult.rows.length === 0) {
      console.log('❌ No hay registros de créditos de ventas');
    } else {
      creditsResult.rows.forEach(credit => {
        console.log(`\nCrédito ID: ${credit.id}`);
        console.log(`  Cliente ID: ${credit.customerId}`);
        console.log(`  Monto: $${credit.amount}`);
        console.log(`  Pagado: $${credit.paidAmount}`);
        console.log(`  Balance: $${credit.balance}`);
        console.log(`  Venta ID: ${credit.referenceId}`);
        console.log(`  Estado: ${credit.status}`);
        console.log(`  Fecha: ${credit.createdAt}`);
      });
    }

    // Check specific customer
    console.log('\n\n👤 CLIENTE CON ID 55c21294-5a9d-49b0-998c-063adb60a3f0:');
    console.log('='.repeat(80));
    const customerResult = await client.query(`
      SELECT
        id,
        "firstName",
        "lastName",
        "creditEnabled",
        "creditLimit",
        "creditUsed",
        "creditAvailable",
        balance
      FROM customers
      WHERE id = '55c21294-5a9d-49b0-998c-063adb60a3f0'
    `);

    if (customerResult.rows.length > 0) {
      const customer = customerResult.rows[0];
      console.log(`\nNombre: ${customer.firstName} ${customer.lastName || ''}`);
      console.log(`  Crédito habilitado: ${customer.creditEnabled ? '✅ SÍ' : '❌ NO'}`);
      console.log(`  Límite de crédito: $${customer.creditLimit}`);
      console.log(`  Crédito usado: $${customer.creditUsed}`);
      console.log(`  Crédito disponible: $${customer.creditAvailable}`);
      console.log(`  Balance (deuda): $${customer.balance}`);
    } else {
      console.log('❌ Cliente no encontrado');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkCreditSales();
