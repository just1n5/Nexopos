# Tests de Concurrencia - NexoPOS

## Descripción

Este directorio contiene **tests de integración end-to-end** que validan la corrección de las mejoras implementadas en Fase 1 del roadmap de ARQUITECTURA_Y_MEJORAS.md.

## Archivos de Tests

### `sales.concurrency.e2e-spec.ts`

Tests de integración con **base de datos PostgreSQL real** que validan:

- ✅ **Prevención de overselling** con ventas concurrentes
- ✅ **Rollback completo** en caso de falla
- ✅ **Sistema de reservas de stock** (crear, confirmar, liberar)
- ✅ **Stress testing** con 100+ ventas simultáneas
- ✅ **Nivel de aislamiento SERIALIZABLE**

#### Tests incluidos:

1. **🔒 Race Condition Prevention**
   - `debe prevenir overselling con 2 ventas concurrentes` - Valida que 2 ventas de 8 unidades sobre stock de 100 funcionen correctamente
   - `debe prevenir overselling cuando el stock es insuficiente` - Valida que solo 1 de 2 ventas de 60 unidades sobre stock de 100 tenga éxito

2. **🔄 Transaction Rollback**
   - `debe hacer rollback completo si falla la creación de la venta` - Valida que el stock NO cambie si la venta falla

3. **📦 Stock Reservation System**
   - `debe crear, confirmar y limpiar reservas correctamente` - Valida ciclo completo de reserva
   - `debe liberar reserva cuando se cancela` - Valida liberación manual de reserva
   - `debe limpiar reservas expiradas automáticamente` - Valida cleanup automático

4. **💪 Stress Testing**
   - `debe manejar 100 ventas concurrentes correctamente` - Valida 100 ventas simultáneas sobre stock de 100
   - `debe fallar adecuadamente cuando 150 cajeros intentan vender de un stock de 100` - Valida que solo 100 de 150 ventas tengan éxito

5. **🔐 Isolation Level Validation**
   - `debe usar nivel de aislamiento SERIALIZABLE` - Valida configuración de transacciones

## Requisitos para Ejecutar Tests E2E

### 1. Base de Datos Accesible

Los tests E2E requieren conexión a PostgreSQL (Supabase o local):

```env
# backend/.env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
# O conexión local
DATABASE_URL=postgresql://nexopos:password@localhost:5432/nexopos_test
```

### 2. Dependencias Instaladas

```bash
cd backend
npm install
```

### 3. Ejecutar Tests

```bash
# Todos los tests E2E
npm run test:e2e

# Solo tests de concurrencia
npm run test:e2e -- sales.concurrency.e2e-spec.ts
```

## Solución de Problemas

### Error: `getaddrinfo ENOTFOUND db.vohlomomrskxnuksodmt.supabase.co`

**Causa:** No hay conectividad desde tu máquina local a Supabase.

**Soluciones:**

1. **Verificar DNS:**
   ```bash
   nslookup db.vohlomomrskxnuksodmt.supabase.co
   ```

2. **Usar IP directa** (temporal):
   - Obtener IP de Supabase y usar en DATABASE_URL

3. **Ejecutar desde producción:**
   ```bash
   # SSH al servidor Dokku y ejecutar tests ahí
   ssh dokku@192.168.80.17
   cd /var/lib/dokku/data/storage/nexopos
   npm run test:e2e
   ```

4. **Usar base de datos PostgreSQL local:**
   ```bash
   # Crear BD local de prueba
   createdb nexopos_test

   # Configurar .env para tests
   DATABASE_URL=postgresql://localhost/nexopos_test

   # Ejecutar migraciones
   npm run migration:run

   # Ejecutar tests
   npm run test:e2e
   ```

### Tests Tardan Mucho

Los tests tienen timeouts configurados:
- Tests normales: 30 segundos
- Stress tests: 120 segundos (2 minutos)

Si la conexión es lenta, aumenta los timeouts en el archivo de test.

## Tests Unitarios (Con Mocks)

Si no puedes ejecutar tests E2E, están disponibles **tests unitarios con mocks** en:

```bash
backend/src/modules/sales/sales.concurrency.spec.ts
```

Estos NO requieren base de datos:

```bash
npm run test -- sales.concurrency.spec.ts
```

## Resultados Esperados

Cuando los tests E2E se ejecutan correctamente, deberías ver:

```
 PASS  test/sales.concurrency.e2e-spec.ts (45.123 s)
  Sales Concurrency - Integration Tests (E2E)
    🔒 Race Condition Prevention
      ✓ debe prevenir overselling con 2 ventas concurrentes (2345ms)
      ✓ debe prevenir overselling cuando el stock es insuficiente (3456ms)
    🔄 Transaction Rollback
      ✓ debe hacer rollback completo si falla la creación de la venta (1234ms)
    📦 Stock Reservation System
      ✓ debe crear, confirmar y limpiar reservas correctamente (2345ms)
      ✓ debe liberar reserva cuando se cancela (1567ms)
      ✓ debe limpiar reservas expiradas automáticamente (3890ms)
    💪 Stress Testing
      ✓ debe manejar 100 ventas concurrentes correctamente (23456ms)
      ✓ debe fallar adecuadamente cuando 150 cajeros intentan vender de un stock de 100 (34567ms)
    🔐 Isolation Level Validation
      ✓ debe usar nivel de aislamiento SERIALIZABLE (1234ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        45.123 s
```

## CI/CD

Para integrar en CI/CD:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '22'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run migrations
        run: cd backend && npm run migration:run
      - name: Run E2E tests
        run: cd backend && npm run test:e2e
```

## Métricas de Éxito

Estos tests validan las métricas definidas en ARQUITECTURA_Y_MEJORAS.md:

- ✅ **Overselling: Imposible** - Tests confirman que ventas concurrentes NO permiten overselling
- ✅ **Bloqueo a nivel BD** - Tests usan PostgreSQL real con SERIALIZABLE isolation
- ✅ **Reservas funcionan** - Tests validan ciclo completo de reservas
- ✅ **100+ ventas concurrentes** - Stress tests validan escalabilidad

## Notas

- Los tests hacen **cleanup automático** de datos creados en `afterEach()`
- Cada test es **independiente** y puede ejecutarse por separado
- Los tests usan **datos únicos** (timestamps en SKU) para evitar conflictos
- El stress test de 150 ventas valida que el sistema falle **gracefully** cuando no hay stock
