const { Client } = require('pg');

// Leer DATABASE_URL del entorno (Dokku lo inyecta automáticamente)
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

async function createAccountingTables() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // ========================================
    // 1. CREAR ENUMS
    // ========================================
    console.log('📋 Paso 1: Crear ENUMs...\n');

    const enums = [
      {
        name: 'expense_type_enum',
        values: ['INVENTORY_PURCHASE', 'RENT', 'UTILITIES', 'INTERNET_PHONE', 'PAYROLL', 'PROFESSIONAL_SERVICES', 'INSURANCE', 'MAINTENANCE', 'TRAVEL', 'ADVERTISING', 'OFFICE_SUPPLIES', 'TAXES_FEES', 'OTHER']
      },
      {
        name: 'expense_status_enum',
        values: ['DRAFT', 'PENDING', 'PAID', 'CANCELLED']
      },
      {
        name: 'expense_payment_method_enum',
        values: ['CASH', 'BANK', 'CARD', 'TRANSFER', 'CREDIT']
      },
      {
        name: 'account_nature_enum',
        values: ['DEBIT', 'CREDIT']
      },
      {
        name: 'account_type_enum',
        values: ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'COST']
      },
      {
        name: 'withholding_type_enum',
        values: ['RETEFTE', 'RETEIVA', 'RETEICA']
      },
      {
        name: 'withholding_concept_enum',
        values: ['COMPRAS', 'SERVICIOS_DECLARANTE', 'SERVICIOS_NO_DECLARANTE', 'HONORARIOS_JURIDICA', 'HONORARIOS_NATURAL', 'ARRENDAMIENTO', 'RENDIMIENTOS_FINANCIEROS', 'OTROS']
      },
      {
        name: 'withholding_direction_enum',
        values: ['RECEIVED', 'PRACTICED']
      },
      {
        name: 'tax_regime_enum',
        values: ['SIMPLIFIED', 'COMMON', 'SPECIAL', 'GRANDES_CONTRIBUYENTES']
      },
      {
        name: 'vat_declaration_period_enum',
        values: ['MONTHLY', 'BIMONTHLY', 'QUARTERLY']
      },
      {
        name: 'person_type_enum',
        values: ['NATURAL', 'JURIDICA']
      },
      {
        name: 'fiscal_responsibility_enum',
        values: ['R-01-IVA', 'R-02-RETEFUENTE', 'R-03-RETEIVA', 'R-04-RETEICA', 'R-07-REGIMEN-SIMPLE', 'R-99-NO-RESPONSABLE']
      },
      {
        name: 'journal_entry_status_enum',
        values: ['DRAFT', 'CONFIRMED', 'CANCELLED']
      },
      {
        name: 'journal_entry_type_enum',
        values: ['SALE', 'SALE_CREDIT', 'SALE_REFUND', 'PURCHASE', 'EXPENSE', 'PAYMENT_RECEIVED', 'PAYMENT_MADE', 'CASH_REGISTER_OPEN', 'CASH_REGISTER_CLOSE', 'CASH_DEPOSIT', 'CASH_WITHDRAWAL', 'ADJUSTMENT', 'OPENING_BALANCE', 'CLOSING', 'OTHER']
      },
      {
        name: 'movement_type_enum',
        values: ['DEBIT', 'CREDIT']
      }
    ];

    for (const enumDef of enums) {
      const checkQuery = `
        SELECT EXISTS (
          SELECT 1 FROM pg_type
          WHERE typname = $1
        );
      `;
      const result = await client.query(checkQuery, [enumDef.name]);

      if (!result.rows[0].exists) {
        const values = enumDef.values.map(v => `'${v}'`).join(', ');
        await client.query(`CREATE TYPE ${enumDef.name} AS ENUM (${values});`);
        console.log(`   ✅ Enum creado: ${enumDef.name}`);
      } else {
        console.log(`   ℹ️  Enum ya existe: ${enumDef.name}`);
      }
    }

    console.log('\n📋 Paso 2: Crear Tablas...\n');

    // ========================================
    // 2. TABLA: chart_of_accounts
    // ========================================
    const chartOfAccountsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'chart_of_accounts'
      );
    `);

    if (!chartOfAccountsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE chart_of_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(10) NOT NULL,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          nature account_nature_enum NOT NULL,
          type account_type_enum NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "parentAccountId" UUID,
          level INTEGER DEFAULT 4,
          "tenantId" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_parent_account FOREIGN KEY ("parentAccountId") REFERENCES chart_of_accounts(id),
          CONSTRAINT fk_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id)
        );

        CREATE UNIQUE INDEX idx_chart_tenant_code ON chart_of_accounts("tenantId", code);
        CREATE INDEX idx_chart_tenant_active ON chart_of_accounts("tenantId", "isActive");
        CREATE INDEX idx_chart_tenant ON chart_of_accounts("tenantId");
      `);
      console.log('   ✅ Tabla creada: chart_of_accounts');
    } else {
      console.log('   ℹ️  Tabla ya existe: chart_of_accounts');
    }

    // ========================================
    // 3. TABLA: fiscal_configs
    // ========================================
    const fiscalConfigsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'fiscal_configs'
      );
    `);

    if (!fiscalConfigsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE fiscal_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "taxRegime" tax_regime_enum DEFAULT 'COMMON',
          "personType" person_type_enum DEFAULT 'NATURAL',
          nit VARCHAR(20) NOT NULL,
          "nitVerificationDigit" VARCHAR(1),
          "legalName" VARCHAR(200) NOT NULL,
          "tradeName" VARCHAR(200),
          "fiscalAddress" VARCHAR(300) NOT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(100) NOT NULL,
          "postalCode" VARCHAR(20),
          phone VARCHAR(50),
          "fiscalEmail" VARCHAR(200),
          "fiscalResponsibilities" TEXT NOT NULL,
          "isRetentionAgent" BOOLEAN DEFAULT false,
          "retentionAgentSince" DATE,
          "isVATResponsible" BOOLEAN DEFAULT true,
          "vatDeclarationPeriod" vat_declaration_period_enum DEFAULT 'BIMONTHLY',
          ciiu VARCHAR(10),
          "economicActivity" VARCHAR(300),
          "hasRUT" BOOLEAN DEFAULT false,
          "rutDocumentUrl" TEXT,
          "useElectronicInvoicing" BOOLEAN DEFAULT false,
          "electronicInvoiceProvider" VARCHAR(100),
          "dianResolutionNumber" VARCHAR(100),
          "dianResolutionDate" DATE,
          "invoiceRangeFrom" BIGINT,
          "invoiceRangeTo" BIGINT,
          "invoicePrefix" VARCHAR(10),
          "nextInvoiceNumber" BIGINT DEFAULT 1,
          "legalRepresentative" VARCHAR(200),
          "legalRepresentativeId" VARCHAR(20),
          "accountantName" VARCHAR(200),
          "accountantProfessionalCard" VARCHAR(50),
          "fiscalYearStart" INTEGER,
          "additionalConfig" JSONB,
          "isConfigured" BOOLEAN DEFAULT false,
          "isVerifiedByAccountant" BOOLEAN DEFAULT false,
          "verifiedAt" TIMESTAMP,
          "tenantId" UUID UNIQUE NOT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id)
        );

        CREATE UNIQUE INDEX idx_fiscal_tenant ON fiscal_configs("tenantId");
      `);
      console.log('   ✅ Tabla creada: fiscal_configs');
    } else {
      console.log('   ℹ️  Tabla ya existe: fiscal_configs');
    }

    // ========================================
    // 4. TABLA: journal_entries
    // ========================================
    const journalEntriesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'journal_entries'
      );
    `);

    if (!journalEntriesExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE journal_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "entryNumber" VARCHAR UNIQUE NOT NULL,
          "entryDate" DATE NOT NULL,
          type journal_entry_type_enum NOT NULL,
          status journal_entry_status_enum DEFAULT 'CONFIRMED',
          description VARCHAR(500) NOT NULL,
          "referenceId" UUID,
          "referenceType" VARCHAR(50),
          "referenceNumber" VARCHAR(100),
          "totalDebits" DECIMAL(15,2) DEFAULT 0,
          "totalCredits" DECIMAL(15,2) DEFAULT 0,
          "isBalanced" BOOLEAN DEFAULT true,
          notes TEXT,
          "createdBy" UUID NOT NULL,
          "confirmedBy" UUID,
          "confirmedAt" TIMESTAMP,
          "cancelledBy" UUID,
          "cancelledAt" TIMESTAMP,
          "cancellationReason" VARCHAR(500),
          "reversalEntryId" UUID,
          "tenantId" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_created_by FOREIGN KEY ("createdBy") REFERENCES users(id),
          CONSTRAINT fk_confirmed_by FOREIGN KEY ("confirmedBy") REFERENCES users(id),
          CONSTRAINT fk_cancelled_by FOREIGN KEY ("cancelledBy") REFERENCES users(id),
          CONSTRAINT fk_reversal_entry FOREIGN KEY ("reversalEntryId") REFERENCES journal_entries(id),
          CONSTRAINT fk_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id)
        );

        CREATE INDEX idx_journal_tenant_date ON journal_entries("tenantId", "entryDate");
        CREATE INDEX idx_journal_tenant_status ON journal_entries("tenantId", status);
        CREATE INDEX idx_journal_tenant_type ON journal_entries("tenantId", type);
        CREATE INDEX idx_journal_reference ON journal_entries("referenceId", "referenceType");
        CREATE INDEX idx_journal_tenant ON journal_entries("tenantId");
      `);
      console.log('   ✅ Tabla creada: journal_entries');
    } else {
      console.log('   ℹ️  Tabla ya existe: journal_entries');
    }

    // ========================================
    // 5. TABLA: journal_entry_lines
    // ========================================
    const journalLinesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'journal_entry_lines'
      );
    `);

    if (!journalLinesExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE journal_entry_lines (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "journalEntryId" UUID NOT NULL,
          "accountId" UUID NOT NULL,
          "movementType" movement_type_enum NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          description VARCHAR(500),
          "lineOrder" INTEGER DEFAULT 0,
          "referenceId" UUID,
          "referenceType" VARCHAR(50),
          "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_journal_entry FOREIGN KEY ("journalEntryId") REFERENCES journal_entries(id) ON DELETE CASCADE,
          CONSTRAINT fk_account FOREIGN KEY ("accountId") REFERENCES chart_of_accounts(id)
        );

        CREATE INDEX idx_line_journal ON journal_entry_lines("journalEntryId");
        CREATE INDEX idx_line_account ON journal_entry_lines("accountId");
      `);
      console.log('   ✅ Tabla creada: journal_entry_lines');
    } else {
      console.log('   ℹ️  Tabla ya existe: journal_entry_lines');
    }

    // ========================================
    // 6. TABLA: expenses
    // ========================================
    const expensesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'expenses'
      );
    `);

    if (!expensesExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "expenseNumber" VARCHAR UNIQUE NOT NULL,
          type expense_type_enum NOT NULL,
          status expense_status_enum DEFAULT 'PENDING',
          "expenseDate" DATE NOT NULL,
          "supplierName" VARCHAR(200),
          "supplierNit" VARCHAR(20),
          "invoiceNumber" VARCHAR(100),
          subtotal DECIMAL(12,2) NOT NULL,
          "taxAmount" DECIMAL(12,2) DEFAULT 0,
          total DECIMAL(12,2) NOT NULL,
          "paymentMethod" expense_payment_method_enum NOT NULL,
          "paymentDate" DATE,
          description TEXT,
          "invoiceImageUrl" TEXT,
          "ocrData" JSONB,
          "isOcrExtracted" BOOLEAN DEFAULT false,
          "wasManuallyEdited" BOOLEAN DEFAULT false,
          "journalEntryId" UUID,
          "createdBy" UUID NOT NULL,
          "approvedBy" UUID,
          "approvedAt" TIMESTAMP,
          "tenantId" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_journal_entry FOREIGN KEY ("journalEntryId") REFERENCES journal_entries(id),
          CONSTRAINT fk_created_by FOREIGN KEY ("createdBy") REFERENCES users(id),
          CONSTRAINT fk_approved_by FOREIGN KEY ("approvedBy") REFERENCES users(id),
          CONSTRAINT fk_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id)
        );

        CREATE INDEX idx_expense_tenant_date ON expenses("tenantId", "expenseDate");
        CREATE INDEX idx_expense_tenant_status ON expenses("tenantId", status);
        CREATE INDEX idx_expense_tenant_type ON expenses("tenantId", type);
        CREATE INDEX idx_expense_number ON expenses("expenseNumber");
        CREATE INDEX idx_expense_tenant ON expenses("tenantId");
      `);
      console.log('   ✅ Tabla creada: expenses');
    } else {
      console.log('   ℹ️  Tabla ya existe: expenses');

      // Verificar si la columna ocrData existe
      const ocrDataExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'expenses'
          AND column_name = 'ocrData'
        );
      `);

      if (!ocrDataExists.rows[0].exists) {
        await client.query(`ALTER TABLE expenses ADD COLUMN "ocrData" JSONB;`);
        console.log('   ✅ Columna "ocrData" agregada a expenses');
      }

      // Verificar si la columna isOcrExtracted existe
      const isOcrExtractedExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'expenses'
          AND column_name = 'isOcrExtracted'
        );
      `);

      if (!isOcrExtractedExists.rows[0].exists) {
        await client.query(`ALTER TABLE expenses ADD COLUMN "isOcrExtracted" BOOLEAN DEFAULT false;`);
        console.log('   ✅ Columna "isOcrExtracted" agregada a expenses');
      }

      // Verificar si la columna wasManuallyEdited existe
      const wasManuallyEditedExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'expenses'
          AND column_name = 'wasManuallyEdited'
        );
      `);

      if (!wasManuallyEditedExists.rows[0].exists) {
        await client.query(`ALTER TABLE expenses ADD COLUMN "wasManuallyEdited" BOOLEAN DEFAULT false;`);
        console.log('   ✅ Columna "wasManuallyEdited" agregada a expenses');
      }
    }

    // ========================================
    // 7. TABLA: tax_withholdings
    // ========================================
    const withholdingsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'tax_withholdings'
      );
    `);

    if (!withholdingsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE tax_withholdings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "withholdingNumber" VARCHAR(50) NOT NULL,
          type withholding_type_enum NOT NULL,
          concept withholding_concept_enum NOT NULL,
          direction withholding_direction_enum NOT NULL,
          "withholdingDate" DATE NOT NULL,
          "baseAmount" DECIMAL(12,2) NOT NULL,
          percentage DECIMAL(5,2) NOT NULL,
          "withheldAmount" DECIMAL(12,2) NOT NULL,
          "thirdPartyName" VARCHAR(200) NOT NULL,
          "thirdPartyNit" VARCHAR(20) NOT NULL,
          "certificateNumber" VARCHAR(100) UNIQUE,
          "certificateUrl" TEXT,
          "saleId" UUID,
          "expenseId" UUID,
          notes TEXT,
          "createdBy" UUID NOT NULL,
          "fiscalYear" INTEGER NOT NULL,
          "isDeclared" BOOLEAN DEFAULT false,
          "declaredAt" DATE,
          "tenantId" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_sale FOREIGN KEY ("saleId") REFERENCES sales(id),
          CONSTRAINT fk_expense FOREIGN KEY ("expenseId") REFERENCES expenses(id),
          CONSTRAINT fk_created_by FOREIGN KEY ("createdBy") REFERENCES users(id),
          CONSTRAINT fk_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id)
        );

        CREATE INDEX idx_withhold_tenant_date ON tax_withholdings("tenantId", "withholdingDate");
        CREATE INDEX idx_withhold_tenant_type ON tax_withholdings("tenantId", type);
        CREATE INDEX idx_withhold_tenant_direction ON tax_withholdings("tenantId", direction);
        CREATE INDEX idx_withhold_cert ON tax_withholdings("certificateNumber");
        CREATE INDEX idx_withhold_tenant ON tax_withholdings("tenantId");
      `);
      console.log('   ✅ Tabla creada: tax_withholdings');
    } else {
      console.log('   ℹ️  Tabla ya existe: tax_withholdings');
    }

    await client.end();
    console.log('\n✅ Migración completada exitosamente');
    console.log('📊 Todas las tablas del módulo de contabilidad están listas\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

createAccountingTables();
