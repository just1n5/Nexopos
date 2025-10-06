# Corrección de Error de Concatenación de Strings en Cálculos de Inventario

## Fecha: 17 de Septiembre de 2025

## Descripción del Problema

Al procesar una venta, se producía un error en PostgreSQL:
```
la sintaxis de entrada no es válida para tipo numeric: «0.000-1»
```

## Análisis del Error

El error ocurría porque los valores decimales de la base de datos (tipo `numeric` en PostgreSQL) se estaban tratando como strings en JavaScript, causando concatenación en lugar de operaciones matemáticas.

### Ejemplo del Problema:
```javascript
// Mal - Concatenación de strings
const quantityBefore = stock.quantity;      // "0.000" (string)
const quantityAfter = quantityBefore + quantity; // "0.000" + (-1) = "0.000-1" ❌

// Bien - Operación matemática
const quantityBefore = Number(stock.quantity) || 0;  // 0 (number)
const quantityChange = Number(quantity) || 0;        // -1 (number)
const quantityAfter = quantityBefore + quantityChange; // 0 + (-1) = -1 ✅
```

## Solución Implementada

### 1. Conversión Explícita a Números
Se agregó conversión explícita usando `Number()` para todos los valores numéricos antes de realizar operaciones matemáticas:

```typescript
// Ensure all values are numbers
const quantityBefore = Number(stock.quantity) || 0;
const quantityChange = Number(quantity) || 0;
const quantityAfter = quantityBefore + quantityChange;
```

### 2. Archivos Modificados

#### inventory.service.ts
- **Líneas 71-76**: Conversión de cantidades a números
- **Línea 107**: Conversión de `reservedQuantity`
- **Línea 112**: Conversión de `minStockLevel`
- **Líneas 124-125**: Conversión de `averageCost`
- **Línea 133**: Conversión en cálculo de `totalValue`
- **Líneas 277-278**: Conversión en `performStockCount`

## Cambios Específicos

### Método adjustStock
```typescript
// Antes
const quantityBefore = stock.quantity;
const quantityAfter = quantityBefore + quantity;

// Después
const quantityBefore = Number(stock.quantity) || 0;
const quantityChange = Number(quantity) || 0;
const quantityAfter = quantityBefore + quantityChange;
```

### Cálculo de Costo Promedio
```typescript
// Antes
const totalCurrentValue = quantityBefore * (stock.averageCost || 0);

// Después
const currentAverageCost = Number(stock.averageCost) || 0;
const totalCurrentValue = quantityBefore * currentAverageCost;
```

### Cantidad Disponible
```typescript
// Antes
stock.availableQuantity = quantityAfter - stock.reservedQuantity;

// Después
stock.availableQuantity = quantityAfter - (Number(stock.reservedQuantity) || 0);
```

## Tipos de Datos en PostgreSQL vs JavaScript

### PostgreSQL
- `numeric(10,3)`: Almacena números decimales con precisión exacta
- Se devuelve como string en JavaScript para mantener precisión

### JavaScript/TypeScript
- `Number`: Tipo primitivo para números
- Puede perder precisión con decimales muy grandes

### Mejor Práctica
Siempre convertir explícitamente los valores decimales de PostgreSQL a números antes de operaciones matemáticas:

```typescript
const numericValue = Number(databaseValue) || 0;
```

## Testing

### Casos de Prueba Críticos

1. **Venta con Stock Inicial 0**
   - Stock inicial: 0
   - Cantidad vendida: 1
   - Resultado esperado: -1 (no "0-1")

2. **Ajuste de Inventario con Decimales**
   - Stock inicial: 10.500
   - Ajuste: -5.250
   - Resultado esperado: 5.250

3. **Cálculo de Costo Promedio**
   - Stock: 100 unidades a $50
   - Entrada: 50 unidades a $60
   - Costo promedio esperado: $53.33

## Prevención Futura

### Recomendaciones:
1. **Type Guards**: Implementar funciones de utilidad para conversión segura
2. **DTOs con Transformadores**: Usar decoradores de class-transformer
3. **Pruebas Unitarias**: Incluir casos con valores string
4. **Validación de Entrada**: Verificar tipos antes de operaciones

### Función de Utilidad Recomendada:
```typescript
export function toNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
}
```

## Verificación

Para verificar que el error está corregido:

1. Compilar el backend sin errores
2. Crear una venta de un producto con stock 0
3. Verificar que el inventario quede en -1
4. Revisar los logs para confirmar valores numéricos

## Estado Actual

✅ **Conversión a números**: Implementada en todos los cálculos críticos
✅ **Manejo de nulos**: Valores por defecto establecidos
✅ **Consistencia**: Uso de `quantityChange` en todo el método
✅ **Validación**: Verificación de valores finitos

## Impacto

Este cambio previene:
- Errores de base de datos por tipos inválidos
- Cálculos incorrectos de inventario
- Problemas de costo promedio
- Fallas en el proceso de ventas
