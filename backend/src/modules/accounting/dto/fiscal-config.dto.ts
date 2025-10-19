import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean, IsArray, IsEmail, IsNumber } from 'class-validator';
import {
  TaxRegime,
  PersonType,
  FiscalResponsibility,
  VATDeclarationPeriod
} from '../entities/fiscal-config.entity';

export class CreateFiscalConfigDto {
  @ApiProperty({
    description: 'Régimen tributario',
    enum: TaxRegime,
    example: TaxRegime.COMMON
  })
  @IsEnum(TaxRegime)
  @IsNotEmpty()
  taxRegime: TaxRegime;

  @ApiProperty({
    description: 'Tipo de persona',
    enum: PersonType,
    example: PersonType.NATURAL
  })
  @IsEnum(PersonType)
  @IsNotEmpty()
  personType: PersonType;

  @ApiProperty({
    description: 'NIT de la empresa',
    example: '900123456'
  })
  @IsString()
  @IsNotEmpty()
  nit: string;

  @ApiProperty({
    description: 'Dígito de verificación del NIT',
    example: '7',
    required: false
  })
  @IsString()
  @IsOptional()
  nitVerificationDigit?: string;

  @ApiProperty({
    description: 'Razón social o nombre completo',
    example: 'Comercializadora XYZ S.A.S'
  })
  @IsString()
  @IsNotEmpty()
  legalName: string;

  @ApiProperty({
    description: 'Nombre comercial',
    example: 'Tienda XYZ',
    required: false
  })
  @IsString()
  @IsOptional()
  tradeName?: string;

  @ApiProperty({
    description: 'Dirección fiscal',
    example: 'Calle 123 # 45-67'
  })
  @IsString()
  @IsNotEmpty()
  fiscalAddress: string;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Medellín'
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Departamento',
    example: 'Antioquia'
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'Código postal',
    example: '050001',
    required: false
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+57 300 1234567',
    required: false
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Email fiscal',
    example: 'contabilidad@empresa.com',
    required: false
  })
  @IsEmail()
  @IsOptional()
  fiscalEmail?: string;

  @ApiProperty({
    description: 'Responsabilidades fiscales',
    enum: FiscalResponsibility,
    isArray: true,
    example: [FiscalResponsibility.R_01_IVA, FiscalResponsibility.R_02_RETEFUENTE]
  })
  @IsArray()
  @IsEnum(FiscalResponsibility, { each: true })
  @IsNotEmpty()
  fiscalResponsibilities: FiscalResponsibility[];

  @ApiProperty({
    description: 'Es agente retenedor',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isRetentionAgent?: boolean;

  @ApiProperty({
    description: 'Es responsable de IVA',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isVATResponsible?: boolean;

  @ApiProperty({
    description: 'Período de declaración de IVA',
    enum: VATDeclarationPeriod,
    example: VATDeclarationPeriod.BIMONTHLY,
    required: false
  })
  @IsEnum(VATDeclarationPeriod)
  @IsOptional()
  vatDeclarationPeriod?: VATDeclarationPeriod;

  @ApiProperty({
    description: 'Código CIIU',
    example: '4711',
    required: false
  })
  @IsString()
  @IsOptional()
  ciiu?: string;

  @ApiProperty({
    description: 'Descripción de la actividad económica',
    example: 'Comercio al por menor en establecimientos no especializados',
    required: false
  })
  @IsString()
  @IsOptional()
  economicActivity?: string;

  @ApiProperty({
    description: 'Usa facturación electrónica',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  useElectronicInvoicing?: boolean;

  @ApiProperty({
    description: 'Nombre del contador',
    required: false
  })
  @IsString()
  @IsOptional()
  accountantName?: string;

  @ApiProperty({
    description: 'Tarjeta profesional del contador',
    required: false
  })
  @IsString()
  @IsOptional()
  accountantProfessionalCard?: string;
}

export class UpdateFiscalConfigDto {
  @ApiProperty({ enum: TaxRegime, required: false })
  @IsEnum(TaxRegime)
  @IsOptional()
  taxRegime?: TaxRegime;

  @ApiProperty({ enum: PersonType, required: false })
  @IsEnum(PersonType)
  @IsOptional()
  personType?: PersonType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nit?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fiscalAddress?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsEnum(FiscalResponsibility, { each: true })
  @IsOptional()
  fiscalResponsibilities?: FiscalResponsibility[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isRetentionAgent?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isVATResponsible?: boolean;

  @ApiProperty({ enum: VATDeclarationPeriod, required: false })
  @IsEnum(VATDeclarationPeriod)
  @IsOptional()
  vatDeclarationPeriod?: VATDeclarationPeriod;
}

export class FiscalConfigResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TaxRegime })
  taxRegime: TaxRegime;

  @ApiProperty({ enum: PersonType })
  personType: PersonType;

  @ApiProperty()
  nit: string;

  @ApiProperty()
  legalName: string;

  @ApiProperty()
  fiscalAddress: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty({ isArray: true, enum: FiscalResponsibility })
  fiscalResponsibilities: FiscalResponsibility[];

  @ApiProperty()
  isRetentionAgent: boolean;

  @ApiProperty()
  isVATResponsible: boolean;

  @ApiProperty({ enum: VATDeclarationPeriod })
  vatDeclarationPeriod: VATDeclarationPeriod;

  @ApiProperty()
  isConfigured: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Alias para compatibilidad con el servicio
export type FiscalConfigDto = CreateFiscalConfigDto;
