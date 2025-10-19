import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { seedMiniPUC, seedMiniPUCForAllTenants } from '../modules/accounting/seeds/mini-puc.seed';
import {
  seedFiscalConfig,
  seedFiscalConfigForAllTenants,
  seedCustomFiscalConfig
} from '../modules/accounting/seeds/fiscal-config.seed';

/**
 * Script de Seeds para el Módulo de Contabilidad
 *
 * Este script crea:
 * 1. Plan de Cuentas (Mini-PUC) - 30 cuentas esenciales
 * 2. Configuración Fiscal de Ejemplo
 *
 * Uso:
 * - Para un tenant específico: npm run seed:accounting -- --tenant=<tenantId>
 * - Para todos los tenants: npm run seed:accounting -- --all
 * - Configuración custom: modificar el objeto customConfig en este archivo
 */

interface SeedAccountingOptions {
  tenantId?: string;
  all?: boolean;
  fiscalType?: 'juridica' | 'natural';
  custom?: boolean;
}

export async function runAccountingSeeds(options: SeedAccountingOptions = {}) {
  console.log('🚀 Iniciando seeds de Contabilidad...\n');

  config({ path: '.env' });

  const configService = new ConfigService();

  // Create database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    database: configService.get<string>('DB_NAME', 'nexopos'),
    username: configService.get<string>('DB_USER', 'nexopos_user'),
    password: configService.get<string>('DB_PASSWORD', 'nexopos123'),
    schema: configService.get<string>('DB_SCHEMA', 'public'),
    entities: ['src/**/*.entity{.ts,.js}'],
    synchronize: false,
    ssl: configService.get<string>('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();
  console.log('✅ Conexión a base de datos establecida\n');

  try {
    // Determinar si es para un tenant específico o todos
    if (options.tenantId) {
      // Seed para un tenant específico
      console.log(`📌 Ejecutando seeds para tenant: ${options.tenantId}\n`);

      if (options.custom) {
        // Configuración personalizada
        await seedCustomAccountingForTenant(dataSource, options.tenantId);
      } else {
        // Configuración estándar
        await seedAccountingForTenant(
          dataSource,
          options.tenantId,
          options.fiscalType || 'juridica'
        );
      }
    } else if (options.all) {
      // Seed para todos los tenants
      console.log('🌐 Ejecutando seeds para TODOS los tenants\n');
      await seedAccountingForAllTenants(
        dataSource,
        options.fiscalType || 'juridica'
      );
    } else {
      // Por defecto: buscar todos los tenants y ofrecerlos
      const tenants = await listTenants(dataSource);

      if (tenants.length === 0) {
        console.log('⚠️  No se encontraron tenants en la base de datos.');
        console.log('   Por favor, ejecuta el seed principal primero: npm run seed\n');
        return;
      }

      console.log('📋 Tenants disponibles:');
      tenants.forEach((tenant, index) => {
        console.log(`   ${index + 1}. ${tenant.name} (ID: ${tenant.id})`);
      });
      console.log('\n💡 Usa: npm run seed:accounting -- --tenant=<tenantId>');
      console.log('   O: npm run seed:accounting -- --all\n');
    }

    console.log('\n✅ Seeds de contabilidad completados exitosamente!\n');
    printAccountingSummary();

  } catch (error) {
    console.error('\n❌ Error ejecutando seeds de contabilidad:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

/**
 * Ejecutar seeds de contabilidad para un tenant específico
 */
async function seedAccountingForTenant(
  dataSource: DataSource,
  tenantId: string,
  fiscalType: 'juridica' | 'natural'
): Promise<void> {
  console.log('1️⃣  Creando Plan de Cuentas (Mini-PUC)...');
  await seedMiniPUC(dataSource, tenantId);
  console.log('');

  console.log('2️⃣  Creando Configuración Fiscal...');
  await seedFiscalConfig(dataSource, tenantId, fiscalType);
  console.log('');
}

/**
 * Ejecutar seeds de contabilidad para TODOS los tenants
 */
async function seedAccountingForAllTenants(
  dataSource: DataSource,
  fiscalType: 'juridica' | 'natural'
): Promise<void> {
  console.log('1️⃣  Creando Plan de Cuentas (Mini-PUC) para todos los tenants...');
  await seedMiniPUCForAllTenants(dataSource);
  console.log('');

  console.log('2️⃣  Creando Configuración Fiscal para todos los tenants...');
  await seedFiscalConfigForAllTenants(dataSource, fiscalType);
  console.log('');
}

/**
 * Crear configuración contable personalizada para un tenant
 */
async function seedCustomAccountingForTenant(
  dataSource: DataSource,
  tenantId: string
): Promise<void> {
  console.log('1️⃣  Creando Plan de Cuentas (Mini-PUC)...');
  await seedMiniPUC(dataSource, tenantId);
  console.log('');

  console.log('2️⃣  Creando Configuración Fiscal Personalizada...');

  // Aquí puedes personalizar la configuración fiscal
  const customConfig = {
    legalName: 'Mi Empresa Personalizada S.A.S',
    tradeName: 'Mi Tienda',
    nit: '900111222',
    nitVerificationDigit: '3',
    city: 'Cali',
    state: 'Valle del Cauca',
    fiscalAddress: 'Calle Personalizada #10-20',
    fiscalEmail: 'contabilidad@miempresa.com',
    phone: '+57 315 5555555',
    // Agrega más campos personalizados aquí
  };

  await seedCustomFiscalConfig(dataSource, tenantId, customConfig);
  console.log('');
}

/**
 * Listar todos los tenants disponibles
 */
async function listTenants(dataSource: DataSource): Promise<any[]> {
  try {
    const tenantRepo = dataSource.getRepository('Tenant');
    const tenants = await tenantRepo.find();
    return tenants;
  } catch (error) {
    console.error('Error listando tenants:', error);
    return [];
  }
}

/**
 * Imprimir resumen de información
 */
function printAccountingSummary() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN DE SEEDS DE CONTABILIDAD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ Plan de Cuentas (Mini-PUC):');
  console.log('   - 30 cuentas esenciales creadas');
  console.log('   - 5 Activos');
  console.log('   - 4 Pasivos');
  console.log('   - 3 Patrimonio');
  console.log('   - 3 Ingresos');
  console.log('   - 13 Gastos');
  console.log('   - 2 Costos');
  console.log('');
  console.log('✅ Configuración Fiscal:');
  console.log('   - Datos de ejemplo creados');
  console.log('   - ⚠️  IMPORTANTE: Actualizar con datos reales');
  console.log('');
  console.log('🔧 Próximos Pasos:');
  console.log('   1. Actualizar configuración fiscal en /accounting');
  console.log('   2. Realizar una venta de prueba');
  console.log('   3. Verificar asiento contable generado');
  console.log('   4. Cerrar caja y verificar arqueo');
  console.log('');
  console.log('📚 Documentación del Mini-PUC:');
  console.log('   - Ver: backend/src/modules/accounting/seeds/mini-puc.seed.ts');
  console.log('   - Cada cuenta tiene descripción detallada');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Parsear argumentos de línea de comandos
 */
function parseArgs(): SeedAccountingOptions {
  const args = process.argv.slice(2);
  const options: SeedAccountingOptions = {};

  for (const arg of args) {
    if (arg.startsWith('--tenant=')) {
      options.tenantId = arg.split('=')[1];
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--natural') {
      options.fiscalType = 'natural';
    } else if (arg === '--juridica') {
      options.fiscalType = 'juridica';
    } else if (arg === '--custom') {
      options.custom = true;
    }
  }

  return options;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const options = parseArgs();

  runAccountingSeeds(options)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
