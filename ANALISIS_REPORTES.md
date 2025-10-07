# Análisis del Módulo de Reportes - NexoPOS

**Fecha:** 2025-10-06
**Versión:** 1.0
**Estado:** Análisis de Gap

---

## 1. Resumen Ejecutivo

### Estado Actual
El módulo de reportes está **parcialmente implementado** con funcionalidad básica de:
- Reporte de ventas con métricas generales
- Reporte de productos más vendidos
- Reporte de clientes
- Reporte de inventario básico
- Filtros por rango de fechas (Hoy/Semana/Mes/Año)
- Descarga de reportes en CSV

### Gaps Críticos Identificados
1. ❌ **Timezone**: Fechas en UTC, no en `America/Bogota`
2. ❌ **Ingresos vs Ventas**: No se diferencia entre ventas totales e ingresos en caja
3. ❌ **IVA desglosado**: No se muestra desglose de IVA por tasa (19%/5%/exento)
4. ❌ **Reconciliación**: No hay validación cruzada con Caja/Inventario/Créditos
5. ❌ **Reporte de Arqueos**: No existe módulo de reportes de caja
6. ⚠️ **Exportaciones**: Solo CSV, falta XLSX y PDF
7. ⚠️ **Performance**: No hay paginación para rangos grandes

---

## 2. Análisis Detallado por Componente

### 2.1 Dashboard (Visión General)

#### ✅ Implementado
- Selector de rango de fechas (Hoy/Semana/Mes/Año)
- Total de ventas
- Ticket promedio
- Ventas por método de pago
- Ventas por hora del día
- Productos más vendidos
- Clientes frecuentes

#### ❌ Faltante / Incorrecto
| Requerimiento | Estado | Gap |
|--------------|--------|-----|
| Ventas vs Ingresos | ❌ | Solo muestra `totalRevenue`, no diferencia ingresos reales de caja |
| Créditos pendientes | ⚠️ | Muestra `creditPending` pero no está reconciliado con módulo de Créditos |
| Timezone local | ❌ | Fechas en UTC, no `America/Bogota` |
| Venta a crédito | ❌ | No se excluye de "Ingresos del día" |
| Ticket promedio | ⚠️ | No excluye anuladas/devoluciones (si existieran) |
| Reconciliación | ❌ | No valida contra Caja/Inventario/Créditos |

**Código actual (backend/reports.service.ts:32-34):**
```typescript
const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
const totalSales = sales.length;
const averageTicket = totalSales ? totalRevenue / totalSales : 0;
```

**Problema:** `totalRevenue` suma TODO, incluyendo ventas a crédito. Debería ser:
```typescript
// Ingresos = solo ventas REGULAR (excluye CREDIT)
const totalIncome = sales
  .filter(s => s.type === SaleType.REGULAR)
  .reduce((sum, sale) => sum + Number(sale.total || 0), 0);

// Ventas = TODO
const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
```

---

### 2.2 Reporte de Ventas (Detalle)

#### ✅ Implementado
- Listado de ventas con fechas
- Total por método de pago
- Filtros por rango de fechas
- Descarga CSV

#### ❌ Faltante
| Campo Esperado | Estado | Notas |
|----------------|--------|-------|
| Nº factura (DIAN) | ❌ | Solo hay `saleNumber` interno |
| Cliente | ⚠️ | Sale tiene `customerId` pero no se expone en reporte |
| Usuario (cajero) | ⚠️ | Sale tiene `userId` pero no se expone |
| Subtotal | ❌ | No desglosado |
| IVA (19%/5%/exento) | ❌ | No desglosado por tasa |
| INC | ❌ | No implementado |
| Descuento (línea + global) | ❌ | No desglosado |
| Base gravable por ítem | ❌ | No calculado |
| Estado (completada/anulada) | ❌ | No hay estados de venta |

**Agrupaciones faltantes:**
- ❌ Por día
- ❌ Por hora (heatmap visual)
- ❌ Por usuario
- ❌ Por método
- ❌ Por cliente

---

### 2.3 Reporte de Inventario

#### ✅ Implementado
- Stock actual por producto
- Valor total del inventario
- Productos con stock bajo
- Productos sin stock
- Productos más/menos vendidos

#### ❌ Faltante
| Requerimiento | Estado | Gap |
|--------------|--------|-----|
| Movimientos por rango de fecha | ❌ | No implementado |
| Usuario que hizo ajuste | ❌ | `InventoryMovement` tiene `userId` pero no se reporta |
| Razón de ajuste | ❌ | `InventoryMovement.notes` no se expone |
| Stock inicial + entradas - salidas | ❌ | No se calcula ni valida |
| Productos inactivos | ❌ | No se filtran/marcan |
| Export de movimientos | ❌ | Solo export de stock actual |

**Validación faltante:**
```typescript
// Por cada venta, debe existir salida correspondiente
// Por cada ajuste, entrada/salida con usuario y razón
// Stock actual = stock inicial + entradas - salidas
```

---

### 2.4 Reporte de Créditos (Cartera)

#### Estado
⚠️ **Parcialmente en otro módulo**

El reporte de créditos existe en `CreditView.tsx` pero **NO está integrado** en el módulo de Reportes (`DashboardView.tsx`).

#### ✅ En CreditView
- Lista de créditos pendientes/pagados/vencidos
- Por cliente: monto, abonos, saldo
- Fechas de creación y abonos
- Método de abono

#### ❌ Faltante en Reportes
- No aparece pestaña de "Créditos" en Dashboard
- No se exporta desde Reportes
- No hay métricas de cartera en Dashboard general
- No hay filtros por rango de fechas en exportaciones

---

### 2.5 Reporte de Caja / Arqueos

#### Estado
❌ **NO IMPLEMENTADO**

El módulo de Caja (`CashRegisterView.tsx`) tiene gestión de apertura/cierre pero **NO hay reporte histórico de arqueos**.

#### Requerimientos faltantes
- ❌ Historial de aperturas/cierres
- ❌ Ingresos/egresos con concepto
- ❌ Ventas por método reconciliadas con cierre
- ❌ Esperado vs Real vs Diferencia
- ❌ Impresión de arqueos
- ❌ Export de arqueos históricos

---

## 3. Análisis Técnico

### 3.1 Timezone (Crítico)

**Problema:**
```typescript
// frontend/reportsService.ts:179-184
if (filters.startDate) {
  params.append('startDate', filters.startDate.toISOString())
}
```

`toISOString()` envía fecha en **UTC**. Si el usuario selecciona "Hoy" a las 00:00 Colombia, el backend recibe UTC-5.

**Solución:**
```typescript
// Convertir a timezone de Bogotá antes de enviar
import { format, toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Bogota';

const startDateLocal = toZonedTime(filters.startDate, TIMEZONE);
const startDateISO = format(startDateLocal, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: TIMEZONE });
params.append('startDate', startDateISO);
```

**Backend debe:**
```typescript
// Parsear con timezone
import { zonedTimeToUtc } from 'date-fns-tz';

const startDateUTC = zonedTimeToUtc(filters.startDate, 'America/Bogota');
```

---

### 3.2 Ingresos vs Ventas

**Código actual (backend/reports.service.ts:32):**
```typescript
const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
```

**Problema:** Suma TODO, incluyendo ventas a crédito.

**Solución:**
```typescript
// Ventas totales (todo)
const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

// Ingresos (solo lo que entra en caja hoy)
const totalIncome = sales
  .filter(s => s.type === SaleType.REGULAR) // Excluye CREDIT
  .reduce((sum, sale) => sum + Number(sale.total || 0), 0);

// Abonos a crédito que entraron HOY también suman a ingresos
const creditPaymentsToday = await this.getCreditsPaymentsInRange(filters);
const totalIncomeWithPayments = totalIncome + creditPaymentsToday;
```

---

### 3.3 Desglose de IVA

**Faltante:** No hay cálculo de IVA por tasa.

**Solución requerida:**
```typescript
interface TaxBreakdown {
  base19: number;    // Base gravable IVA 19%
  iva19: number;     // IVA 19%
  base5: number;     // Base gravable IVA 5%
  iva5: number;      // IVA 5%
  exempt: number;    // Exento
  inc: number;       // INC (si aplica)
}

// Por cada SaleItem
const taxBreakdown = this.calculateTaxBreakdown(sale.items);
```

---

### 3.4 Performance

**Problema:** No hay paginación.

**Código actual:**
```typescript
const sales = await this.salesService.findAll({
  startDate: filters.startDate,
  endDate: filters.endDate,
});
```

Si hay 10,000 ventas en un año, carga TODO en memoria.

**Solución:**
```typescript
// Opción 1: Paginación
const sales = await this.salesService.findAll({
  startDate: filters.startDate,
  endDate: filters.endDate,
  page: filters.page || 1,
  limit: filters.limit || 100
});

// Opción 2: Agregación en DB
const salesReport = await this.saleRepository
  .createQueryBuilder('sale')
  .select('SUM(sale.total)', 'totalRevenue')
  .where('sale.createdAt >= :start', { start: filters.startDate })
  .andWhere('sale.createdAt <= :end', { end: filters.endDate })
  .getRawOne();
```

---

## 4. Plan de Implementación Propuesto

### Fase 1: Correcciones Críticas (Alta Prioridad)
1. ✅ **Fix Timezone** - Usar `America/Bogota` en filtros de fecha
2. ✅ **Separar Ingresos vs Ventas** - Diferenciar en Dashboard
3. ✅ **Desglose de IVA** - Calcular base gravable por tasa
4. ✅ **Reconciliación básica** - Validar contra Caja y Créditos

### Fase 2: Reportes Faltantes (Media Prioridad)
5. ⚠️ **Reporte de Arqueos** - Historial de cierres de caja
6. ⚠️ **Movimientos de Inventario** - Detallar ajustes y ventas
7. ⚠️ **Integrar Créditos** - Pestaña en Dashboard

### Fase 3: Mejoras UX (Baja Prioridad)
8. 📊 **Gráficas mejoradas** - Heatmap, drilldown
9. 📥 **Exportaciones XLSX/PDF** - Además de CSV
10. ⚡ **Paginación** - Para rangos grandes

---

## 5. Estimación de Esfuerzo

| Fase | Tareas | Complejidad | Tiempo Est. |
|------|--------|-------------|-------------|
| Fase 1 | 4 correcciones críticas | Alta | 2-3 días |
| Fase 2 | 3 reportes nuevos | Media | 3-4 días |
| Fase 3 | Mejoras UX | Baja | 2-3 días |
| **TOTAL** | | | **7-10 días** |

---

## 6. Recomendaciones Inmediatas

### 6.1 Acción Inmediata
Implementar **Fase 1** para tener reportes confiables y reconciliables.

### 6.2 Testing Crítico
Antes de desplegar Fase 1:
```typescript
// Test de reconciliación
const salesTotal = getSalesReport().totalSales;
const cashRegisterTotal = getCashRegisterReport().totalIncome;
const creditTotal = getCreditsReport().totalPending;

assert(salesTotal === cashRegisterTotal + creditTotal, "Reconciliación fallida");
```

### 6.3 Documentación
Cada reporte debe tener tooltip explicando:
- **Ventas**: Total facturado (incluye crédito)
- **Ingresos**: Lo que entró en caja (excluye crédito, incluye abonos)
- **Créditos pendientes**: Saldo a recuperar

---

## 7. Anexo: Endpoints Backend Faltantes

### 7.1 Nuevos endpoints necesarios
```typescript
// GET /api/reports/cash-register?startDate=...&endDate=...
// Retorna historial de arqueos

// GET /api/reports/inventory-movements?startDate=...&endDate=...
// Retorna movimientos de inventario con razón

// GET /api/reports/tax-breakdown?startDate=...&endDate=...
// Retorna desglose de IVA por tasa
```

### 7.2 Modificaciones a endpoints existentes
```typescript
// GET /api/reports/sales
// AGREGAR:
interface SalesReport {
  totalSales: number;      // Total facturado
  totalIncome: number;     // NEW: Total ingresado en caja
  totalCredit: number;     // NEW: Total vendido a crédito
  // ... resto
}
```

---

**Fin del análisis.**
