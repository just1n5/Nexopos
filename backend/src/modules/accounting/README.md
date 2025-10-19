# Módulo de Contabilidad - NexoPOS

## Descripción General

Módulo contable completo para NexoPOS que implementa el concepto de **"Contabilidad Invisible"**.

El usuario nunca ve código PUC ni jerga contable. Todas las acciones se realizan mediante íconos intuitivos y lenguaje natural, mientras que el sistema genera automáticamente los asientos contables de partida doble en segundo plano.

## Filosofía de Diseño

- ✅ **Hablar el idioma del negocio, no del contador**
- ✅ **Automatización total de asientos contables**
- ✅ **Partida doble invisible para el usuario**
- ✅ **Cumplimiento normativo colombiano** (Decreto 2650/1993, DIAN)

## Estructura del Módulo

```
accounting/
├── entities/                      # Entidades de base de datos
│   ├── chart-of-accounts.entity.ts       # Plan de cuentas (Mini-PUC)
│   ├── journal-entry.entity.ts           # Asientos contables
│   ├── journal-entry-line.entity.ts      # Líneas de asientos
│   ├── expense.entity.ts                 # Gastos y compras
│   ├── tax-withholding.entity.ts         # Retenciones fiscales
│   └── fiscal-config.entity.ts           # Configuración fiscal del tenant
│
├── services/                      # Lógica de negocio
│   ├── chart-of-accounts.service.ts      # Gestión del PUC
│   ├── journal-entry.service.ts          # Motor de asientos automáticos ⚙️
│   ├── expense.service.ts                # Gestión de gastos
│   ├── tax-calculation.service.ts        # Cálculos fiscales (IVA, ReteFuente)
│   ├── accounting-reports.service.ts     # Reportes y dashboard
│   └── fiscal-config.service.ts          # Configuración fiscal
│
├── dto/                           # Data Transfer Objects (Fase 2)
├── seeds/                         # Datos iniciales
│   └── mini-puc.seed.ts                  # Seed de 35 cuentas esenciales
│
├── accounting.module.ts           # Definición del módulo
├── accounting.controller.ts       # Endpoints REST
└── accounting.service.ts          # Servicio principal

```

## Entidades Principales

### 1. ChartOfAccounts (Plan de Cuentas)
- **Mini-PUC** de 35 cuentas esenciales
- Basado en Decreto 2650 de 1993
- Incluye: Activos, Pasivos, Patrimonio, Ingresos, Gastos, Costos

### 2. JournalEntry (Asiento Contable)
- Cumple con partida doble automática
- Tipos: SALE, PURCHASE, EXPENSE, PAYMENT, etc.
- Estados: DRAFT, CONFIRMED, CANCELLED
- Siempre validado: Débitos = Créditos

### 3. Expense (Gastos y Compras)
- 13 tipos de gasto con íconos emoji
- Soporte para OCR de facturas
- Métodos de pago: Efectivo, Banco, Tarjeta, Crédito
- IVA descontable automático

### 4. TaxWithholding (Retenciones)
- ReteFuente, ReteIVA, ReteICA
- Dirección: Recibida (a favor) / Practicada (obligación)
- Conceptos con porcentajes predefinidos (2.5%, 4%, 6%, 10%, 11%)

### 5. FiscalConfig (Configuración Fiscal)
- Relación 1:1 con Tenant
- NIT, régimen tributario, responsabilidades fiscales
- Configuración de facturación electrónica
- CIIU, actividad económica

## Mini-PUC (35 Cuentas Esenciales)

### Activos (1xxx)
- 1105 - Caja
- 1110 - Bancos
- 1305 - Clientes
- 135515 - Retención en la Fuente por Cobrar
- 1435 - Inventario

### Pasivos (2xxx)
- 2205 - Proveedores
- 2335 - Gastos por Pagar
- 2365 - Retención en la Fuente por Pagar
- 2408 - IVA por Pagar

### Patrimonio (3xxx)
- 3115 - Aportes Sociales
- 3605 - Utilidad del Ejercicio
- 3705 - Pérdida del Ejercicio

### Ingresos (4xxx)
- 4135 - Comercio al por Mayor/Menor
- 4175 - Devoluciones en Ventas
- 4210 - Ingresos Financieros

### Gastos (5xxx)
- 5105 - Nómina
- 5110 - Honorarios
- 5115 - Impuestos
- 5120 - Arriendo
- 5130 - Seguros
- 5135 - Servicios Públicos
- 5145 - Mantenimiento
- 5155 - Viáticos
- 5195 - Gastos Diversos
- 5205 - Personal de Ventas
- 5240 - Publicidad
- 5260 - Transporte
- 5305 - Gastos Bancarios
- 5310 - Intereses

### Costos (6xxx)
- 6135 - Costo de Ventas

## Flujo de Datos - Ejemplo de Venta

```typescript
// 1. Usuario hace una venta en el POS
POST /api/sales
{
  total: 119000,
  subtotal: 100000,
  taxAmount: 19000,
  paymentMethod: 'CASH'
}

// 2. SalesService crea la venta y llama a JournalEntryService
await journalEntryService.createSaleEntry(sale);

// 3. JournalEntryService genera asiento automático:
Asiento JE-2024-00001:
  DÉBITO:  1105 - Caja            $119,000
  CRÉDITO: 4135 - Ingresos        $100,000
  CRÉDITO: 2408 - IVA por Pagar   $ 19,000
  DÉBITO:  6135 - Costo de Ventas $ 70,000
  CRÉDITO: 1435 - Inventario      $ 70,000

// 4. Usuario nunca ve este asiento, solo ve:
"Venta registrada exitosamente ✅"
```

## Mapeo UX → PUC

El sistema traduce acciones del usuario a cuentas contables:

| Ícono UI | Acción del Usuario | Cuenta PUC | Código |
|----------|-------------------|------------|--------|
| 🛒 | Compra de Inventario | Mercancías | 1435 |
| 🏢 | Pago de Arriendo | Arrendamientos | 5120 |
| 💡 | Servicios Públicos | Servicios | 5135 |
| 🧑‍💼 | Nómina | Gastos de Personal | 5105 |
| 💵 | Pago en Efectivo | Caja | 1105 |
| 🏦 | Pago con Banco | Bancos | 1110 |

## Servicios Clave

### JournalEntryService (Motor de Contabilidad)
```typescript
// Crea asientos automáticos desde transacciones
createSaleEntry(sale): Promise<JournalEntry>
createExpenseEntry(expense): Promise<JournalEntry>
createPurchaseEntry(purchase): Promise<JournalEntry>
```

### TaxCalculationService
```typescript
// Cálculos fiscales para reportes
calculateIVAGenerado(tenantId, startDate, endDate): Promise<number>
calculateIVADescontable(tenantId, startDate, endDate): Promise<number>
calculateIVABalance(tenantId, startDate, endDate): Promise<IVAReport>
```

### AccountingReportsService
```typescript
// Dashboard y reportes
getDashboardData(tenantId, month, year): Promise<DashboardData>
getIVAReport(tenantId, startDate, endDate): Promise<IVAReport>
getProfitAndLoss(tenantId, startDate, endDate): Promise<P&L>
getBalanceSheet(tenantId, date): Promise<BalanceSheet>
```

## Estado Actual (Fase 1 - Completada) ✅

- ✅ Todas las entidades creadas
- ✅ Módulo configurado en AppModule
- ✅ Servicios base (esqueletos)
- ✅ Seed del Mini-PUC (35 cuentas)
- ✅ Modificaciones a entidades existentes (Sale, ProductVariant)
- ✅ Validación de partida doble en entidades

## Próximos Pasos (Fase 2)

1. Implementar lógica completa de JournalEntryService
2. Crear DTOs de entrada/salida
3. Implementar endpoints REST en AccountingController
4. Integrar con SalesService (asientos automáticos en ventas)
5. Implementar TaxCalculationService
6. Crear AccountingReportsService
7. Implementar ExpenseService con soporte OCR

## Consideraciones Técnicas

### Multi-tenancy
- Todas las entidades tienen `tenantId`
- Los seeds se ejecutan por tenant
- Aislamiento total de datos entre tenants

### Validaciones de Negocio
- Asientos siempre cuadrados (débitos = créditos)
- Números consecutivos únicos por tenant
- Estados inmutables (CONFIRMED no se puede editar)
- Anulación por asientos de reversa

### Cumplimiento Normativo
- Plan de cuentas según Decreto 2650/1993
- Estructura de retenciones según DIAN 2025
- Tasas de IVA: 0%, 5%, 19%
- Soporte para régimen simplificado y común

## Comandos Útiles

```bash
# Ejecutar seed del Mini-PUC para todos los tenants
npm run seed:accounting

# Generar migración de accounting
npm run migration:generate -- src/migrations/CreateAccountingModule

# Ejecutar migraciones
npm run migration:run
```

## Referencias Normativas

- **Decreto 2650 de 1993**: Plan Único de Cuentas para comerciantes
- **Resolución 00165 de 2023**: Facturación electrónica DIAN
- **Estatuto Tributario**: Retención en la fuente y tarifas
- **Reforma Tributaria 2024**: Nuevas tarifas de IVA y retenciones

## Autor

Módulo desarrollado siguiendo el documento de "Estrategia de Producto: Módulo Contable para Nexo POS (MVP)"
