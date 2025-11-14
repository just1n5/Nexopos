# PLAN DE PRUEBAS DE FLUJOS - NexoPOS

**Fecha:** 2025-11-14
**Versión:** MVP 1.0 + Mejoras Críticas de Concurrencia
**Estado:** Listo para pruebas

---

## USUARIOS DE PRUEBA

Ejecuta primero el seeder de usuarios:

```bash
cd backend
npm run seed:test-users
```

### Credenciales de Prueba:

| Rol | Email | Password | Permisos |
|-----|-------|----------|----------|
| **Super Admin** | superadmin@test.nexopos.co | SuperAdmin123! | Gestión de plataforma |
| **Admin** | admin@test.nexopos.co | Admin123! | Acceso total |
| **Manager** | manager@test.nexopos.co | Manager123! | Reportes, inventario, config |
| **Cajero 1** | cajero1@test.nexopos.co | Cajero123! | Ventas, caja, fiado |
| **Cajero 2** | cajero2@test.nexopos.co | Cajero123! | Pruebas de concurrencia |
| **Cajero 3** | cajero3@test.nexopos.co | Cajero123! | Pruebas de concurrencia |

---

## MÓDULO 1: INVENTARIO

### FLUJO 1.1: Agregar Producto Nuevo

**Objetivo:** Validar creación de productos y asignación de stock inicial

**Precondiciones:**
- ✅ Usuario: Admin o Manager
- ✅ Categorías creadas
- ✅ Impuestos configurados (IVA 19%)

**Pasos:**

1. **Login**
   - Ir a `/login`
   - Ingresar: `admin@test.nexopos.co` / `Admin123!`
   - Verificar redirección a dashboard

2. **Navegar a Productos**
   - Click en "F2: Inventario" o navegar a `/inventory`
   - Click en "Agregar Producto"

3. **Completar Formulario**
   - **Nombre:** `Coca Cola 350ml`
   - **SKU:** `COCA-350ML`
   - **Código de Barras:** `7702001000014` (o escanear)
   - **Categoría:** `Bebidas`
   - **Precio de Costo:** `1500`
   - **Precio de Venta:** `3000`
   - **IVA:** `19%`
   - **Stock Inicial:** `100` unidades
   - **Stock Mínimo:** `10` unidades

4. **Guardar Producto**
   - Click en "Guardar"
   - Verificar mensaje de éxito
   - Verificar que aparece en la lista de productos

5. **Verificar Stock**
   - Ir a pestaña "Stock"
   - Verificar:
     - `quantity`: 100
     - `reservedQuantity`: 0
     - `availableQuantity`: 100

**Resultado Esperado:**
- ✅ Producto creado correctamente
- ✅ Stock inicial registrado
- ✅ Movimiento de inventario tipo "INITIAL_STOCK" creado

**Datos de Prueba Adicionales:**

| Producto | SKU | Barcode | Precio Costo | Precio Venta | Stock Inicial |
|----------|-----|---------|--------------|--------------|---------------|
| Agua Cristal 600ml | AGUA-600ML | 7702001000021 | 800 | 1500 | 200 |
| Pan Tajado Bimbo | PAN-TAJADO | 7702001000038 | 2500 | 5000 | 50 |
| Leche Alpina 1L | LECHE-1L | 7702001000045 | 3000 | 5500 | 80 |
| Huevos AA x30 | HUEVOS-30 | 7702001000052 | 8000 | 12000 | 20 |

---

### FLUJO 1.2: Ajuste de Inventario (Entrada)

**Objetivo:** Validar incremento de stock

**Precondiciones:**
- ✅ Producto "Coca Cola 350ml" creado
- ✅ Stock actual: 100 unidades

**Pasos:**

1. **Buscar Producto**
   - En lista de productos, buscar "Coca Cola"
   - Click en "Ajustar Stock"

2. **Crear Ajuste de Entrada**
   - **Tipo:** `Entrada`
   - **Cantidad:** `50` unidades
   - **Razón:** `Compra a proveedor`
   - **Notas:** `Factura #12345`

3. **Confirmar Ajuste**
   - Click en "Guardar"
   - Verificar mensaje de confirmación

4. **Verificar Actualización**
   - Stock debe ser: `150` unidades (100 + 50)
   - Verificar movimiento en historial

**Resultado Esperado:**
- ✅ Stock incrementado correctamente
- ✅ Movimiento tipo "PURCHASE" registrado
- ✅ availableQuantity actualizado

---

### FLUJO 1.3: Ajuste de Inventario (Salida)

**Objetivo:** Validar decremento de stock por daño/pérdida

**Pasos:**

1. **Crear Ajuste de Salida**
   - Producto: "Coca Cola 350ml"
   - **Tipo:** `Salida`
   - **Cantidad:** `5` unidades
   - **Razón:** `Producto dañado`

2. **Verificar Actualización**
   - Stock debe ser: `145` unidades (150 - 5)
   - Movimiento tipo "DAMAGE" registrado

**Resultado Esperado:**
- ✅ Stock decrementado correctamente
- ✅ Razón de salida documentada

---

### FLUJO 1.4: Escaneo de Código de Barras

**Objetivo:** Validar búsqueda rápida por código de barras

**Pasos:**

1. **Activar Scanner**
   - En cualquier vista de inventario
   - Click en icono de scanner o presionar `Ctrl+B`

2. **Escanear Producto**
   - Escanear código `7702001000014`
   - Verificar que se muestra el producto correcto

3. **Ver Detalles**
   - Verificar stock actual
   - Verificar precio de venta

**Resultado Esperado:**
- ✅ Búsqueda instantánea
- ✅ Información correcta mostrada

---

## MÓDULO 2: VENTAS (POS)

### FLUJO 2.1: Venta Simple en Efectivo

**Objetivo:** Validar flujo completo de venta básica

**Precondiciones:**
- ✅ Usuario: Cajero 1
- ✅ Caja abierta (ver Módulo 3)
- ✅ Productos en stock

**Pasos:**

1. **Login como Cajero**
   - Email: `cajero1@test.nexopos.co`
   - Password: `Cajero123!`

2. **Abrir POS**
   - Navegar a `/` o presionar `F1`
   - Verificar que caja esté abierta

3. **Agregar Productos**
   - Escanear o buscar: "Coca Cola 350ml"
   - Cantidad: `2` unidades
   - Escanear: "Agua Cristal 600ml"
   - Cantidad: `3` unidades

4. **Verificar Totales**
   - Subtotal: `2×3000 + 3×1500 = $10,500`
   - IVA 19%: `$1,995`
   - Total: `$12,495`

5. **Procesar Pago**
   - Click en "Pagar" o presionar `F9`
   - Método: `Efectivo`
   - Recibido: `$15,000`
   - Cambio: `$2,505`

6. **Confirmar Venta**
   - Click en "Confirmar Venta"
   - Verificar mensaje de éxito
   - Verificar número de venta generado

7. **Verificar Descuento de Stock**
   - Ir a Inventario
   - Coca Cola: 145 → `143` (-2)
   - Agua Cristal: 200 → `197` (-3)

**Resultado Esperado:**
- ✅ Venta registrada correctamente
- ✅ Stock descontado atómicamente
- ✅ Movimientos de inventario creados
- ✅ Recibo imprimible generado
- ✅ Balance de caja actualizado

---

### FLUJO 2.2: Venta con Descuento

**Objetivo:** Validar aplicación de descuentos

**Pasos:**

1. **Agregar Productos**
   - Pan Tajado: 1 × $5,000

2. **Aplicar Descuento**
   - Click en producto
   - Aplicar descuento: `10%`
   - Nuevo precio: `$4,500`

3. **Verificar Totales**
   - Subtotal con descuento
   - IVA sobre precio con descuento

4. **Procesar Pago**
   - Método: Efectivo
   - Confirmar venta

**Resultado Esperado:**
- ✅ Descuento aplicado correctamente
- ✅ IVA calculado sobre precio con descuento

---

### FLUJO 2.3: Venta con Múltiples Métodos de Pago

**Objetivo:** Validar pago combinado

**Pasos:**

1. **Agregar Productos**
   - Total a pagar: `$50,000`

2. **Procesar Pagos Mixtos**
   - Efectivo: `$30,000`
   - Tarjeta: `$15,000`
   - Nequi: `$5,000`
   - **Total:** `$50,000`

3. **Confirmar Venta**
   - Verificar que se registran 3 pagos

**Resultado Esperado:**
- ✅ Múltiples pagos registrados
- ✅ Balance de caja actualizado correctamente
- ✅ Venta completada

---

### FLUJO 2.4: Venta a Crédito (Fiado)

**Objetivo:** Validar ventas a crédito

**Precondiciones:**
- ✅ Cliente creado con límite de crédito

**Pasos:**

1. **Seleccionar Cliente**
   - Buscar cliente: `María González`
   - Verificar límite de crédito: `$500,000`

2. **Agregar Productos**
   - Total: `$25,000`

3. **Seleccionar Pago**
   - Método: `Crédito/Fiado`
   - Fecha de vencimiento: `+15 días`

4. **Confirmar Venta**
   - Verificar venta registrada como crédito

5. **Verificar Balance Cliente**
   - Ir a módulo de Fiado
   - Deuda actual: `$25,000`
   - Límite disponible: `$475,000`

**Resultado Esperado:**
- ✅ Venta a crédito registrada
- ✅ Deuda de cliente actualizada
- ✅ Stock descontado normalmente

---

### FLUJO 2.5: Cancelar Venta

**Objetivo:** Validar cancelación de venta

**Pasos:**

1. **Iniciar Venta**
   - Agregar varios productos

2. **Cancelar Venta**
   - Click en "Cancelar" o presionar `ESC`
   - Confirmar cancelación

3. **Verificar Estado**
   - Carrito vacío
   - Stock NO afectado

**Resultado Esperado:**
- ✅ Venta cancelada sin afectar stock

---

## MÓDULO 3: CAJA

### FLUJO 3.1: Apertura de Caja

**Objetivo:** Validar inicio de turno

**Precondiciones:**
- ✅ Caja cerrada o sin sesión activa

**Pasos:**

1. **Login como Cajero**
   - Email: `cajero1@test.nexopos.co`

2. **Abrir Caja**
   - Ir a "F4: Caja"
   - Click en "Abrir Caja"

3. **Ingresar Datos de Apertura**
   - **Monto inicial:** `$100,000`
   - **Notas:** `Apertura turno mañana`

4. **Confirmar Apertura**
   - Click en "Abrir"
   - Verificar mensaje de éxito

5. **Verificar Sesión**
   - Número de sesión generado
   - Balance inicial: `$100,000`
   - Estado: `ABIERTA`

**Resultado Esperado:**
- ✅ Sesión de caja creada
- ✅ Movimiento de apertura registrado
- ✅ Cajero puede realizar ventas

---

### FLUJO 3.2: Registro de Movimientos de Caja

**Objetivo:** Validar entradas/salidas de efectivo

**Precondiciones:**
- ✅ Caja abierta

**Pasos - Entrada de Efectivo:**

1. **Registrar Entrada**
   - Click en "Entrada de Efectivo"
   - **Monto:** `$50,000`
   - **Concepto:** `Préstamo de caja central`
   - **Notas:** `Ref #ABC123`

2. **Confirmar**
   - Verificar balance actualizado: `$150,000`

**Pasos - Salida de Efectivo:**

1. **Registrar Salida**
   - Click en "Salida de Efectivo"
   - **Monto:** `$20,000`
   - **Concepto:** `Pago a proveedor`
   - **Notas:** `Factura #XYZ789`

2. **Confirmar**
   - Verificar balance actualizado: `$130,000`

**Resultado Esperado:**
- ✅ Movimientos registrados correctamente
- ✅ Balance actualizado en tiempo real

---

### FLUJO 3.3: Cierre de Caja con Arqueo

**Objetivo:** Validar cierre de turno y conteo de efectivo

**Precondiciones:**
- ✅ Caja abierta con ventas registradas

**Pasos:**

1. **Iniciar Cierre**
   - Click en "Cerrar Caja"

2. **Realizar Arqueo**
   - Sistema muestra balance esperado: `$130,000` (ejemplo)
   - **Conteo manual:**
     - Billetes de $50,000: `2` = `$100,000`
     - Billetes de $20,000: `1` = `$20,000`
     - Billetes de $10,000: `1` = `$10,000`
     - **Total contado:** `$130,000`

3. **Verificar Diferencia**
   - Esperado: `$130,000`
   - Contado: `$130,000`
   - Diferencia: `$0` ✅

4. **Confirmar Cierre**
   - **Notas:** `Cierre turno mañana - Sin diferencia`
   - Click en "Cerrar"

5. **Verificar Estado**
   - Sesión estado: `CERRADA`
   - Asiento contable creado (si está configurado)

**Resultado Esperado:**
- ✅ Caja cerrada correctamente
- ✅ Diferencia calculada
- ✅ Sesión finalizada
- ✅ Cajero no puede hacer más ventas en esa sesión

---

### FLUJO 3.4: Cierre con Diferencia (Sobrante/Faltante)

**Objetivo:** Validar manejo de diferencias en arqueo

**Pasos:**

1. **Arqueo con Diferencia**
   - Balance esperado: `$130,000`
   - Total contado: `$128,000`
   - **Diferencia:** `-$2,000` (faltante)

2. **Justificar Diferencia**
   - **Razón:** `Posible error en vueltos`
   - **Notas:** `Revisar grabaciones de cámara`

3. **Confirmar Cierre**
   - Sistema registra diferencia
   - Alerta para supervisor

**Resultado Esperado:**
- ✅ Diferencia registrada
- ✅ Razón documentada
- ✅ Reporte generado para auditoría

---

## PRUEBAS DE CONCURRENCIA

### FLUJO 4.1: Ventas Simultáneas del Mismo Producto

**Objetivo:** Validar que NO hay overselling

**Precondiciones:**
- ✅ Producto con stock limitado: `10 unidades`
- ✅ 2 cajeros con sesiones abiertas

**Pasos:**

1. **Cajero 1 (Pestaña 1)**
   - Login: `cajero1@test.nexopos.co`
   - Agregar producto: `8 unidades`
   - **NO confirmar aún**

2. **Cajero 2 (Pestaña 2)**
   - Login: `cajero2@test.nexopos.co`
   - Agregar mismo producto: `8 unidades`
   - **NO confirmar aún**

3. **Confirmar Simultáneamente**
   - Cajero 1: Click "Confirmar Venta" → ✅ **Debe tener éxito**
   - Cajero 2: Click "Confirmar Venta" → ❌ **Debe FALLAR**

4. **Verificar Stock Final**
   - Stock debe ser: `2 unidades` (10 - 8)
   - Solo 1 venta registrada

**Resultado Esperado:**
- ✅ Solo UNA venta exitosa
- ✅ Segunda venta rechazada con mensaje: "Stock insuficiente"
- ✅ NO hay overselling
- ✅ Sistema previene race condition

---

### FLUJO 4.2: Stress Test - 3 Cajeros Simultáneos

**Objetivo:** Validar estabilidad bajo carga

**Setup:**
- Producto: `Stock de 100 unidades`
- 3 cajeros activos

**Pasos:**

1. **Cajero 1:** Vender `30 unidades`
2. **Cajero 2:** Vender `40 unidades`
3. **Cajero 3:** Vender `30 unidades`
4. **Total:** `100 unidades` (exacto)

**Ejecutar simultáneamente** (coordinar clicks)

**Resultado Esperado:**
- ✅ Las 3 ventas exitosas
- ✅ Stock final: `0 unidades`
- ✅ Sin errores de transacción
- ✅ Balance de cada caja correcto

---

### FLUJO 4.3: Reservas de Stock

**Objetivo:** Validar que reservas funcionan

**Pasos:**

1. **Iniciar Venta** (NO confirmar)
   - Producto: `20 unidades`
   - Tiempo estimado: `10 minutos`

2. **Verificar Estado en BD**
   ```sql
   SELECT * FROM stock_reservations
   WHERE status = 'ACTIVE';
   ```
   - Debe haber 1 reserva activa

3. **Esperar Expiración** (15+ minutos)
   - Verificar que cron job limpia reserva

4. **Confirmar Venta Tardía**
   - Debe fallar: "Reserva expirada"

**Resultado Esperado:**
- ✅ Reserva creada al iniciar venta
- ✅ Reserva expirada automáticamente
- ✅ Cleanup automático funciona

---

## CRITERIOS DE ACEPTACIÓN

### ✅ Módulo de Inventario

- [ ] Productos se crean correctamente
- [ ] Stock inicial se registra
- [ ] Ajustes de entrada incrementan stock
- [ ] Ajustes de salida decrementan stock
- [ ] Escáner de códigos de barras funciona
- [ ] Movimientos de inventario se registran
- [ ] Stock mínimo alerta correctamente

### ✅ Módulo de Ventas

- [ ] Venta simple en efectivo funciona
- [ ] Descuentos se aplican correctamente
- [ ] Múltiples métodos de pago funcionan
- [ ] Ventas a crédito se registran
- [ ] Stock se descuenta atómicamente
- [ ] Cambio se calcula correctamente
- [ ] Recibos se generan
- [ ] Cancelación de venta no afecta stock

### ✅ Módulo de Caja

- [ ] Apertura de caja funciona
- [ ] Movimientos de entrada/salida se registran
- [ ] Balance se actualiza en tiempo real
- [ ] Cierre de caja con arqueo funciona
- [ ] Diferencias se calculan correctamente
- [ ] Múltiples sesiones por día funcionan
- [ ] Cierre automático a medianoche funciona

### ✅ Concurrencia y Performance

- [ ] Prevención de overselling funciona
- [ ] Transacciones atómicas funcionan
- [ ] 3 cajeros simultáneos sin errores
- [ ] Sistema de reservas funciona
- [ ] Cleanup automático funciona
- [ ] Tiempo de venta < 3 segundos
- [ ] Sin errores bajo carga

---

## EJECUCIÓN DE PRUEBAS

### 1. Preparación del Entorno

```bash
# 1. Backend
cd backend
npm run migration:run
npm run seed
npm run seed:test-users
npm run start:dev

# 2. Frontend
cd frontend
npm run dev
```

### 2. Orden de Ejecución

1. **Día 1:** Módulo de Inventario (Flujos 1.1 - 1.4)
2. **Día 2:** Módulo de Ventas (Flujos 2.1 - 2.5)
3. **Día 3:** Módulo de Caja (Flujos 3.1 - 3.4)
4. **Día 4:** Pruebas de Concurrencia (Flujos 4.1 - 4.3)

### 3. Reporte de Bugs

Para cada bug encontrado, documentar:

- **ID:** BUG-001
- **Módulo:** Ventas
- **Flujo:** 2.1
- **Severidad:** Alta/Media/Baja
- **Descripción:** Descripción detallada
- **Pasos para reproducir:** 1, 2, 3...
- **Resultado esperado:** ...
- **Resultado actual:** ...
- **Evidencia:** Screenshot/Video

---

## CHECKLIST FINAL

Antes de marcar como "Listo para Producción":

- [ ] Todos los flujos críticos funcionan
- [ ] No hay bugs de severidad Alta
- [ ] Pruebas de concurrencia pasan
- [ ] Performance aceptable (< 3s por venta)
- [ ] Datos de prueba cargados correctamente
- [ ] Documentación actualizada
- [ ] Backups configurados
- [ ] Monitoreo configurado (si disponible)

---

**Última actualización:** 2025-11-14
**Próxima revisión:** Después de completar pruebas
