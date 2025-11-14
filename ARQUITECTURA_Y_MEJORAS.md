# ARQUITECTURA Y PLAN DE MEJORAS TÉCNICAS - NexoPOS

**Fecha de análisis:** 2025-11-13
**Última actualización:** 2025-11-14
**Estado:** Fase 1 COMPLETADA ✅ | Fase 2 en progreso 🚧
**Versión:** MVP 1.0 + Mejoras Críticas de Concurrencia

---

## RESUMEN EJECUTIVO

El sistema NexoPOS tiene una **arquitectura bien estructurada** pero sufre de **problemas críticos de consistencia transaccional** en los módulos de Ventas, Inventario y Caja. Estos problemas pueden causar:

- ❌ **Overselling** (vender más de lo disponible en stock)
- ❌ **Stock fantasma** (ventas sin descuento de inventario)
- ❌ **Desbalance de caja** (transacciones no registradas)

**Prioridad:** CRÍTICA antes de escalar a múltiples usuarios concurrentes.

---

## PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 CRÍTICO #1: Race Condition en Ventas Concurrentes

**Archivo:** `backend/src/modules/sales/sales.service.ts`
**Líneas:** 100-110

**Problema:**
```typescript
// Validación de stock FUERA de la transacción
for (const itemDto of createSaleDto.items) {
  const productInfo = await this.getProductInfo(itemDto.productId, tenantId);

  if (productInfo.stock < itemDto.quantity) {
    throw new BadRequestException(`Stock insuficiente...`);
  }
}

// ... Luego INICIA la transacción
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();
```

**Escenario de fallo:**
```
T0: Producto con stock = 10
T1: Venta A valida: 10 >= 8 ✅
T2: Venta B valida: 10 >= 8 ✅  (Lee el MISMO stock)
T3: Venta A commit
T4: Venta B commit
T5: Inventario intenta descontar 16 de 10 → OVERSELLING
```

**Impacto:** 🔴 ALTA probabilidad con múltiples cajeros

**Solución:**
```typescript
async create(createSaleDto: CreateSaleDto, userId: string, tenantId: string) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction('SERIALIZABLE'); // ⬅️ Nivel más alto

  try {
    // 1. Reservar stock CON BLOQUEO PESIMISTA
    for (const item of createSaleDto.items) {
      const stock = await queryRunner.manager
        .createQueryBuilder()
        .select('stock')
        .from(InventoryStock, 'stock')
        .where('stock.productId = :productId', { productId: item.productId })
        .setLock('pessimistic_write') // ⬅️ LOCK
        .getOne();

      if (!stock || stock.quantity < item.quantity) {
        throw new BadRequestException(`Stock insuficiente`);
      }

      // 2. Actualizar stock DENTRO de la misma transacción
      stock.quantity -= item.quantity;
      await queryRunner.manager.save(stock);
    }

    // 3. Crear venta
    const sale = await queryRunner.manager.save(Sale, {...});

    await queryRunner.commitTransaction();
    return sale;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  }
}
```

---

### 🔴 CRÍTICO #2: Actualización de Inventario Fuera de Transacción

**Archivo:** `backend/src/modules/sales/sales.service.ts`
**Líneas:** 217-236

**Problema:**
```typescript
// POST-COMMIT operations (fuera de transacción)
try {
  for (const update of inventoryUpdates) {
    await this.inventoryService.adjustStock(/* ... */); // ⬅️ Transacción separada
  }
} catch (error) {
  console.error('Error in post-transaction operations:', error);
  // Return the sale anyway ⚠️
  return this.findOne(savedSale.id);
}
```

**Consecuencias:**
1. La venta se confirma ANTES de actualizar inventario
2. Si `adjustStock()` falla, la venta YA EXISTE en BD
3. No hay mecanismo de compensación automática

**Impacto:** 🟡 MEDIA probabilidad, ALTO impacto

**Solución:** Mover `adjustStock()` DENTRO de la transacción principal (ver solución #1)

---

### 🔴 CRÍTICO #3: Transacciones No Atómicas

**Problema:** Tres sistemas independientes:
- `SalesService.create()` → Transacción 1
- `InventoryService.adjustStock()` → Transacción 2
- `CashRegisterService.registerSalePayment()` → Transacción 3

**Diagrama de flujo actual:**
```
┌─────────────────────┐
│ TRANSACCION 1       │ ✅ Venta creada
│ (SalesService)      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ TRANSACCION 2       │ ❌ Puede fallar
│ (InventoryService)  │    (pero venta YA existe)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ TRANSACCION 3       │ ❌ Puede fallar
│ (CashRegisterService│    (errores se ignoran)
└─────────────────────┘
```

**Solución:** Transacción distribuida o Saga Pattern (ver sección de soluciones)

---

## PROBLEMAS IMPORTANTES

### 🟡 IMPORTANTE #4: Registro de Caja No Crítico

**Archivo:** `backend/src/modules/sales/sales.service.ts:300-324`

**Problema:**
```typescript
try {
  await this.cashRegisterService.registerSalePayment(null, {...});
} catch (error) {
  console.error('Error registering sale in cash register:', error);
  // Don't fail the sale ⚠️
}
```

**Impacto:** Ventas exitosas pero no registradas en caja → desbalance en arqueo

---

### 🟡 IMPORTANTE #5: IVA Hardcoded

**Archivo:** `backend/src/modules/sales/sales.service.ts:712`

```typescript
const taxRate = 19; // ⚠️ Hardcoded
```

**Problema:** No permite productos con IVA diferente (0%, 5%, etc.)

**Solución:** Usar `productInfo.taxRate` dinámicamente

---

## ROADMAP DE MEJORAS PRIORIZADAS

### FASE 1: CRÍTICAS - Consistencia Transaccional ✅ COMPLETADA

#### 1.1 Implementar Bloqueos Pesimistas en Ventas ✅
**Prioridad:** 🔴 URGENTE
**Esfuerzo:** 3 días → **Completado: 2025-11-14**
**Archivos modificados:**
- `backend/src/modules/sales/sales.service.ts` ✅
- `backend/src/modules/inventory/inventory.service.ts` ✅

**Tareas completadas:**
- [x] Refactor `create()` para iniciar transacción ANTES de validar stock
- [x] Implementar `SELECT FOR UPDATE` en consultas de stock (pessimistic_write)
- [x] Usar nivel de aislamiento `SERIALIZABLE`
- [x] Tests de concurrencia (mocks y E2E)

**Implementación:** Commit 641c763

---

#### 1.2 Transacción Atómica Venta-Inventario ✅
**Prioridad:** 🔴 URGENTE
**Esfuerzo:** 5 días → **Completado: 2025-11-14**

**Opción A: Transacción Monolítica (Recomendada para MVP)**
```typescript
async create(createSaleDto, userId, tenantId) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    // 1. Validar y reservar stock (CON LOCK)
    // 2. Crear venta
    // 3. Actualizar inventario
    // 4. Crear movimientos de inventario
    // 5. Registrar en caja (si hay sesión abierta)

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  }
}
```

**Opción B: Saga Pattern con Compensación**
```typescript
async create() {
  let sale, inventoryUpdated = false, cashRegistered = false;

  try {
    sale = await this.createSaleTransaction();
    inventoryUpdated = await this.updateInventoryTransaction(sale);
    cashRegistered = await this.registerCashTransaction(sale);
    return sale;
  } catch (error) {
    // COMPENSACION
    if (cashRegistered) await this.revertCashTransaction(sale);
    if (inventoryUpdated) await this.revertInventoryTransaction(sale);
    if (sale) await this.cancelSale(sale.id);
    throw error;
  }
}
```

**Decisión:** Opción A implementada (Transacción Monolítica)

**Tareas completadas:**
- [x] Decidir entre Opción A o B → Opción A seleccionada
- [x] Refactorizar SalesService.create() con transacción única
- [x] Mover lógica de stock UPDATE dentro de transacción principal
- [x] Integrar sistema de reservas (confirmReservation) dentro de transacción
- [x] Implementar rollback completo automático
- [x] Tests de transacciones (mocks + E2E)

**Implementación:** Commit 641c763

---

#### 1.3 Sistema de Reservas de Stock ✅
**Prioridad:** 🟡 IMPORTANTE
**Esfuerzo:** 4 días → **Completado: 2025-11-14**

**Estructura:**
```typescript
// Usar campo EXISTENTE en InventoryStock
class InventoryStock {
  quantity: number;
  reservedQuantity: number; // ✅ Ya existe
  availableQuantity: number; // quantity - reservedQuantity
}

// Flujo de venta:
async create() {
  // 1. RESERVAR stock
  await this.inventoryService.reserveStock(productId, quantity, saleId);

  // 2. Crear venta
  const sale = await this.saveSale();

  // 3. CONFIRMAR reserva (descuenta de quantity)
  await this.inventoryService.confirmReservation(saleId);

  // En caso de error: LIBERAR reserva
  await this.inventoryService.releaseReservation(saleId);
}
```

**Implementación:**
- **Entity:** `backend/src/modules/inventory/entities/stock-reservation.entity.ts`
- **Migration:** `backend/src/migrations/1761534600000-CreateStockReservationsTable.ts`
- **Service:** `backend/src/modules/inventory/inventory.service.ts`

**Tareas completadas:**
- [x] Implementar `reserveStock()` con bloqueo pesimista
- [x] Implementar `confirmReservation()` con descuento atómico de stock
- [x] Implementar `releaseReservation()` con liberación de reservedQuantity
- [x] Cleanup job para reservas expiradas cada 5 minutos (scheduled-tasks.service.ts)
- [x] Tests unitarios con mocks
- [x] Tests E2E con base de datos real

**Implementación:** Commit 641c763

**Verificación en producción:**
```bash
# Logs del cron job ejecutándose cada 5 minutos:
2025-11-14T04:50:00 AM - 🧹 Iniciando limpieza de reservas de stock expiradas...
2025-11-14T04:50:00 AM - ✅ No hay reservas expiradas para limpiar
```

---

### FASE 2: IMPORTANTES - Testing y Monitoreo 🚧 EN PROGRESO

#### 2.1 Tests de Concurrencia ✅ IMPLEMENTADO
**Prioridad:** 🟡 IMPORTANTE
**Esfuerzo:** 3 días → **Completado: 2025-11-14**

**Archivos creados:**
- `backend/test/sales.concurrency.e2e-spec.ts` - Tests E2E con BD real (9 tests)
- `backend/src/modules/sales/sales.concurrency.spec.ts` - Tests unitarios con mocks (3 tests)
- `backend/test/README.md` - Documentación de tests

**Tests implementados (E2E):**

1. **🔒 Race Condition Prevention**
   - ✅ Prevención de overselling con 2 ventas concurrentes
   - ✅ Prevención de overselling cuando stock es insuficiente

2. **🔄 Transaction Rollback**
   - ✅ Rollback completo si falla la creación de venta

3. **📦 Stock Reservation System**
   - ✅ Crear, confirmar y limpiar reservas correctamente
   - ✅ Liberar reserva cuando se cancela
   - ✅ Limpiar reservas expiradas automáticamente

4. **💪 Stress Testing**
   - ✅ Manejar 100 ventas concurrentes correctamente
   - ✅ Fallar adecuadamente con 150 ventas sobre stock de 100

5. **🔐 Isolation Level Validation**
   - ✅ Validar uso de nivel SERIALIZABLE

**Tareas completadas:**
- [x] Setup de testing con transacciones y base de datos real
- [x] Tests de race conditions (overselling scenarios)
- [x] Tests de rollback atómico
- [x] Tests de stress (100+ y 150 ventas simultáneas)
- [x] Documentación completa en backend/test/README.md
- [ ] CI/CD con tests obligatorios (pendiente - requiere configuración de GitHub Actions)

**Nota:** Los tests E2E requieren conectividad a PostgreSQL (Supabase o local). Ver `backend/test/README.md` para instrucciones de ejecución.

---

#### 2.2 Monitoring y Alertas
**Prioridad:** 🟡 IMPORTANTE
**Esfuerzo:** 2 días

**Dashboard de Inconsistencias:**
```sql
-- Ventas sin movimiento de inventario
SELECT s.id, s.saleNumber, s.total, s.createdAt
FROM sales s
LEFT JOIN inventory_movements im ON im.referenceId = s.id AND im.referenceType = 'sale'
WHERE im.id IS NULL
AND s.status = 'COMPLETED';

-- Diferencia de tiempo entre venta e inventario (>5 min = problema)
SELECT s.saleNumber,
       s.createdAt as saleTime,
       im.createdAt as inventoryTime,
       EXTRACT(EPOCH FROM (im.createdAt - s.createdAt)) as delaySeconds
FROM sales s
JOIN inventory_movements im ON im.referenceId = s.id
WHERE im.createdAt > s.createdAt + INTERVAL '5 minutes';
```

**Tareas:**
- [ ] Endpoint `/api/health/consistency-check`
- [ ] Script de reconciliación diaria
- [ ] Alertas por email si hay inconsistencias
- [ ] Dashboard admin con métricas

---

### FASE 3: RECOMENDADAS - Escalabilidad (2-3 semanas)

#### 3.1 Queue System para Operaciones Post-Venta
**Prioridad:** 🟢 RECOMENDADO
**Esfuerzo:** 5 días

**Stack:** Bull Queue + Redis

```typescript
// sales.service.ts
async create() {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    // Operaciones CRITICAS (síncronas)
    const sale = await this.saveSale();
    await this.updateInventory();

    await queryRunner.commitTransaction();

    // Operaciones NO-CRITICAS (asíncronas via queue)
    await this.postSaleQueue.add('journal-entry', { saleId: sale.id });
    await this.postSaleQueue.add('email-receipt', { saleId: sale.id });

    return sale;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  }
}
```

**Tareas:**
- [ ] Setup Bull Queue + Redis
- [ ] Queue para journal entries
- [ ] Queue para emails
- [ ] Queue para notificaciones
- [ ] Retry automático con backoff
- [ ] Dashboard de queue status

---

#### 3.2 Event Sourcing (Opcional - Avanzado)
**Prioridad:** 🟢 FUTURO
**Esfuerzo:** 3 semanas

Reemplazar estado mutable con eventos inmutables:

```typescript
// En vez de UPDATE
sale.status = 'COMPLETED';
await saleRepository.save(sale);

// Usar EVENTOS
await eventStore.append(new SaleCompletedEvent({ saleId, timestamp, ... }));

// Reconstruir estado desde eventos
const sale = await eventStore.rebuild(Sale, saleId);
```

**Beneficios:**
- ✅ Audit trail completo
- ✅ Time travel debugging
- ✅ CQRS para reporting
- ❌ Complejidad arquitectónica alta

---

## PLAN DE ACCIÓN SUGERIDO (3 Meses)

### Mes 1: Críticas
**Semana 1-2:**
- Implementar bloqueos pesimistas
- Refactor transacción venta-inventario

**Semana 3-4:**
- Sistema de reservas de stock
- Tests de concurrencia básicos

**Entregable:** Sistema que NO permite overselling

---

### Mes 2: Testing y Estabilización
**Semana 5-6:**
- Suite completa de tests de concurrencia
- Stress testing con 100+ ventas simultáneas
- Fixes de bugs encontrados

**Semana 7-8:**
- Monitoring y dashboard de inconsistencias
- Script de reconciliación diaria
- Alertas automáticas

**Entregable:** Sistema monitoreado con alertas

---

### Mes 3: Escalabilidad
**Semana 9-10:**
- Queue system con Bull + Redis
- Operaciones asíncronas

**Semana 11-12:**
- Optimizaciones de performance
- Documentación técnica
- Training de equipo

**Entregable:** Sistema listo para multi-tienda

---

## MÉTRICAS DE ÉXITO

### Antes de las mejoras (2025-11-13):
- ❌ Overselling: Posible con 2+ cajeros concurrentes
- ❌ Inconsistencias venta-inventario: Sin detección automática
- ❌ Tests de concurrencia: 0 tests
- ❌ Sistema de reservas: No existía
- ❌ Transacciones: No atómicas (3 transacciones separadas)
- ❌ Nivel de aislamiento: READ COMMITTED (por defecto)

### Después de Fase 1 (2025-11-14): ✅ COMPLETADO
- ✅ Overselling: **IMPOSIBLE** (bloqueado con pessimistic_write + SERIALIZABLE)
- ✅ Transacciones: **ATÓMICAS** (venta + inventario + reservas en 1 transacción)
- ✅ Sistema de reservas: **IMPLEMENTADO** (crear, confirmar, liberar, cleanup automático)
- ✅ Tests de concurrencia: **12 tests** (3 unitarios + 9 E2E)
  - ✅ Tests de race conditions
  - ✅ Tests de rollback
  - ✅ Stress test con 100+ ventas simultáneas
  - ✅ Validación de reservas
- ✅ Nivel de aislamiento: **SERIALIZABLE** en todas las operaciones críticas
- ✅ Cleanup automático: **Cron job** cada 5 minutos para reservas expiradas
- ✅ Deployado en producción: **Verificado funcionando** en Dokku/Supabase

### Próximos pasos (Fase 2):
- ⏳ Monitoring y alertas de inconsistencias
- ⏳ Dashboard de métricas de stock
- ⏳ CI/CD con tests obligatorios

---

## ANEXO: EVIDENCIA DE PROBLEMAS EXISTENTES

### Script de corrección encontrado:
**Archivo:** `backend/src/scripts/fixes/add-initial-stock.ts`

```typescript
// Script to add initial stock to all products that have 0 stock
// This is a one-time fix to ensure all products have stock for testing
```

Este script confirma que el problema de sincronización inventario-ventas **YA HA OCURRIDO** en el pasado.

---

## CONCLUSIÓN

### Estado Actual (2025-11-14)

✅ **FASE 1 COMPLETADA:** NexoPOS ahora tiene consistencia transaccional robusta y está listo para soportar **múltiples usuarios concurrentes** sin riesgo de overselling.

**Mejoras implementadas:**
1. ✅ Transacciones atómicas con nivel SERIALIZABLE
2. ✅ Bloqueos pesimistas para prevenir race conditions
3. ✅ Sistema completo de reservas de stock
4. ✅ Tests de concurrencia (12 tests implementados)
5. ✅ Cleanup automático de reservas expiradas
6. ✅ Deployado y verificado en producción

**Próximos pasos (Fase 2):**
- Implementar monitoring y alertas
- Dashboard de métricas en tiempo real
- CI/CD con tests automáticos

**Recomendación:** El sistema ahora es **production-ready** para entornos con múltiples cajeros concurrentes. Se puede proceder con:
- Escalamiento a múltiples tiendas
- Onboarding de más usuarios simultáneos
- Implementación de Fase 2 y 3 para optimización adicional

---

**Última actualización:** 2025-11-14
**Próxima revisión:** Después de implementar FASE 2
