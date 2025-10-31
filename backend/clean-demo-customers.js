const { Pool } = require('pg');

// Obtener URL de la base de datos desde variables de entorno
const DB_URL = process.env.DB_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('Error: DB_URL o DATABASE_URL no está configurada');
  process.exit(1);
}

console.log('Conectando a la base de datos...');

const pool = new Pool({
  connectionString: DB_URL,
  ssl: false
});

async function cleanDemoCustomers() {
  const client = await pool.connect();

  try {
    console.log('\n🧹 Iniciando limpieza de clientes de prueba...\n');

    // Documentos de los clientes de prueba del seed
    const demoCustomers = [
      { type: 'CC', number: '1234567890', name: 'Juan Pérez' },
      { type: 'CC', number: '9876543210', name: 'María González' },
      { type: 'NIT', number: '900123456-7', name: 'Distribuidora ABC SAS' },
      { type: 'CC', number: '222222222', name: 'Consumidor Final' }
    ];

    let totalDeleted = 0;

    for (const customer of demoCustomers) {
      // Primero verificar si el cliente existe y tiene créditos asociados
      const checkQuery = `
        SELECT
          c.id,
          c."firstName",
          c."lastName",
          c."businessName",
          COUNT(cr.id) as credit_count
        FROM "customer" c
        LEFT JOIN "credit" cr ON cr."customerId" = c.id
        WHERE c."documentType" = $1 AND c."documentNumber" = $2
        GROUP BY c.id, c."firstName", c."lastName", c."businessName"
      `;

      const checkResult = await client.query(checkQuery, [customer.type, customer.number]);

      if (checkResult.rows.length > 0) {
        const customerData = checkResult.rows[0];
        const creditCount = parseInt(customerData.credit_count);
        const displayName = customerData.businessName || `${customerData.firstName} ${customerData.lastName}`;

        console.log(`📋 Cliente encontrado: ${displayName} (${customer.type} ${customer.number})`);

        if (creditCount > 0) {
          console.log(`   ⚠️  Tiene ${creditCount} crédito(s) asociado(s)`);
          console.log(`   🗑️  Eliminando créditos primero...`);

          // Primero eliminar los pagos de crédito (credit-payment)
          const deletePaymentsQuery = `
            DELETE FROM "credit-payment"
            WHERE "creditId" IN (
              SELECT id FROM "credit" WHERE "customerId" = $1
            )
          `;
          const deletePaymentsResult = await client.query(deletePaymentsQuery, [customerData.id]);
          console.log(`   ✓ ${deletePaymentsResult.rowCount} pago(s) eliminado(s)`);

          // Luego eliminar los créditos
          const deleteCreditsQuery = `DELETE FROM "credit" WHERE "customerId" = $1`;
          const deleteCreditsResult = await client.query(deleteCreditsQuery, [customerData.id]);
          console.log(`   ✓ ${deleteCreditsResult.rowCount} crédito(s) eliminado(s)`);
        }

        // Finalmente eliminar el cliente
        const deleteCustomerQuery = `
          DELETE FROM "customer"
          WHERE "documentType" = $1 AND "documentNumber" = $2
        `;

        const deleteResult = await client.query(deleteCustomerQuery, [customer.type, customer.number]);

        if (deleteResult.rowCount > 0) {
          console.log(`   ✅ Cliente eliminado exitosamente\n`);
          totalDeleted++;
        }
      } else {
        console.log(`   ℹ️  Cliente ${customer.name} no encontrado (ya fue eliminado o no existe)\n`);
      }
    }

    console.log(`\n✨ Limpieza completada!`);
    console.log(`📊 Total de clientes de prueba eliminados: ${totalDeleted}`);
    console.log(`\n💡 Ahora solo aparecerán los clientes reales en el módulo de fiado.\n`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar limpieza
cleanDemoCustomers()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
