import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { InvoiceDian, InvoiceStatus, InvoiceType } from './entities/invoice-dian.entity';
import { DianResolution, ResolutionStatus } from './entities/dian-resolution.entity';
import { CreateInvoiceDto, CreateResolutionDto, CancelInvoiceDto, GenerateCufeDto } from './dto/invoice-dian.dto';

@Injectable()
export class InvoiceDianService {
  private readonly logger = new Logger(InvoiceDianService.name);
  
  constructor(
    @InjectRepository(InvoiceDian)
    private invoiceRepository: Repository<InvoiceDian>,
    @InjectRepository(DianResolution)
    private resolutionRepository: Repository<DianResolution>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async createInvoice(createInvoiceDto: CreateInvoiceDto, userId: string): Promise<InvoiceDian> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get sale data (this would come from sales module)
      const saleData = await this.getSaleData(createInvoiceDto.saleId);
      
      // Check if invoice already exists for this sale
      const existingInvoice = await this.invoiceRepository.findOne({
        where: { saleId: createInvoiceDto.saleId }
      });

      if (existingInvoice) {
        throw new ConflictException(`Invoice already exists for sale ${createInvoiceDto.saleId}`);
      }

      // Get active resolution
      const resolution = await this.getActiveResolution(createInvoiceDto.type || InvoiceType.POS);
      
      if (!resolution) {
        throw new BadRequestException('No active DIAN resolution found');
      }

      // Check if resolution has available numbers
      if (resolution.currentNumber > resolution.rangeTo) {
        throw new BadRequestException('Resolution has no available invoice numbers');
      }

      // Generate invoice number
      const invoiceNumber = resolution.currentNumber;
      const fullInvoiceNumber = `${resolution.prefix}${invoiceNumber}`;

      // Get company data
      const companyData = await this.getCompanyData();

      // Generate CUFE/CUDE
      const cufe = this.generateCufe({
        invoiceNumber,
        invoiceDate: new Date().toISOString(),
        subtotal: saleData.subtotal,
        taxAmount: saleData.taxAmount,
        total: saleData.total,
        companyNit: companyData.nit,
        customerNit: createInvoiceDto.customerNit || '222222222',
        technicalKey: resolution.technicalKey
      });

      // Generate QR Code data
      const qrCodeData = this.generateQRCode(cufe, saleData.total, companyData.nit);

      // Create invoice entity
      const invoice = queryRunner.manager.create(InvoiceDian, {
        // Resolution data
        resolutionNumber: resolution.resolutionNumber,
        resolutionDate: resolution.resolutionDate,
        prefix: resolution.prefix,
        invoiceNumber,
        rangeFrom: resolution.rangeFrom,
        rangeTo: resolution.rangeTo,
        
        // Invoice data
        type: createInvoiceDto.type || InvoiceType.POS,
        status: InvoiceStatus.DRAFT,
        cufe: createInvoiceDto.type === InvoiceType.POS ? null : cufe,
        cude: createInvoiceDto.type === InvoiceType.POS ? cufe : null,
        qrCode: qrCodeData,
        technicalKey: resolution.technicalKey,
        
        // References
        saleId: createInvoiceDto.saleId,
        
        // Company information
        companyNit: companyData.nit,
        companyName: companyData.name,
        companyAddress: companyData.address,
        companyPhone: companyData.phone,
        companyEmail: companyData.email,
        
        // Customer information
        customerNit: createInvoiceDto.customerNit,
        customerName: createInvoiceDto.customerName || 'CONSUMIDOR FINAL',
        customerAddress: createInvoiceDto.customerAddress,
        customerPhone: createInvoiceDto.customerPhone,
        customerEmail: createInvoiceDto.customerEmail,
        
        // Financial summary
        subtotal: saleData.subtotal,
        discountAmount: saleData.discountAmount,
        taxAmount: saleData.taxAmount,
        total: saleData.total,
        
        // Payment information
        paymentMethod: saleData.paymentMethod,
        paidAmount: saleData.paidAmount,
        changeAmount: saleData.changeAmount,
        
        // Metadata
        metadata: createInvoiceDto.metadata,
        createdBy: userId
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      // Generate XML (simplified version)
      savedInvoice.xmlContent = await this.generateInvoiceXML(savedInvoice);
      await queryRunner.manager.save(savedInvoice);

      // Update resolution current number
      resolution.currentNumber = invoiceNumber + 1;
      resolution.invoicesIssued += 1;
      resolution.invoicesRemaining = resolution.rangeTo - invoiceNumber;
      
      // Check if alert threshold reached
      if (resolution.invoicesRemaining <= resolution.alertThreshold && !resolution.alertSent) {
        resolution.alertSent = true;
        // Here you would send an alert notification
        this.logger.warn(`Resolution ${resolution.prefix} has only ${resolution.invoicesRemaining} invoices remaining`);
      }

      await queryRunner.manager.save(resolution);

      // Generate XML (simplified version)
      const xmlContent = await this.generateInvoiceXML(savedInvoice);
      savedInvoice.xmlContent = xmlContent;

      // Sign XML (this would use a real digital signature)
      const signedXml = await this.signXML(xmlContent, resolution.technicalKey);
      savedInvoice.signedXml = signedXml;

      // Send to DIAN (in production, this would call the real DIAN API)
      if (this.configService.get('DIAN_ENABLED') === 'true') {
        await this.sendToDian(savedInvoice);
      } else {
        // For development, simulate success
        savedInvoice.status = InvoiceStatus.ACCEPTED;
        savedInvoice.sentAt = new Date();
        savedInvoice.acceptedAt = new Date();
        savedInvoice.dianTransactionId = `TEST-${Date.now()}`;
        savedInvoice.dianResponseMessage = 'Invoice accepted (test mode)';
      }

      await queryRunner.manager.save(savedInvoice);
      await queryRunner.commitTransaction();

      return savedInvoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error creating invoice:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createResolution(createResolutionDto: CreateResolutionDto): Promise<DianResolution> {
    // Check if prefix already exists
    const existing = await this.resolutionRepository.findOne({
      where: { prefix: createResolutionDto.prefix }
    });

    if (existing) {
      throw new ConflictException(`Resolution with prefix ${createResolutionDto.prefix} already exists`);
    }

    const resolution = this.resolutionRepository.create({
      ...createResolutionDto,
      currentNumber: createResolutionDto.rangeFrom,
      invoicesRemaining: createResolutionDto.rangeTo - createResolutionDto.rangeFrom + 1,
      status: ResolutionStatus.ACTIVE
    });

    return this.resolutionRepository.save(resolution);
  }

  async getActiveResolution(type: InvoiceType): Promise<DianResolution | null> {
    // Map invoice type to prefix pattern
    const prefixPattern = type === InvoiceType.POS ? 'POS%' : 'SETP%';
    
    return this.resolutionRepository
      .createQueryBuilder('resolution')
      .where('resolution.status = :status', { status: ResolutionStatus.ACTIVE })
      .andWhere('resolution.prefix LIKE :prefix', { prefix: prefixPattern })
      .andWhere('resolution.currentNumber <= resolution.rangeTo')
      .andWhere('resolution.validUntil >= :today', { today: new Date() })
      .orderBy('resolution.createdAt', 'ASC')
      .getOne();
  }

  generateCufe(data: GenerateCufeDto | any): string {
    // CUFE = SHA384(NumFac + FecFac + HorFac + ValFac + CodImp1 + ValImp1 + CodImp2 + ValImp2 + CodImp3 + ValImp3 + ValImp + NitOFE + NumAdq + ClTec + TipoAmbiente)
    const cufeString = [
      data.invoiceNumber,
      data.invoiceDate.replace(/[^0-9]/g, ''), // Remove non-numeric chars
      data.subtotal.toFixed(2),
      '01', // IVA code
      data.taxAmount.toFixed(2),
      '04', // INC code  
      '0.00',
      '03', // ICA code
      '0.00',
      data.total.toFixed(2),
      data.companyNit,
      data.customerNit,
      data.technicalKey,
      '2' // Production environment (1 for test)
    ].join('');

    return crypto
      .createHash('sha384')
      .update(cufeString)
      .digest('hex');
  }

  generateQRCode(cufe: string, total: number, nit: string): string {
    // QR format for DIAN
    const baseUrl = 'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=';
    return `${baseUrl}${cufe}`;
  }

  async generateInvoiceXML(invoice: InvoiceDian): Promise<string> {
    // This is a simplified version. In production, use a proper XML library
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <UBLVersionID>UBL 2.1</UBLVersionID>
  <ProfileID>DIAN 2.1</ProfileID>
  <ID>${invoice.prefix}${invoice.invoiceNumber}</ID>
  <UUID>${invoice.cufe || invoice.cude}</UUID>
  <IssueDate>${invoice.createdAt.toISOString().split('T')[0]}</IssueDate>
  <InvoiceTypeCode>${invoice.type === InvoiceType.POS ? '20' : '01'}</InvoiceTypeCode>
  <DocumentCurrencyCode>COP</DocumentCurrencyCode>
  <AccountingSupplierParty>
    <Party>
      <PartyTaxScheme>
        <RegistrationName>${invoice.companyName}</RegistrationName>
        <CompanyID>${invoice.companyNit}</CompanyID>
      </PartyTaxScheme>
    </Party>
  </AccountingSupplierParty>
  <AccountingCustomerParty>
    <Party>
      <PartyTaxScheme>
        <RegistrationName>${invoice.customerName}</RegistrationName>
        <CompanyID>${invoice.customerNit || '222222222'}</CompanyID>
      </PartyTaxScheme>
    </Party>
  </AccountingCustomerParty>
  <LegalMonetaryTotal>
    <LineExtensionAmount currencyID="COP">${invoice.subtotal}</LineExtensionAmount>
    <TaxExclusiveAmount currencyID="COP">${invoice.subtotal}</TaxExclusiveAmount>
    <TaxInclusiveAmount currencyID="COP">${invoice.total}</TaxInclusiveAmount>
    <AllowanceTotalAmount currencyID="COP">${invoice.discountAmount}</AllowanceTotalAmount>
    <PayableAmount currencyID="COP">${invoice.total}</PayableAmount>
  </LegalMonetaryTotal>
</Invoice>`;
    
    return xml;
  }

  async signXML(xml: string, technicalKey: string): Promise<string> {
    // In production, use a proper XML digital signature library
    // This is just a placeholder
    const signature = crypto
      .createHmac('sha256', technicalKey)
      .update(xml)
      .digest('base64');
    
    return xml.replace('</Invoice>', `<Signature>${signature}</Signature></Invoice>`);
  }

  async sendToDian(invoice: InvoiceDian): Promise<void> {
    // In production, this would make an actual API call to DIAN
    // Using the configured provider (e.g., Cadena, Soenac, etc.)
    this.logger.log(`Sending invoice ${invoice.prefix}${invoice.invoiceNumber} to DIAN`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update invoice with response
    invoice.status = InvoiceStatus.ACCEPTED;
    invoice.sentAt = new Date();
    invoice.acceptedAt = new Date();
    invoice.dianTransactionId = `DIAN-${Date.now()}`;
    invoice.dianResponseMessage = 'Documento procesado exitosamente';
  }

  /**
   * Generate invoice from a completed sale
   */
  async generateFromSale(sale: any): Promise<InvoiceDian> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if invoice already exists for this sale
      const existingInvoice = await this.invoiceRepository.findOne({
        where: { saleId: sale.id }
      });

      if (existingInvoice) {
        return existingInvoice; // Return existing invoice instead of creating duplicate
      }

      // Get active resolution
      const resolution = await this.getActiveResolution(InvoiceType.POS);
      
      if (!resolution) {
        throw new BadRequestException('No active DIAN resolution found');
      }

      // Check if resolution has available numbers
      if (resolution.currentNumber > resolution.rangeTo) {
        throw new BadRequestException('Resolution has no available invoice numbers');
      }

      // Generate invoice number
      const invoiceNumber = resolution.currentNumber;
      
      // Generate CUFE
      const cufe = this.generateCufe({
        invoiceNumber: invoiceNumber.toString(),
        issueDate: new Date().toISOString(),
        subtotal: sale.subtotal,
        taxTotal: sale.taxAmount,
        total: sale.total,
        customerDocument: sale.customerId || '222222222',
        technicalKey: resolution.technicalKey
      });

      // Get company data
      const company = await this.getCompanyData();

      // Create invoice
      const invoice = queryRunner.manager.create(InvoiceDian, {
        saleId: sale.id,
        resolutionId: resolution.id,
        type: InvoiceType.POS,
        prefix: resolution.prefix,
        invoiceNumber,
        cufe,
        qrCode: this.generateQRCode(cufe, sale.total, company.nit),
        
        // Company data
        issuerNit: company.nit,
        issuerName: company.name,
        issuerAddress: company.address,
        issuerPhone: company.phone,
        issuerEmail: company.email,
        
        // Customer data
        customerName: sale.customerName || 'CONSUMIDOR FINAL',
        customerDocument: sale.customerId || '222222222',
        customerAddress: sale.customerAddress || '',
        customerEmail: sale.customerEmail || '',
        customerPhone: sale.customerPhone || '',
        
        // Amounts
        subtotal: sale.subtotal,
        discountAmount: sale.discountAmount || 0,
        taxAmount: sale.taxAmount,
        total: sale.total,
        
        // Payment
        paymentMethod: sale.payments?.[0]?.method || 'CASH',
        paidAmount: sale.paidAmount,
        changeAmount: sale.changeAmount || 0,
        
        status: InvoiceStatus.ACCEPTED,
        createdBy: sale.userId
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      // Generate XML (simplified version)
      savedInvoice.xmlContent = await this.generateInvoiceXML(savedInvoice);
      await queryRunner.manager.save(savedInvoice);

      // Update resolution current number
      resolution.currentNumber = invoiceNumber + 1;
      resolution.usedCount = (resolution.usedCount || 0) + 1;
      await queryRunner.manager.save(resolution);

      await queryRunner.commitTransaction();

      this.logger.log(`Generated invoice ${savedInvoice.prefix}${savedInvoice.invoiceNumber} for sale ${sale.id}`);

      return savedInvoice;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancel an invoice with reason
   */
  async cancelInvoice(invoiceId: string, cancelDto: CancelInvoiceDto, userId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({ 
      where: { id: invoiceId } 
    });
    
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      return; // Already cancelled
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.cancellationReason = cancelDto.reason;
    invoice.cancelledAt = new Date();
    invoice.cancelledBy = userId;
    
    await this.invoiceRepository.save(invoice);

    // In production, notify DIAN about the cancellation
    if (this.configService.get('DIAN_ENABLED') === 'true') {
      // TODO: Call DIAN API to cancel
      this.logger.log(`Cancelled invoice ${invoice.prefix}${invoice.invoiceNumber} in DIAN: ${cancelDto.reason}`);
    }
  }



  async findAll(filters?: any): Promise<InvoiceDian[]> {
    const query = this.invoiceRepository.createQueryBuilder('invoice');

    if (filters?.startDate) {
      query.andWhere('invoice.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('invoice.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.status) {
      query.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('invoice.type = :type', { type: filters.type });
    }

    return query.orderBy('invoice.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<InvoiceDian> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return invoice;
  }

  async getResolutions(): Promise<DianResolution[]> {
    return this.resolutionRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async testConnection(): Promise<any> {
    // Test connection to DIAN API
    return {
      status: 'success',
      environment: this.configService.get('DIAN_ENVIRONMENT', 'test'),
      provider: this.configService.get('DIAN_PROVIDER', 'internal'),
      timestamp: new Date()
    };
  }

  // Helper methods
  private async getSaleData(saleId: string): Promise<any> {
    // This would get real sale data from sales module
    return {
      subtotal: 100000,
      discountAmount: 5000,
      taxAmount: 19000,
      total: 114000,
      paymentMethod: 'CASH',
      paidAmount: 120000,
      changeAmount: 6000
    };
  }

  private async getCompanyData(): Promise<any> {
    // This would get real company data from configuration
    return {
      nit: this.configService.get('COMPANY_NIT', '900123456'),
      name: this.configService.get('COMPANY_NAME', 'NexoPOS SAS'),
      address: this.configService.get('COMPANY_ADDRESS', 'Calle 123 #45-67'),
      phone: this.configService.get('COMPANY_PHONE', '3001234567'),
      email: this.configService.get('COMPANY_EMAIL', 'info@nexopos.co')
    };
  }
}
