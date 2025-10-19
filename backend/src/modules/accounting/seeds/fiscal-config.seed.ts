import { DataSource } from 'typeorm';
import {
  FiscalConfig,
  TaxRegime,
  PersonType,
  FiscalResponsibility,
  VATDeclarationPeriod
} from '../entities/fiscal-config.entity';

/**
 * Configuración Fiscal de Ejemplo para PYMES Colombianas
 *
 * Este seeder crea una configuración fiscal básica para facilitar
 * el onboarding de nuevos tenants.
 *
 * IMPORTANTE: Esta es una configuración de EJEMPLO.
 * Cada negocio debe actualizarla con sus datos reales.
 */

interface FiscalConfigSeedData {
  legalName: string;
  tradeName?: string;
  nit: string;
  nitVerificationDigit?: string;
  taxRegime: TaxRegime;
  personType: PersonType;
  fiscalResponsibilities: FiscalResponsibility[];
  isRetentionAgent: boolean;
  isVATResponsible: boolean;
  vatDeclarationPeriod: VATDeclarationPeriod;
  fiscalAddress: string;
  city: string;
  state: string;
  postalCode?: string;
  phone?: string;
  fiscalEmail?: string;
  ciiu?: string;
  economicActivity?: string;
  useElectronicInvoicing: boolean;
  electronicInvoiceProvider?: string;
  isConfigured: boolean;
}

/**
 * Configuración fiscal de ejemplo para comercio minorista
 */
export const DEFAULT_FISCAL_CONFIG: FiscalConfigSeedData = {
  legalName: 'Comercializadora Ejemplo S.A.S',
  tradeName: 'Tienda Ejemplo',
  nit: '900123456',
  nitVerificationDigit: '7',
  taxRegime: TaxRegime.COMMON,
  personType: PersonType.JURIDICA,
  fiscalResponsibilities: [
    FiscalResponsibility.R_01_IVA,  // Responsable de IVA
    FiscalResponsibility.R_07_REGIMEN_SIMPLE  // Régimen Simple
  ],
  isRetentionAgent: false,
  isVATResponsible: true,
  vatDeclarationPeriod: VATDeclarationPeriod.BIMONTHLY,
  fiscalAddress: 'Calle 123 # 45-67',
  city: 'Medellín',
  state: 'Antioquia',
  postalCode: '050001',
  phone: '+57 300 1234567',
  fiscalEmail: 'contabilidad@ejemplo.com',
  ciiu: '4711',  // Comercio al por menor en establecimientos no especializados
  economicActivity: 'Comercio al por menor en establecimientos no especializados con surtido compuesto principalmente de alimentos, bebidas o tabaco',
  useElectronicInvoicing: false,  // Por defecto desactivada
  electronicInvoiceProvider: undefined,
  isConfigured: false  // Marcada como no configurada para forzar al usuario a actualizarla
};

/**
 * Configuración fiscal de ejemplo para persona natural (tendero)
 */
export const NATURAL_PERSON_FISCAL_CONFIG: FiscalConfigSeedData = {
  legalName: 'Juan Pérez García',
  tradeName: 'Tienda Don Juan',
  nit: '79123456',
  nitVerificationDigit: '8',
  taxRegime: TaxRegime.SIMPLIFIED,
  personType: PersonType.NATURAL,
  fiscalResponsibilities: [
    FiscalResponsibility.R_99_NO_RESPONSABLE  // No responsable de IVA
  ],
  isRetentionAgent: false,
  isVATResponsible: false,
  vatDeclarationPeriod: VATDeclarationPeriod.QUARTERLY,
  fiscalAddress: 'Carrera 50 # 30-20',
  city: 'Bogotá',
  state: 'Cundinamarca',
  postalCode: '110111',
  phone: '+57 310 9876543',
  fiscalEmail: 'juanperez@example.com',
  ciiu: '4711',
  economicActivity: 'Comercio al por menor de abarrotes',
  useElectronicInvoicing: false,
  isConfigured: false
};

/**
 * Función para crear configuración fiscal de ejemplo para un tenant
 */
export async function seedFiscalConfig(
  dataSource: DataSource,
  tenantId: string,
  configType: 'juridica' | 'natural' = 'juridica'
): Promise<void> {
  const fiscalConfigRepo = dataSource.getRepository(FiscalConfig);

  console.log(`🏛️  Iniciando seed de configuración fiscal para tenant: ${tenantId}`);

  // Verificar si ya existe configuración para este tenant
  const existing = await fiscalConfigRepo.findOne({ where: { tenantId } });

  if (existing) {
    console.log(`⚠️  El tenant ya tiene configuración fiscal. Omitiendo seed.`);
    return;
  }

  // Seleccionar el template según el tipo
  const template = configType === 'juridica'
    ? DEFAULT_FISCAL_CONFIG
    : NATURAL_PERSON_FISCAL_CONFIG;

  // Crear la configuración
  const fiscalConfig = fiscalConfigRepo.create({
    ...template,
    tenantId,
    nextInvoiceNumber: 1,  // Inicializar contador de facturas
    hasRUT: false,
    isVerifiedByAccountant: false
  });

  await fiscalConfigRepo.save(fiscalConfig);

  console.log(`✅ Configuración fiscal creada exitosamente:`);
  console.log(`   - Razón Social: ${fiscalConfig.legalName}`);
  console.log(`   - NIT: ${fiscalConfig.nit}-${fiscalConfig.nitVerificationDigit}`);
  console.log(`   - Régimen: ${fiscalConfig.taxRegime}`);
  console.log(`   - Tipo: ${fiscalConfig.personType}`);
  console.log(`   - Responsable IVA: ${fiscalConfig.isVATResponsible ? 'Sí' : 'No'}`);
  console.log(`   - Facturación Electrónica: ${fiscalConfig.useElectronicInvoicing ? 'Sí' : 'No'}`);
  console.log(`   ⚠️  IMPORTANTE: Esta es una configuración de EJEMPLO. El usuario debe actualizarla.`);
}

/**
 * Función para crear configuración fiscal para TODOS los tenants
 */
export async function seedFiscalConfigForAllTenants(
  dataSource: DataSource,
  configType: 'juridica' | 'natural' = 'juridica'
): Promise<void> {
  const tenantRepo = dataSource.getRepository('Tenant');
  const tenants = await tenantRepo.find();

  console.log(`🏢 Encontrados ${tenants.length} tenants`);

  for (const tenant of tenants) {
    await seedFiscalConfig(dataSource, tenant.id, configType);
  }

  console.log(`🎉 Seed de configuración fiscal completado para todos los tenants`);
}

/**
 * Función helper para crear configuración fiscal personalizada
 */
export async function seedCustomFiscalConfig(
  dataSource: DataSource,
  tenantId: string,
  customConfig: Partial<FiscalConfigSeedData>
): Promise<void> {
  const fiscalConfigRepo = dataSource.getRepository(FiscalConfig);

  console.log(`🏛️  Creando configuración fiscal personalizada para tenant: ${tenantId}`);

  // Verificar si ya existe
  const existing = await fiscalConfigRepo.findOne({ where: { tenantId } });

  if (existing) {
    console.log(`⚠️  El tenant ya tiene configuración fiscal. Actualizando...`);
    Object.assign(existing, customConfig);
    await fiscalConfigRepo.save(existing);
    console.log(`✅ Configuración fiscal actualizada`);
    return;
  }

  // Crear nueva configuración con defaults + custom
  const config = fiscalConfigRepo.create({
    ...DEFAULT_FISCAL_CONFIG,
    ...customConfig,
    tenantId,
    nextInvoiceNumber: 1
  });

  await fiscalConfigRepo.save(config);
  console.log(`✅ Configuración fiscal personalizada creada`);
}
