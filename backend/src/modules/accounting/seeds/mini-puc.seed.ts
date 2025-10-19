import { DataSource } from 'typeorm';
import { ChartOfAccounts, AccountNature, AccountType } from '../entities/chart-of-accounts.entity';

/**
 * Mini-PUC (Plan Único de Cuentas) Simplificado para PYMES
 * Basado en el Decreto 2650 de 1993 (Colombia)
 *
 * Contiene las 30-40 cuentas esenciales más utilizadas en:
 * - Comercio al por mayor y al por menor
 * - Prestación de servicios básicos
 *
 * Estructura:
 * 1xxx - ACTIVOS
 * 2xxx - PASIVOS
 * 3xxx - PATRIMONIO
 * 4xxx - INGRESOS
 * 5xxx - GASTOS
 * 6xxx - COSTOS
 */

interface MiniPUCAccount {
  code: string;
  name: string;
  description: string;
  nature: AccountNature;
  type: AccountType;
  level: number;
}

export const MINI_PUC_ACCOUNTS: MiniPUCAccount[] = [
  // ========== ACTIVOS (1xxx) ==========
  {
    code: '1105',
    name: 'Caja',
    description: 'Efectivo disponible en caja del negocio. Aumenta cuando se reciben pagos en efectivo, disminuye cuando se pagan gastos en efectivo.',
    nature: AccountNature.DEBIT,
    type: AccountType.ASSET,
    level: 4
  },
  {
    code: '1110',
    name: 'Bancos',
    description: 'Dinero depositado en cuentas bancarias. Aumenta con depósitos y transferencias recibidas, disminuye con pagos y retiros.',
    nature: AccountNature.DEBIT,
    type: AccountType.ASSET,
    level: 4
  },
  {
    code: '1305',
    name: 'Clientes',
    description: 'Dinero que los clientes deben al negocio por ventas a crédito (fiado). Representa las cuentas por cobrar.',
    nature: AccountNature.DEBIT,
    type: AccountType.ASSET,
    level: 4
  },
  {
    code: '135515',
    name: 'Retención en la Fuente por Cobrar',
    description: 'Retenciones que otros le hicieron al negocio. Es un saldo A FAVOR que se puede descontar del impuesto de renta al final del año.',
    nature: AccountNature.DEBIT,
    type: AccountType.ASSET,
    level: 6
  },
  {
    code: '1435',
    name: 'Mercancías no Fabricadas por la Empresa',
    description: 'Inventario de productos para la venta. Aumenta con compras de inventario, disminuye con ventas (al costo).',
    nature: AccountNature.DEBIT,
    type: AccountType.ASSET,
    level: 4
  },

  // ========== PASIVOS (2xxx) ==========
  {
    code: '2205',
    name: 'Proveedores Nacionales',
    description: 'Dinero que el negocio debe a sus proveedores por compras a crédito. Representa las cuentas por pagar a proveedores.',
    nature: AccountNature.CREDIT,
    type: AccountType.LIABILITY,
    level: 4
  },
  {
    code: '2335',
    name: 'Costos y Gastos por Pagar',
    description: 'Gastos operativos pendientes de pago (arriendos, servicios, etc.). Se usa cuando se registra un gasto pero aún no se ha pagado.',
    nature: AccountNature.CREDIT,
    type: AccountType.LIABILITY,
    level: 4
  },
  {
    code: '2365',
    name: 'Retención en la Fuente por Pagar',
    description: 'Retenciones que el negocio practicó a sus proveedores. Es una OBLIGACIÓN que debe declararse y pagarse a la DIAN.',
    nature: AccountNature.CREDIT,
    type: AccountType.LIABILITY,
    level: 4
  },
  {
    code: '2408',
    name: 'Impuesto sobre las Ventas por Pagar (IVA)',
    description: 'IVA neto a pagar a la DIAN. Se calcula como: IVA Generado (ventas) menos IVA Descontable (compras/gastos).',
    nature: AccountNature.CREDIT,
    type: AccountType.LIABILITY,
    level: 4
  },

  // ========== PATRIMONIO (3xxx) ==========
  {
    code: '3115',
    name: 'Aportes Sociales',
    description: 'Capital inicial aportado por los dueños del negocio. Representa la inversión inicial.',
    nature: AccountNature.CREDIT,
    type: AccountType.EQUITY,
    level: 4
  },
  {
    code: '3605',
    name: 'Utilidad del Ejercicio',
    description: 'Ganancia o pérdida del período actual. Se calcula al cierre como: Ingresos - Costos - Gastos.',
    nature: AccountNature.CREDIT,
    type: AccountType.EQUITY,
    level: 4
  },
  {
    code: '3705',
    name: 'Pérdida del Ejercicio',
    description: 'Pérdida del período si los costos y gastos superan los ingresos.',
    nature: AccountNature.DEBIT,
    type: AccountType.EQUITY,
    level: 4
  },

  // ========== INGRESOS (4xxx) ==========
  {
    code: '4135',
    name: 'Comercio al por Mayor y al por Menor',
    description: 'Ingresos por venta de productos. Esta es la cuenta principal de ingresos para negocios de comercio.',
    nature: AccountNature.CREDIT,
    type: AccountType.INCOME,
    level: 4
  },
  {
    code: '4175',
    name: 'Devoluciones en Ventas',
    description: 'Disminución de ingresos por devoluciones de productos. Funciona como contra-ingreso (débito).',
    nature: AccountNature.DEBIT,
    type: AccountType.INCOME,
    level: 4
  },
  {
    code: '4210',
    name: 'Ingresos Financieros',
    description: 'Ingresos por rendimientos bancarios, intereses ganados, etc.',
    nature: AccountNature.CREDIT,
    type: AccountType.INCOME,
    level: 4
  },

  // ========== GASTOS OPERACIONALES (5xxx) ==========
  {
    code: '5105',
    name: 'Gastos de Personal',
    description: 'Sueldos, salarios, prestaciones sociales y demás pagos a empleados.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5110',
    name: 'Honorarios',
    description: 'Pagos a profesionales independientes (abogados, contadores, consultores).',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5115',
    name: 'Impuestos',
    description: 'Impuestos y tasas (Industria y Comercio, predial, vehículos, etc.). NO incluye IVA ni Renta.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5120',
    name: 'Arrendamientos',
    description: 'Pago de arriendos de locales, bodegas, oficinas, equipos.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5130',
    name: 'Seguros',
    description: 'Primas de seguros (local, inventario, vehículos, SOAT, etc.).',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5135',
    name: 'Servicios',
    description: 'Servicios públicos (energía, agua, gas), internet, teléfono, aseo, vigilancia.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5140',
    name: 'Gastos Legales',
    description: 'Gastos notariales, registros, permisos, licencias, certificados.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5145',
    name: 'Mantenimiento y Reparaciones',
    description: 'Mantenimiento de equipos, muebles, vehículos, instalaciones, reparaciones.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5150',
    name: 'Adecuación e Instalación',
    description: 'Gastos de adecuación de locales, instalaciones, decoración.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5155',
    name: 'Gastos de Viaje',
    description: 'Viáticos, hospedaje, transporte, alimentación en viajes de negocio.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5160',
    name: 'Depreciaciones',
    description: 'Desgaste de activos fijos (equipos, muebles, vehículos). Gasto que no implica salida de efectivo.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5195',
    name: 'Gastos Diversos',
    description: 'Otros gastos operacionales: papelería, cafetería, aseo, publicidad, donaciones, etc.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },

  // ========== GASTOS DE VENTAS (52xx) ==========
  {
    code: '5205',
    name: 'Gastos de Personal de Ventas',
    description: 'Sueldos y comisiones del personal de ventas.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5210',
    name: 'Honorarios de Ventas',
    description: 'Comisiones a vendedores externos o asesores comerciales.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5240',
    name: 'Publicidad y Propaganda',
    description: 'Gastos de marketing, publicidad en redes, Google Ads, vallas, volantes.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5260',
    name: 'Transporte y Fletes',
    description: 'Costos de envío, domicilios, transporte de mercancía.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },

  // ========== GASTOS FINANCIEROS (53xx) ==========
  {
    code: '5305',
    name: 'Gastos Bancarios',
    description: 'Comisiones bancarias, cuotas de manejo, gravamen a los movimientos financieros (4x1000).',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },
  {
    code: '5310',
    name: 'Intereses',
    description: 'Intereses pagados por créditos, préstamos, tarjetas de crédito.',
    nature: AccountNature.DEBIT,
    type: AccountType.EXPENSE,
    level: 4
  },

  // ========== COSTO DE VENTAS (6xxx) ==========
  {
    code: '6135',
    name: 'Costo de Ventas - Comercio al por Mayor y al por Menor',
    description: 'Costo de adquisición de los productos vendidos. Se registra el valor de compra del inventario que se vendió.',
    nature: AccountNature.DEBIT,
    type: AccountType.COST,
    level: 4
  },
  {
    code: '6155',
    name: 'Devoluciones en Compras',
    description: 'Disminución del costo por devoluciones de mercancía a proveedores. Funciona como contra-costo (crédito).',
    nature: AccountNature.CREDIT,
    type: AccountType.COST,
    level: 4
  }
];

/**
 * Función para crear el Mini-PUC para un tenant específico
 */
export async function seedMiniPUC(
  dataSource: DataSource,
  tenantId: string
): Promise<void> {
  const accountRepo = dataSource.getRepository(ChartOfAccounts);

  console.log(`📚 Iniciando seed del Mini-PUC para tenant: ${tenantId}`);

  // Verificar si ya existen cuentas para este tenant
  const existingCount = await accountRepo.count({ where: { tenantId } });

  if (existingCount > 0) {
    console.log(`⚠️  El tenant ya tiene ${existingCount} cuentas. Omitiendo seed.`);
    return;
  }

  // Crear todas las cuentas
  let createdCount = 0;
  for (const accountData of MINI_PUC_ACCOUNTS) {
    const account = accountRepo.create({
      ...accountData,
      tenantId,
      isActive: true
    });

    await accountRepo.save(account);
    createdCount++;
  }

  console.log(`✅ Mini-PUC creado exitosamente: ${createdCount} cuentas`);
  console.log(`   - Activos: ${MINI_PUC_ACCOUNTS.filter(a => a.type === AccountType.ASSET).length}`);
  console.log(`   - Pasivos: ${MINI_PUC_ACCOUNTS.filter(a => a.type === AccountType.LIABILITY).length}`);
  console.log(`   - Patrimonio: ${MINI_PUC_ACCOUNTS.filter(a => a.type === AccountType.EQUITY).length}`);
  console.log(`   - Ingresos: ${MINI_PUC_ACCOUNTS.filter(a => a.type === AccountType.INCOME).length}`);
  console.log(`   - Gastos: ${MINI_PUC_ACCOUNTS.filter(a => a.type === AccountType.EXPENSE).length}`);
  console.log(`   - Costos: ${MINI_PUC_ACCOUNTS.filter(a => a.type === AccountType.COST).length}`);
}

/**
 * Función para crear el Mini-PUC para TODOS los tenants existentes
 */
export async function seedMiniPUCForAllTenants(dataSource: DataSource): Promise<void> {
  const tenantRepo = dataSource.getRepository('Tenant');
  const tenants = await tenantRepo.find();

  console.log(`🏢 Encontrados ${tenants.length} tenants`);

  for (const tenant of tenants) {
    await seedMiniPUC(dataSource, tenant.id);
  }

  console.log(`🎉 Proceso de seed completado para todos los tenants`);
}
