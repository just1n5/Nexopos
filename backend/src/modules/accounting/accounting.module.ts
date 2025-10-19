import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';

// Accounting Entities
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { Expense } from './entities/expense.entity';
import { TaxWithholding } from './entities/tax-withholding.entity';
import { FiscalConfig } from './entities/fiscal-config.entity';

// External Entities (necesarias para los servicios)
import { Sale } from '../sales/entities/sale.entity';

// Services
import { ChartOfAccountsService } from './services/chart-of-accounts.service';
import { JournalEntryService } from './services/journal-entry.service';
import { ExpenseService } from './services/expense.service';
import { TaxCalculationService } from './services/tax-calculation.service';
import { AccountingReportsService } from './services/accounting-reports.service';
import { FiscalConfigService } from './services/fiscal-config.service';

/**
 * Módulo de Contabilidad
 *
 * Implementa "Contabilidad Invisible" - El usuario nunca ve códigos PUC
 * Solo interactúa con iconos y lenguaje de negocio
 *
 * Características:
 * - Asientos contables automáticos en cada transacción
 * - Dashboard con 5 widgets clave
 * - Reportes fiscales (IVA, ReteFuente)
 * - Gestión de gastos con OCR de facturas
 * - Cumplimiento normativo colombiano
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Entidades del módulo de accounting
      ChartOfAccounts,
      JournalEntry,
      JournalEntryLine,
      Expense,
      TaxWithholding,
      FiscalConfig,
      // Entidades externas necesarias
      Sale
    ])
  ],
  controllers: [AccountingController],
  providers: [
    AccountingService,
    ChartOfAccountsService,
    JournalEntryService,
    ExpenseService,
    TaxCalculationService,
    AccountingReportsService,
    FiscalConfigService
  ],
  exports: [
    // Exportar servicios para uso en otros módulos
    ChartOfAccountsService,
    JournalEntryService,
    ExpenseService,
    TaxCalculationService,
    AccountingReportsService,
    FiscalConfigService
  ]
})
export class AccountingModule {}
