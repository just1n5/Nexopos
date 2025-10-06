import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function closeAllCashRegisters() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'nexopos',
    username: process.env.DB_USER || 'nexopos',
    password: process.env.DB_PASSWORD || 'changeme',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Conectado a la base de datos');

    // Update all OPEN cash registers to CLOSED
    const result = await dataSource.query(`
      UPDATE cash_registers
      SET
        status = 'CLOSED',
        "closedAt" = NOW(),
        "closedBy" = 'system',
        "closingNotes" = 'Force closed by script'
      WHERE status = 'OPEN'
      RETURNING id, "sessionNumber", "openedAt", "closedAt"
    `);

    console.log(`✅ Cerradas ${result.length} caja(s):`);
    result.forEach((session: any) => {
      console.log(`  - Sesión ${session.sessionNumber} (ID: ${session.id})`);
      console.log(`    Abierta: ${session.openedAt}`);
      console.log(`    Cerrada: ${session.closedAt}`);
    });

    await dataSource.destroy();
    console.log('\n✨ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

closeAllCashRegisters()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
