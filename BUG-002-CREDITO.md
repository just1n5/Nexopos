# BUG-002: No se agrega deuda al cliente en venta a crédito

## 📋 Reporte

**Reportado por**: Usuario
**Fecha**: 2025-10-06
**Severidad**: Alta
**Módulo**: Ventas a Crédito

## 🐛 Descripción del Problema

Cuando se realiza una venta a crédito, el recibo se genera correctamente mostrando "Venta a crédito" y el saldo pendiente, PERO el crédito no se registra en el módulo de créditos ni se actualiza el saldo del cliente.

## 🔍 Pasos para Reproducir

1. Ir al POS
2. Agregar productos al carrito (ej: Carne de Res por peso)
3. Seleccionar cliente "Ana Lopez"
4. Seleccionar método de pago: "Crédito (Fiado)"
5. Procesar venta
6. Ver recibo → Muestra "Venta a crédito, Saldo pendiente: $XXXX"
7. Ir a módulo de Créditos (F3)
8. **BUG**: No aparece ningún crédito para Ana Lopez

## 🎯 Resultado Esperado

- El crédito debe aparecer en el módulo de Créditos
- El balance del cliente debe actualizarse
- El `creditUsed` debe incrementarse
- El `creditAvailable` debe decrementarse

## ❌ Resultado Actual

- El recibo muestra correctamente que es venta a crédito
- PERO el crédito NO se registra en la base de datos
- El balance del cliente NO se actualiza

## 🔬 Investigación Realizada

### Backend

El código del backend en `sales.service.ts` (líneas 207-226) **SÍ intenta crear el crédito**:

```typescript
if (createSaleDto.type === SaleType.CREDIT && createSaleDto.customerId) {
  const creditAmount = toDecimal(finalTotal - roundedTotalPayment);

  await this.customersService.addCredit(
    createSaleDto.customerId,
    creditAmount,
    savedSale.id,
    createSaleDto.creditDueDate,
    `Venta a crédito #${savedSale.saleNumber}`
  );
}
```

Sin embargo, en `customers.service.ts` (líneas 127-129) hay una **validación**:

```typescript
if (!customer.creditEnabled) {
  throw new BadRequestException(`Credit is not enabled for customer ${customerId}`);
}
```

### Causa Raíz

**El cliente "Ana Lopez" tiene `creditEnabled = false`** aunque tiene `creditLimit = $100,000`.

```json
{
  "firstName": "Ana",
  "lastName": "Lopez",
  "creditEnabled": false,  // ❌ PROBLEMA
  "creditLimit": "100000.00",
  "creditAvailable": "100000.00"
}
```

### Por qué no se mostró el error

El error `BadRequestException` se lanza en el backend pero:
1. Ocurre DESPUÉS de que la venta ya se commitó (línea 173)
2. Es un error post-transacción (líneas 185-226)
3. El frontend probablemente recibe la venta exitosa antes de que falle el crédito
4. O el error se registra en logs pero no se propaga al frontend

## ✅ Soluciones

### Solución Inmediata (Para Testing)

Habilitar crédito para Ana Lopez desde el frontend:
1. Ir a Configuración → Clientes
2. Buscar "Ana Lopez"
3. Editar cliente
4. Marcar checkbox "Habilitar Crédito"
5. Guardar

O actualizar directamente en la BD:
```sql
UPDATE customers
SET credit_enabled = true
WHERE first_name = 'Ana' AND last_name = 'Lopez';
```

### Solución Permanente

**Opción A: Validación Preventiva (Recomendada)**

Validar ANTES de permitir seleccionar "Crédito" como método de pago:

1. En el frontend, cuando el usuario selecciona un cliente
2. Verificar si tiene `creditEnabled = true`
3. Si NO, deshabilitar o mostrar warning en botón "Crédito"
4. Mostrar tooltip: "Este cliente no tiene crédito habilitado"

**Implementación**:
```typescript
// En POSView.tsx
const canUseCredit = selectedCustomer?.creditEnabled ?? false;
const creditAvailable = selectedCustomer?.creditAvailable ?? 0;

// En el selector de método de pago
<PaymentMethodButton
  disabled={!canUseCredit}
  tooltip={!canUseCredit ? "Cliente no tiene crédito habilitado" : undefined}
>
  Crédito
</PaymentMethodButton>
```

**Opción B: Mejor Manejo de Errores**

Mejorar el error handling para que errores post-transacción se muestren al usuario:

```typescript
try {
  const sale = await salesService.createSale(salePayload, token);
  // ... resto del código
} catch (error) {
  // Mostrar error específico
  if (error.message.includes('Credit is not enabled')) {
    toast({
      title: "Crédito no habilitado",
      description: "Este cliente no tiene crédito habilitado. Ve a Configuración → Clientes para habilitarlo.",
      variant: "error"
    });
  }
}
```

**Opción C: Mover validación a la transacción (Backend)**

Mover la validación de crédito ANTES de commitear la transacción:

```typescript
// En sales.service.ts, ANTES de la línea 86
if (createSaleDto.type === SaleType.CREDIT && createSaleDto.customerId) {
  const customer = await this.customersService.findOne(createSaleDto.customerId);

  if (!customer.creditEnabled) {
    throw new BadRequestException('Credit is not enabled for this customer');
  }

  const creditAmount = toDecimal(finalTotal - roundedTotalPayment);
  if (customer.creditAvailable < creditAmount) {
    throw new BadRequestException(
      `Insufficient credit. Available: ${customer.creditAvailable}, Required: ${creditAmount}`
    );
  }
}
```

## 🎯 Recomendación

Implementar **Opción A + Opción C**:

1. **Frontend**: Validación preventiva (mejor UX)
2. **Backend**: Validación dentro de transacción (más seguro)

Esto asegura que:
- ✅ El usuario no puede seleccionar crédito si no está habilitado
- ✅ Si aún así llega al backend, falla ANTES de crear la venta
- ✅ No quedan ventas "huérfanas" sin crédito asociado

## 📊 Impacto

**Severidad**: Alta
- ✅ La venta se registra correctamente
- ❌ El crédito NO se registra
- ❌ El balance del cliente no se actualiza
- ❌ No hay forma de rastrear la deuda

**Usuarios Afectados**:
- Clientes con `creditEnabled = false` pero `creditLimit > 0`
- Ana Lopez es un ejemplo
- Probablemente "Consumidor Final" también

## 🧪 Casos de Prueba

Después del fix, probar:

1. **Cliente con crédito habilitado**:
   - Juan Pérez (`creditEnabled: true`, `creditLimit: 500000`)
   - Venta a crédito de $50,000
   - ✅ Debe crear registro de crédito
   - ✅ Balance debe incrementarse

2. **Cliente SIN crédito habilitado**:
   - Ana Lopez (`creditEnabled: false`)
   - Intentar venta a crédito
   - ✅ Debe mostrar error ANTES de procesar
   - ✅ No debe permitir seleccionar "Crédito" como método

3. **Cliente con límite excedido**:
   - Juan Pérez (límite $500,000)
   - Venta a crédito de $600,000
   - ✅ Debe mostrar error de límite excedido

## 🔗 Relacionado

- **BUG-001**: Productos por peso muestran $0 en recibo (✅ RESUELTO)
- **Módulos afectados**: Ventas, Créditos, Clientes

---

**Estado**: 🔍 Identificado - Pendiente de Fix
**Prioridad**: Alta
**Asignado**: Desarrollo
