A continuación te  
  presento un plan de acción detallado y estructurado para la implementación completa del módulo de contabilidad.  
  📋 Resumen Ejecutivo  
  El módulo contable transformará NexoPOS en una solución integral que no solo gestiona ventas sino que también maneja automáticamente  
   toda la contabilidad tributaria colombiana con el concepto de "Contabilidad Invisible".  
  \---  
  🎯 FASE 1: Arquitectura de Base de Datos  
  1.1 Entidades Principales a Crear  
  A. Plan de Cuentas (Mini-PUC)  
  // backend/src/modules/accounting/entities/chart-of-accounts.entity.ts  
  \- Código PUC (ej: 1105, 4135\)  
  \- Nombre de cuenta  
  \- Naturaleza (Débito/Crédito)  
  \- Tipo de cuenta (Activo, Pasivo, Patrimonio, Ingreso, Gasto, Costo)  
  \- Estado (activa/inactiva)  
  \- Relación con tenant  
  B. Asientos Contables  
  // backend/src/modules/accounting/entities/journal-entry.entity.ts  
  \- Fecha del asiento  
  \- Tipo de asiento (venta, compra, gasto, pago, etc.)  
  \- Descripción  
  \- Referencia a transacción origen (sale\_id, expense\_id, etc.)  
  \- Estado (borrador, confirmado, anulado)  
  \- Relación con tenant  
  \- Usuario que creó el asiento  
  C. Líneas de Asiento (Detalle)  
  // backend/src/modules/accounting/entities/journal-entry-line.entity.ts  
  \- Relación con journal-entry  
  \- Relación con chart-of-accounts  
  \- Tipo de movimiento (débito/crédito)  
  \- Monto  
  \- Descripción  
  D. Gastos y Compras  
  // backend/src/modules/accounting/entities/expense.entity.ts  
  \- Tipo de gasto (servicios, arriendo, nómina, etc.) \- usando iconos  
  \- Proveedor (opcional, relación con suppliers)  
  \- Fecha  
  \- Número de factura del proveedor  
  \- Subtotal  
  \- IVA descontable  
  \- Total  
  \- Método de pago (efectivo, banco, tarjeta)  
  \- Estado (pendiente, pagado)  
  \- URL de imagen de factura (OCR)  
  \- Datos extraídos por OCR (JSON)  
  \- Relación con tenant  
  E. Retenciones  
  // backend/src/modules/accounting/entities/tax-withholding.entity.ts  
  \- Tipo (ReteFuente, ReteIVA, ReteICA)  
  \- Concepto (compras, servicios, honorarios)  
  \- Base  
  \- Porcentaje  
  \- Valor retenido  
  \- A favor de (quien recibió la retención)  
  \- Practicada por (quien hizo la retención)  
  \- Fecha  
  \- Relación con venta o gasto  
  \- Número de certificado  
  F. Configuración Fiscal del Negocio  
  // backend/src/modules/accounting/entities/fiscal-config.entity.ts  
  \- Régimen tributario (simplificado, común, grandes contribuyentes)  
  \- Es agente retenedor (boolean)  
  \- Responsabilidades fiscales (IVA, ReteFuente, etc.)  
  \- Período de declaración IVA (bimestral, cuatrimestral)  
  \- CIIU (Clasificación Industrial)  
  \- Relación con tenant (1:1)  
  1.2 Modificaciones a Entidades Existentes  
  Sales Entity \- Agregar:  
  \- journalEntryId: Relación con asiento contable generado  
  \- taxWithholdingId: Relación con retención si aplica  
  Products Entity \- Ya tiene:  
  \- ✅ taxRate: Tarifa de IVA (0, 5, 19\)  
  \- ✅ taxIncluded: Si el precio incluye IVA  
  \---  
  🔧 FASE 2: Backend \- Módulo de Contabilidad  
  2.1 Estructura del Módulo  
  backend/src/modules/accounting/  
  ├── accounting.module.ts  
  ├── accounting.controller.ts  
  ├── accounting.service.ts  
  ├── entities/  
  │   ├── chart-of-accounts.entity.ts  
  │   ├── journal-entry.entity.ts  
  │   ├── journal-entry-line.entity.ts  
  │   ├── expense.entity.ts  
  │   ├── tax-withholding.entity.ts  
  │   └── fiscal-config.entity.ts  
  ├── dto/  
  │   ├── create-expense.dto.ts  
  │   ├── expense-response.dto.ts  
  │   ├── create-withholding.dto.ts  
  │   ├── fiscal-config.dto.ts  
  │   └── accounting-reports.dto.ts  
  ├── services/  
  │   ├── journal-entry.service.ts (Motor de asientos automáticos)  
  │   ├── chart-of-accounts.service.ts  
  │   ├── expense.service.ts  
  │   ├── tax-calculation.service.ts  
  │   └── accounting-reports.service.ts  
  └── seeds/  
      └── mini-puc.seed.ts (30-40 cuentas esenciales)  
  2.2 Servicios Clave  
  A. JournalEntryService \- Motor de Asientos Automáticos  
  class JournalEntryService {  
    // Crear asiento para venta en efectivo con IVA  
    async createSaleEntry(sale: Sale): Promise\<JournalEntry\>  
    // Crear asiento para compra de inventario  
    async createPurchaseEntry(expense: Expense): Promise\<JournalEntry\>  
    // Crear asiento para gasto operativo  
    async createExpenseEntry(expense: Expense): Promise\<JournalEntry\>  
    // Crear asiento para venta a crédito con retención  
    async createCreditSaleWithWithholding(sale: Sale, withholding: TaxWithholding)  
    // Reglas de negocio para mapeo UX → PUC  
    private getCuentaFromExpenseType(type: string): string  
    private getCuentaFromPaymentMethod(method: string): string  
  }  
  B. TaxCalculationService  
  class TaxCalculationService {  
    // Calcular IVA generado del período  
    async calculateIVAGenerado(tenantId: string, startDate: Date, endDate: Date)  
    // Calcular IVA descontable del período  
    async calculateIVADescontable(tenantId: string, startDate: Date, endDate: Date)  
    // Calcular saldo de IVA a pagar/favor  
    async calculateIVABalance(tenantId: string, startDate: Date, endDate: Date)  
    // Calcular retenciones a favor (saldos acumulados)  
    async calculateWithholdingsInFavor(tenantId: string, year: number)  
  }  
  C. AccountingReportsService  
  class AccountingReportsService {  
    // Dashboard principal \- 5 widgets  
    async getDashboardData(tenantId: string, month: number, year: number)  
    // Reporte de IVA para declaración  
    async getIVAReport(tenantId: string, startDate: Date, endDate: Date)  
    // Estado de Resultados simplificado (P\&L)  
    async getProfitAndLoss(tenantId: string, startDate: Date, endDate: Date)  
    // Balance General simplificado  
    async getBalanceSheet(tenantId: string, date: Date)  
    // Reporte de gastos por categoría  
    async getExpensesByCategory(tenantId: string, startDate: Date, endDate: Date)  
  }  
  2.3 Endpoints RESTful  
  // Configuración Fiscal  
  GET    /api/accounting/fiscal-config  
  PUT    /api/accounting/fiscal-config  
  // Gastos  
  GET    /api/accounting/expenses  
  POST   /api/accounting/expenses  
  GET    /api/accounting/expenses/:id  
  PUT    /api/accounting/expenses/:id  
  DELETE /api/accounting/expenses/:id  
  POST   /api/accounting/expenses/ocr-scan (Upload de imagen)  
  // Retenciones  
  GET    /api/accounting/withholdings  
  POST   /api/accounting/withholdings  
  GET    /api/accounting/withholdings/certificate/:id (PDF)  
  // Reportes  
  GET    /api/accounting/dashboard?month=X\&year=Y  
  GET    /api/accounting/reports/iva?startDate=X\&endDate=Y  
  GET    /api/accounting/reports/profit-loss?startDate=X\&endDate=Y  
  GET    /api/accounting/reports/balance-sheet?date=X  
  GET    /api/accounting/reports/expenses-by-category?startDate=X\&endDate=Y  
  // Asientos Contables (Avanzado \- opcional en MVP)  
  GET    /api/accounting/journal-entries  
  GET    /api/accounting/journal-entries/:id  
  \---  
  🎨 FASE 3: Frontend \- Interfaz de Usuario  
  3.1 Nueva Vista: AccountingView  
  Ubicación: frontend/src/views/AccountingView.tsx  
  Pestañas principales:  
  1\. Dashboard \- Los 5 widgets clave  
  2\. Gastos \- Lista y registro de gastos  
  3\. Reportes Fiscales \- IVA, ReteFuente  
  4\. Configuración \- Setup inicial fiscal  
  3.2 Dashboard \- Los 5 Widgets  
  // frontend/src/components/accounting/AccountingDashboard.tsx  
  \<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"\>  
    {/\* Widget 1: Ventas del Mes \*/}  
    \<WidgetVentasMes  
      total={15450000}  
      tendencia={+12.5}  
      comparacion="vs mes anterior"  
    /\>  
    {/\* Widget 2: Gastos del Mes \*/}  
    \<WidgetGastosMes  
      total={9800000}  
      desglose={\[  
        { categoria: 'Inventario', porcentaje: 50 },  
        { categoria: 'Arriendo', porcentaje: 20 },  
        { categoria: 'Servicios', porcentaje: 10 }  
      \]}  
    /\>  
    {/\* Widget 3: Ganancia Neta \*/}  
    \<WidgetGananciaNeta  
      valor={2150000}  
      tipo="positivo" // o "negativo"  
    /\>  
    {/\* Widget 4: Dinero Disponible \*/}  
    \<WidgetDineroDisponible  
      caja={1200000}  
      bancos={7500000}  
    /\>  
    {/\* Widget 5: LA PREGUNTA DEL MILLÓN \- Impuestos \*/}  
    \<WidgetProvisionImpuestos  
      total={1850000}  
      desglose={{  
        iva: 1600000,  
        retenciones: 250000  
      }}  
      destacado={true}  
    /\>  
  \</div\>  
  3.3 Registro de Gastos \- Flujo de 30 Segundos  
  // frontend/src/components/accounting/ExpenseRegistration.tsx  
  \<Modal\>  
    {/\* Paso 1: Captura de imagen \*/}  
    \<CameraCapture  
      onCapture={(imageFile) \=\> uploadAndOCR(imageFile)}  
    /\>  
    {/\* Paso 2: Confirmación de datos OCR \*/}  
    \<ExpenseConfirmation  
      proveedor={ocrData.proveedor}  
      nit={ocrData.nit}  
      fecha={ocrData.fecha}  
      total={ocrData.total}  
      iva={ocrData.iva}  
      onEdit={(field) \=\> enableManualEdit(field)}  
    /\>  
    {/\* Paso 3: Categorización con iconos \*/}  
    \<ExpenseCategoryGrid\>  
      \<CategoryIcon icon="🛒" label="Compra Inventario" pucCode="1435" /\>  
      \<CategoryIcon icon="🏢" label="Arriendo" pucCode="5120" /\>  
      \<CategoryIcon icon="💡" label="Servicios Públicos" pucCode="5135" /\>  
      \<CategoryIcon icon="🧑‍💼" label="Nómina" pucCode="5105" /\>  
      \<CategoryIcon icon="⚖️" label="Servicios Prof." pucCode="5110" /\>  
      \<CategoryIcon icon="🔧" label="Mantenimiento" pucCode="5145" /\>  
      \<CategoryIcon icon="➕" label="Otro" pucCode="5195" /\>  
    \</ExpenseCategoryGrid\>  
    {/\* Paso 4: Método de pago \*/}  
    \<PaymentMethodSelector\>  
      \<PaymentIcon icon="💵" label="Caja" account="1105" /\>  
      \<PaymentIcon icon="🏦" label="Banco" account="1110" /\>  
      \<PaymentIcon icon="💳" label="Tarjeta" account="1110" /\>  
    \</PaymentMethodSelector\>  
    \<Button onClick={saveExpense}\>Registrar Gasto\</Button\>  
  \</Modal\>  
  3.4 Integración OCR  
  Opciones de servicios OCR:  
  1\. Google Cloud Vision API (recomendado)  
  2\. Tesseract.js (gratuito, funciona en navegador)  
  3\. Azure Computer Vision  
  // frontend/src/services/ocrService.ts  
  export async function extractInvoiceData(imageFile: File): Promise\<OCRResult\> {  
    const formData \= new FormData();  
    formData.append('image', imageFile);  
    const response \= await api.post('/accounting/expenses/ocr-scan', formData);  
    return {  
      proveedor: response.data.proveedor,  
      nit: response.data.nit,  
      fecha: response.data.fecha,  
      subtotal: response.data.subtotal,  
      iva: response.data.iva,  
      total: response.data.total,  
      numeroFactura: response.data.numeroFactura,  
      confidence: response.data.confidence  
    };  
  }  
  3.5 Store de Zustand para Contabilidad  
  // frontend/src/stores/accountingStore.ts  
  interface AccountingStore {  
    // Dashboard data  
    dashboardData: DashboardData | null;  
    loadDashboard: (month: number, year: number) \=\> Promise\<void\>;  
    // Gastos  
    expenses: Expense\[\];  
    loadExpenses: () \=\> Promise\<void\>;  
    createExpense: (data: CreateExpenseDto) \=\> Promise\<void\>;  
    // Configuración fiscal  
    fiscalConfig: FiscalConfig | null;  
    loadFiscalConfig: () \=\> Promise\<void\>;  
    updateFiscalConfig: (config: FiscalConfig) \=\> Promise\<void\>;  
    // Reportes  
    ivaReport: IVAReport | null;  
    loadIVAReport: (startDate: Date, endDate: Date) \=\> Promise\<void\>;  
  }  
  3.6 Navegación \- Agregar a App.tsx  
  // Agregar al array de navItems en frontend/src/App.tsx  
  const navItems \= \[  
    { path: '/', label: 'Venta', icon: ShoppingCart, shortcut: 'F1' },  
    { path: '/inventory', label: 'Inventario', icon: Package, shortcut: 'F2' },  
    { path: '/credit', label: 'Fiado', icon: CreditCard, shortcut: 'F3' },  
    { path: '/cash-register', label: 'Caja', icon: Calculator, shortcut: 'F4' },  
    { path: '/accounting', label: 'Contabilidad', icon: Receipt, shortcut: 'F7' }, // NUEVO  
    { path: '/dashboard', label: 'Reportes', icon: BarChart3, shortcut: 'F5' },  
    { path: '/settings', label: 'Configuración', icon: Settings, shortcut: 'F6' }  
  \]  
  \---  
  🔗 FASE 4: Integración con Módulos Existentes  
  4.1 Modificar SalesService  
  // backend/src/modules/sales/sales.service.ts  
  async createSale(createSaleDto: CreateSaleDto, userId: string, tenantId: string) {  
    // Crear la venta (código existente)  
    const sale \= await this.saleRepository.save(newSale);  
    // NUEVO: Generar asiento contable automáticamente  
    const journalEntry \= await this.journalEntryService.createSaleEntry(sale);  
    // Actualizar la venta con referencia al asiento  
    sale.journalEntryId \= journalEntry.id;  
    await this.saleRepository.save(sale);  
    return sale;  
  }  
  4.2 Trigger en CashRegister (Cierre de Caja)  
  // backend/src/modules/cash-register/cash-register.service.ts  
  async closeRegister(registerId: string, closingData: CloseRegisterDto) {  
    // Cerrar caja (código existente)  
    const closedRegister \= await this.close(registerId, closingData);  
    // NUEVO: Generar asiento contable del arqueo de caja  
    await this.journalEntryService.createCashRegisterCloseEntry(closedRegister);  
    return closedRegister;  
  }  
  4.3 Integración con Inventory (Compras)  
  Cuando se agregue funcionalidad de compras a proveedores (futuro):  
  async createPurchaseOrder(purchaseDto: CreatePurchaseDto) {  
    const purchase \= await this.purchaseRepository.save(newPurchase);  
    // Generar asiento de compra de inventario  
    await this.journalEntryService.createPurchaseEntry(purchase);  
    return purchase;  
  }  
  \---  
  📊 FASE 5: Reportes Fiscales  
  5.1 Reporte de IVA \- Formato  
  interface IVAReport {  
    periodo: {  
      inicio: Date;  
      fin: Date;  
    };  
    ivaGenerado: {  
      totalVentas: number;  
      tarifaGeneral19: number;  
      tarifaReducida5: number;  
      exentas: number;  
    };  
    ivaDescontable: {  
      totalCompras: number;  
      ivaCompras: number;  
      ivaGastos: number;  
    };  
    saldo: {  
      tipo: 'a\_pagar' | 'a\_favor';  
      valor: number;  
    };  
  }  
  5.2 Exportación a Excel  
  // Utilizar librería 'exceljs'  
  npm install exceljs  
  async exportIVAReportToExcel(report: IVAReport): Promise\<Buffer\> {  
    const workbook \= new ExcelJS.Workbook();  
    const worksheet \= workbook.addWorksheet('Reporte IVA');  
    // Formato para Formulario 300 DIAN  
    worksheet.addRow(\['DECLARACIÓN DE IVA'\]);  
    worksheet.addRow(\['Período:', \`${report.periodo.inicio} \- ${report.periodo.fin}\`\]);  
    // ...  
    return await workbook.xlsx.writeBuffer();  
  }  
  \---  
  🗄️ FASE 6: Migraciones y Seed de Datos  
  6.1 Migración Inicial  
  cd backend  
  npm run migration:generate \-- src/migrations/CreateAccountingModule  
  6.2 Seed del Mini-PUC (30-40 cuentas)  
  // backend/src/modules/accounting/seeds/mini-puc.seed.ts  
  const miniPUC \= \[  
    { codigo: '1105', nombre: 'Caja', naturaleza: 'Debito', tipo: 'Activo' },  
    { codigo: '1110', nombre: 'Bancos', naturaleza: 'Debito', tipo: 'Activo' },  
    { codigo: '1305', nombre: 'Clientes', naturaleza: 'Debito', tipo: 'Activo' },  
    { codigo: '135515', nombre: 'Retención en la Fuente', naturaleza: 'Debito', tipo: 'Activo' },  
    { codigo: '1435', nombre: 'Mercancías no fabricadas', naturaleza: 'Debito', tipo: 'Activo' },  
    // ... resto de las 30-40 cuentas del documento  
  \];  
  export async function seedMiniPUC(dataSource: DataSource, tenantId: string) {  
    const accountRepo \= dataSource.getRepository(ChartOfAccounts);  
    for (const cuenta of miniPUC) {  
      await accountRepo.save({  
        ...cuenta,  
        tenantId,  
        isActive: true  
      });  
    }  
  }  
  \---  
  🧪 FASE 7: Testing y Validación  
  7.1 Tests Unitarios Backend  
  // backend/src/modules/accounting/services/journal-entry.service.spec.ts  
  describe('JournalEntryService', () \=\> {  
    it('debe crear asiento de venta en efectivo con IVA correctamente', async () \=\> {  
      const sale \= createMockSale({  
        total: 119000,  
        iva: 19000,  
        subtotal: 100000,  
        paymentMethod: 'cash'  
      });  
      const entry \= await service.createSaleEntry(sale);  
      expect(entry.lines).toHaveLength(4); // 2 débitos, 2 créditos  
      expect(entry.lines.find(l \=\> l.cuenta \=== '1105').monto).toBe(119000); // Caja  
      expect(entry.lines.find(l \=\> l.cuenta \=== '4135').monto).toBe(100000); // Ingreso  
      expect(entry.lines.find(l \=\> l.cuenta \=== '2408').monto).toBe(19000);  // IVA  
    });  
  });  
  7.2 Tests de Integración  
  describe('Accounting Integration Tests', () \=\> {  
    it('debe generar asiento automático al crear venta', async () \=\> {  
      const saleResponse \= await request(app.getHttpServer())  
        .post('/api/sales')  
        .send(mockSaleData)  
        .expect(201);  
      const journalEntries \= await request(app.getHttpServer())  
        .get('/api/accounting/journal-entries')  
        .query({ referenceId: saleResponse.body.id });  
      expect(journalEntries.body).toHaveLength(1);  
    });  
  });  
  \---  
  📅 Cronograma Estimado de Implementación  
  | Fase      | Descripción                        | Tiempo Estimado |  
  |-----------|------------------------------------|-----------------|  
  | 1         | Arquitectura de BD (entidades)     | 3-4 días        |  
  | 2         | Backend \- Servicios core           | 7-10 días       |  
  | 3         | Frontend \- Vistas y componentes    | 7-10 días       |  
  | 4         | Integración con módulos existentes | 3-4 días        |  
  | 5         | Reportes fiscales y exportación    | 3-4 días        |  
  | 6         | Migraciones y seed                 | 2 días          |  
  | 7         | Testing y refinamiento             | 5-7 días        |  
  | TOTAL MVP | 30-40 días (1.5 \- 2 meses)         |                 |  
  \---  
  🚀 Orden de Implementación Recomendado  
  1\. ✅ Crear entidades de base de datos (Chart of Accounts, Journal Entry, Expense)  
  2\. ✅ Seed del Mini-PUC (las 30-40 cuentas)  
  3\. ✅ JournalEntryService \- Motor de asientos automáticos  
  4\. ✅ ExpenseService \- Gestión de gastos  
  5\. ✅ Integrar con SalesService \- Asientos en ventas  
  6\. ✅ TaxCalculationService \- Cálculos de IVA  
  7\. ✅ AccountingReportsService \- Dashboard y reportes  
  8\. ✅ Frontend: AccountingView \- Vista principal  
  9\. ✅ Frontend: Dashboard widgets \- Los 5 widgets  
  10\. ✅ Frontend: Registro de gastos \- Con OCR (puede ser MVP sin OCR primero)  
  11\. ✅ Reportes fiscales \- IVA, ReteFuente  
  12\. ✅ Testing end-to-end  
  \---  
  ⚠️ Consideraciones Importantes  
  Puntos Críticos de la Implementación  
  1\. Multi-tenancy: Todas las entidades deben tener tenantId para aislar datos  
  2\. Partida doble: Cada asiento SIEMPRE debe cuadrar (débitos \= créditos)  
  3\. No-edición de asientos confirmados: Una vez confirmado, no se edita, se anula y se crea uno nuevo  
  4\. OCR puede fallar: Siempre permitir edición manual de datos extraídos  
  5\. Validación de IVA descontable: Solo con factura electrónica confirmada (mensajes de aceptación)  
  Dependencias Técnicas Nuevas  
  // Backend  
  {  
    "exceljs": "^4.3.0",  // Exportación de reportes  
    "@google-cloud/vision": "^4.0.0" // OCR (opcional)  
  }  
  // Frontend  
  {  
    "react-dropzone": "^14.2.3",  // Upload de imágenes  
    "recharts": "^2.10.0"  // Gráficos del dashboard  
  }  
  \---  
  🎓 Próximos Pasos Inmediatos  
● 📝 Resumen del Plan  
  He analizado completamente el documento de estrategia y creado un plan de acción integral para integrar el módulo de contabilidad en  
   NexoPOS. El plan está dividido en 7 fases bien estructuradas:  
  Componentes Clave:  
  ✅ 6 nuevas entidades de base de datos (Chart of Accounts, Journal Entry, Expense, Tax Withholding, etc.)  
  ✅ Motor de asientos automáticos que genera contabilidad de partida doble invisible para el usuario  
  ✅ Dashboard con 5 widgets visuales que responden las preguntas clave del negocio  
  ✅ Registro de gastos en 30 segundos con captura de foto y OCR  
  ✅ Reportes fiscales para IVA y ReteFuente listos para DIAN  
  ✅ Integración perfecta con módulos existentes (ventas, inventario, caja)  
  Filosofía de Implementación:  
  El diseño sigue el principio de "Contabilidad Invisible" del documento:  
  \- Usuario nunca ve códigos PUC ni jerga contable  
  \- Categorización por iconos intuitivos (🛒🏢💡🧑‍💼)  
  \- Asientos de partida doble 100% automáticos  
  \- Dashboard visual que responde preguntas, no muestra datos  
