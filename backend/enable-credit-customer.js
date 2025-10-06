const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'nexopos',
  user: 'nexopos_user',
  password: 'nexopos123'
});

async function enableCredit() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    const customerId = '55c21294-5a9d-49b0-998c-063adb60a3f0';

    // Update customer to enable credit
    const result = await client.query(`
      UPDATE customers
      SET
        "creditEnabled" = true,
        "creditLimit" = 100000,
        "creditAvailable" = 100000 - COALESCE("creditUsed", 0)
      WHERE id = $1
      RETURNING id, "firstName", "lastName", "creditEnabled", "creditLimit", "creditAvailable"
    `, [customerId]);

    if (result.rows.length > 0) {
      console.log('✅ Cliente actualizado correctamente:\n');
      const customer = result.rows[0];
      console.log(`   Nombre: ${customer.firstName} ${customer.lastName || ''}`);
      console.log(`   Crédito habilitado: ${customer.creditEnabled ? 'SÍ' : 'NO'}`);
      console.log(`   Límite: $${customer.creditLimit}`);
      console.log(`   Disponible: $${customer.creditAvailable}`);
    } else {
      console.log('❌ Cliente no encontrado');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

enableCredit();
