import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalConfig, TaxRegime, IVAResponsibility } from '../entities/fiscal-config.entity';
import { FiscalConfigDto } from '../dto/fiscal-config.dto';

/**
 * Servicio para gestión de configuración fiscal del negocio
 *
 * Responsabilidades:
 * - Gestionar datos fiscales de la empresa (NIT, razón social, etc.)
 * - Configurar régimen tributario y responsabilidades
 * - Manejar parámetros de retenciones
 * - Configurar resoluciones de facturación DIAN
 * - Validar configuración fiscal completa
 */
@Injectable()
export class FiscalConfigService {
  constructor(
    @InjectRepository(FiscalConfig)
    private fiscalConfigRepository: Repository<FiscalConfig>
  ) {}

  /**
   * ========================================
   * OBTENER CONFIGURACIÓN FISCAL
   * ========================================
   */
  async findByTenant(tenantId: string): Promise<FiscalConfig | null> {
    return this.fiscalConfigRepository.findOne({
      where: { tenantId }
    });
  }

  /**
   * Obtener configuración fiscal o lanzar error si no existe
   */
  async getConfigOrFail(tenantId: string): Promise<FiscalConfig> {
    const config = await this.findByTenant(tenantId);

    if (!config) {
      throw new NotFoundException(
        'No se ha configurado la información fiscal del negocio. ' +
        'Por favor configure los datos fiscales en Configuración.'
      );
    }

    return config;
  }

  /**
   * ========================================
   * CREAR O ACTUALIZAR CONFIGURACIÓN
   * ========================================
   */
  async upsert(
    tenantId: string,
    configData: FiscalConfigDto
  ): Promise<FiscalConfig> {
    // Validar datos fiscales
    this.validateFiscalData(configData);

    const existing = await this.findByTenant(tenantId);

    if (existing) {
      // Actualizar configuración existente
      Object.assign(existing, configData);
      return this.fiscalConfigRepository.save(existing);
    } else {
      // Crear nueva configuración
      const newConfig = this.fiscalConfigRepository.create({
        ...configData,
        tenantId
      });
      return this.fiscalConfigRepository.save(newConfig);
    }
  }

  /**
   * ========================================
   * ACTUALIZACIÓN PARCIAL
   * ========================================
   */
  async updatePartial(
    tenantId: string,
    updates: Partial<FiscalConfigDto>
  ): Promise<FiscalConfig> {
    const config = await this.getConfigOrFail(tenantId);

    Object.assign(config, updates);

    return this.fiscalConfigRepository.save(config);
  }

  /**
   * ========================================
   * CONFIGURACIÓN DE RETENCIONES
   * ========================================
   */

  /**
   * Verifica si el negocio debe practicar retención en la fuente
   * Depende del régimen y tipo de proveedor
   */
  shouldWithholdReteFuente(
    tenantId: string,
    supplierIsGranContribuyente: boolean,
    purchaseAmount: number
  ): boolean {
    // Simplificación: Los gran contribuyentes deben retener
    // En la práctica depende de la UVT y el concepto
    return supplierIsGranContribuyente && purchaseAmount >= 0;
  }

  /**
   * Calcula el porcentaje de retención en la fuente a aplicar
   */
  getReteFuentePercentage(
    tenantId: string,
    expenseType: string
  ): number {
    // Porcentajes simplificados por tipo de gasto
    const rates: Record<string, number> = {
      'PROFESSIONAL_SERVICES': 10,  // Servicios profesionales 10%
      'RENT': 3.5,                   // Arrendamientos 3.5%
      'INVENTORY_PURCHASE': 2.5,     // Compras 2.5%
      'OTHER': 4                     // Otros servicios 4%
    };

    return rates[expenseType] || 0;
  }

  /**
   * Calcula si debe practicar retención de IVA
   */
  shouldWithholdReteIVA(
    tenantId: string,
    supplierTaxRegime: string,
    ivaAmount: number
  ): boolean {
    // Retención de IVA: 15% del IVA en régimen simplificado
    return supplierTaxRegime === 'SIMPLIFIED' && ivaAmount > 0;
  }

  /**
   * ========================================
   * CONFIGURACIÓN DE FACTURACIÓN DIAN
   * ========================================
   */

  /**
   * Actualizar resolución de facturación DIAN
   */
  async updateInvoiceResolution(
    tenantId: string,
    resolutionData: {
      resolutionNumber: string;
      resolutionDate: Date;
      technicalKey: string;
      prefixInvoice: string;
      fromInvoice: number;
      toInvoice: number;
      validUntil: Date;
      testSetId?: string;
    }
  ): Promise<FiscalConfig> {
    const config = await this.getConfigOrFail(tenantId);

    Object.assign(config, resolutionData);

    return this.fiscalConfigRepository.save(config);
  }

  /**
   * Verificar si la numeración de facturación está agotada
   */
  async isInvoiceNumberingExhausted(tenantId: string): Promise<boolean> {
    const config = await this.getConfigOrFail(tenantId);

    if (!config.currentInvoiceNumber || !config.toInvoice) {
      return false;
    }

    return config.currentInvoiceNumber >= config.toInvoice;
  }

  /**
   * Verificar si la resolución de facturación está vencida
   */
  async isResolutionExpired(tenantId: string): Promise<boolean> {
    const config = await this.getConfigOrFail(tenantId);

    if (!config.validUntil) {
      return false;
    }

    return new Date() > config.validUntil;
  }

  /**
   * Obtener siguiente número de factura y actualizarlo
   */
  async getNextInvoiceNumber(tenantId: string): Promise<string> {
    const config = await this.getConfigOrFail(tenantId);

    // Validar que la resolución no esté vencida
    if (await this.isResolutionExpired(tenantId)) {
      throw new BadRequestException(
        'La resolución de facturación DIAN está vencida. ' +
        'Por favor actualice la resolución antes de continuar facturando.'
      );
    }

    // Validar que no se haya agotado la numeración
    if (await this.isInvoiceNumberingExhausted(tenantId)) {
      throw new BadRequestException(
        'Se ha agotado la numeración de facturas autorizada por la DIAN. ' +
        'Por favor solicite una nueva resolución.'
      );
    }

    // Obtener número actual o iniciar desde el fromInvoice
    const currentNumber = config.currentInvoiceNumber || config.fromInvoice || 1;
    const nextNumber = currentNumber + 1;

    // Actualizar en la base de datos
    config.currentInvoiceNumber = nextNumber;
    await this.fiscalConfigRepository.save(config);

    // Formatear con prefijo
    const prefix = config.prefixInvoice || 'FE';
    return `${prefix}${nextNumber.toString().padStart(10, '0')}`;
  }

  /**
   * ========================================
   * VALIDACIONES
   * ========================================
   */

  /**
   * Validar que la configuración fiscal esté completa
   */
  async validateCompleteConfig(tenantId: string): Promise<{
    isComplete: boolean;
    missingFields: string[];
  }> {
    const config = await this.findByTenant(tenantId);

    if (!config) {
      return {
        isComplete: false,
        missingFields: ['Toda la configuración fiscal']
      };
    }

    const missingFields: string[] = [];

    // Campos obligatorios básicos
    if (!config.businessName) missingFields.push('Razón social');
    if (!config.nit) missingFields.push('NIT');
    if (!config.taxRegime) missingFields.push('Régimen tributario');
    if (!config.ivaResponsibility) missingFields.push('Responsabilidad de IVA');

    // Campos para facturación electrónica
    if (config.enableElectronicInvoicing) {
      if (!config.resolutionNumber) missingFields.push('Número de resolución DIAN');
      if (!config.technicalKey) missingFields.push('Clave técnica');
      if (!config.prefixInvoice) missingFields.push('Prefijo de facturación');
      if (!config.fromInvoice) missingFields.push('Numeración desde');
      if (!config.toInvoice) missingFields.push('Numeración hasta');
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Validar datos fiscales básicos
   */
  private validateFiscalData(data: FiscalConfigDto): void {
    // Validar NIT
    if (data.nit && !this.isValidNIT(data.nit)) {
      throw new BadRequestException('El NIT proporcionado no es válido');
    }

    // Validar email
    if (data.email && !this.isValidEmail(data.email)) {
      throw new BadRequestException('El email proporcionado no es válido');
    }

    // Validar teléfono
    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new BadRequestException('El teléfono proporcionado no es válido');
    }

    // Validar numeración de facturación
    if (data.fromInvoice && data.toInvoice) {
      if (data.fromInvoice >= data.toInvoice) {
        throw new BadRequestException(
          'La numeración inicial debe ser menor a la numeración final'
        );
      }
    }
  }

  /**
   * ========================================
   * UTILIDADES DE VALIDACIÓN
   * ========================================
   */

  private isValidNIT(nit: string): boolean {
    // Remover guiones y espacios
    const cleanNit = nit.replace(/[-\s]/g, '');

    // NIT debe tener entre 9 y 10 dígitos
    if (!/^\d{9,10}$/.test(cleanNit)) {
      return false;
    }

    // TODO: Implementar algoritmo de validación de dígito de verificación
    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Teléfono colombiano: 10 dígitos o 7 dígitos fijos
    const cleanPhone = phone.replace(/[-\s()]/g, '');
    return /^[0-9]{7,10}$/.test(cleanPhone);
  }

  /**
   * ========================================
   * INFORMACIÓN PARA DASHBOARD
   * ========================================
   */

  /**
   * Obtener resumen de configuración fiscal
   */
  async getFiscalSummary(tenantId: string): Promise<{
    businessName: string;
    nit: string;
    taxRegime: TaxRegime;
    ivaResponsibility: IVAResponsibility;
    electronicInvoicingEnabled: boolean;
    resolutionValid: boolean;
    numberingExhausted: boolean;
    currentInvoiceNumber?: number;
    remainingInvoices?: number;
  }> {
    const config = await this.getConfigOrFail(tenantId);

    const resolutionValid = !(await this.isResolutionExpired(tenantId));
    const numberingExhausted = await this.isInvoiceNumberingExhausted(tenantId);

    let remainingInvoices: number | undefined;
    if (config.currentInvoiceNumber && config.toInvoice) {
      remainingInvoices = config.toInvoice - config.currentInvoiceNumber;
    }

    return {
      businessName: config.businessName,
      nit: config.nit,
      taxRegime: config.taxRegime,
      ivaResponsibility: config.ivaResponsibility,
      electronicInvoicingEnabled: config.enableElectronicInvoicing,
      resolutionValid,
      numberingExhausted,
      currentInvoiceNumber: config.currentInvoiceNumber,
      remainingInvoices
    };
  }
}
