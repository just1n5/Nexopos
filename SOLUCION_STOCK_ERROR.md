# Solución al Error "Insufficient Stock"

## 🔍 Problema Identificado

El error que estás experimentando:
```
Error: Failed to update inventory: Insufficient stock. Available: 0, Requested: 1
```

Indica que **el producto que intentas vender tiene 0 unidades en stock**. El sistema está funcionando correctamente al prevenir la venta de productos sin inventario.

## ✅ Soluciones

### Opción 1: Agregar Stock Inicial Automáticamente (Recomendado para Testing)

He creado un script que agregará stock inicial a todos los productos de tu sistema:

```bash
# Desde la raíz del proyecto
cd backend

# Instalar dependencias si es necesario
npm install

# Ejecutar el script de agregar stock inicial
npm run ts-node src/scripts/fixes/add-initial-stock.ts
```

Este script:
- ✅ Añade 100 unidades a productos sin variantes
- ✅ Añade 50 unidades a cada variante de productos con variantes
- ✅ Crea los registros de inventario necesarios
- ✅ Genera movimientos de inventario para trazabilidad

### Opción 2: Agregar Stock Manualmente

Si prefieres agregar stock manualmente a un producto específico:

1. Ve a la sección de **Inventario** en la aplicación
2. Busca el producto que deseas vender
3. Haz clic en **"Ajustar Stock"** o **"Agregar Stock"**
4. Ingresa la cantidad deseada (ej: 100)
5. Guarda los cambios

### Opción 3: Agregar Stock via API (Para desarrollo)

Puedes usar el endpoint de inventario:

```bash
POST http://localhost:3000/api/inventory/adjust
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "productId": "PRODUCT_ID",
  "quantity": 100,
  "movementType": "PURCHASE",
  "notes": "Stock inicial para pruebas"
}
```

## 🎯 Mejoras Implementadas en el Frontend

He mejorado el manejo de errores en `POSView.tsx` para que ahora muestre mensajes más claros y específicos:

### Antes:
```
❌ Error al procesar la venta
Failed to update inventory: Insufficient stock. Available: 0, Requested: 1
```

### Ahora:
```
⚠️ Stock insuficiente
No hay suficiente inventario. Disponible: 0 unidades, Solicitado: 1 unidades. 
Actualiza el inventario del producto.
```

El mensaje ahora:
- Tiene un título más claro ("Stock insuficiente")
- Muestra la cantidad disponible y solicitada
- Sugiere la acción a tomar
- Se muestra por 6 segundos (más tiempo para leerlo)

## 📋 Pasos para Resolver el Problema Actual

1. **Ejecuta el script de stock inicial**:
   ```bash
   cd C:\Users\justi\Desktop\NexoPos\Nexoposdesarrollo\backend
   npm run ts-node src/scripts/fixes/add-initial-stock.ts
   ```

2. **Reinicia el frontend** (si está corriendo):
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

3. **Intenta la venta nuevamente**:
   - El error ya no debería aparecer
   - Si aparece un error diferente, será más claro y específico

## 🔧 Verificación del Stock

Para verificar que el stock se agregó correctamente, puedes:

1. **Consultar en la base de datos**:
   ```sql
   SELECT 
     p.name,
     p.sku,
     i.quantity,
     i.available_quantity,
     i.status
   FROM products p
   LEFT JOIN inventory_stock i ON p.id = i.product_id
   ORDER BY p.name;
   ```

2. **Ver en la interfaz**:
   - Ve a la vista de POS
   - Los productos deberían mostrar el badge con el stock disponible
   - Si está en rojo, tiene menos de 10 unidades
   - Si está en verde/azul, tiene stock suficiente

## 🚨 Prevención Futura

Para evitar este problema en producción:

1. **Siempre configura el stock inicial** al crear productos
2. **Implementa alertas de stock bajo** (ya está en el código)
3. **Usa el módulo de compras** para registrar entradas de inventario
4. **Revisa regularmente** el estado del inventario

## 📝 Notas Adicionales

- El sistema está diseñado para **prevenir ventas de productos sin stock**
- Esto es una **característica de seguridad**, no un bug
- En producción real, nunca deberías tener productos con stock 0 disponibles para la venta
- El script de stock inicial es solo para **desarrollo y testing**

## ❓ Si el Problema Persiste

Si después de ejecutar el script el problema continúa:

1. Verifica que el script se ejecutó sin errores
2. Revisa los logs del backend
3. Confirma que la base de datos tiene los registros de stock
4. Limpia el caché del navegador (Ctrl+Shift+R)
5. Verifica que el frontend esté conectado al backend correcto

---

**Ejecuta el script ahora y podrás comenzar a realizar ventas inmediatamente** 🚀
