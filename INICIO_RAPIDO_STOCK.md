# 🚀 Inicio Rápido - NexoPOS

## Solucionar Error de Stock Insuficiente

Si estás viendo el error `"Insufficient stock"` al intentar hacer una venta, **es normal**. Los productos empiezan con 0 stock por defecto.

### Solución Rápida (1 minuto)

```bash
# 1. Ir al directorio del backend
cd backend

# 2. Ejecutar el script de stock inicial
npm run fix:stock

# 3. ¡Listo! Ahora puedes vender
```

Esto agregará:
- ✅ 100 unidades a productos simples
- ✅ 50 unidades a cada variante de productos con variantes
- ✅ Registros de inventario correctos
- ✅ Movimientos de inventario para trazabilidad

## ℹ️ Información del Error

El error se ve así:
```
❌ POST http://localhost:3000/api/sales 400 (Bad Request)
Error: Failed to update inventory: Insufficient stock. Available: 0, Requested: 1
```

**Esto NO es un bug**, es una característica de seguridad que previene vender productos sin stock.

## 📊 Verificar que Funcionó

Después de ejecutar el script:

1. **En el POS**: Los productos mostrarán un badge con el stock disponible (verde/azul = stock OK, rojo = stock bajo)

2. **En la consola**: Deberías ver algo como:
   ```
   ✅ Database connected
   📦 Found X products
     ✓ Added 100 units to product: Producto 1
     ✓ Added 50 units to variant: Producto 2 - Talla M
   📊 Summary:
     Products updated: X
     Variants updated: Y
   ✅ Script completed successfully
   ```

3. **Prueba una venta**: Ahora deberías poder completar ventas sin errores

## 🔧 Otras Formas de Agregar Stock

### Opción 1: Desde la Interfaz (Producción)
1. Ve a **Inventario**
2. Selecciona el producto
3. Click en **"Ajustar Stock"**
4. Ingresa la cantidad
5. Guarda

### Opción 2: Via API (Desarrollo)
```bash
POST http://localhost:3000/api/inventory/adjust
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "productId": "PRODUCT_ID",
  "quantity": 100,
  "movementType": "PURCHASE"
}
```

## 🎯 Mejora en los Mensajes de Error

He actualizado el frontend para mostrar mensajes más claros:

**Antes:**
```
Error al procesar la venta
Failed to update inventory: Insufficient stock. Available: 0, Requested: 1
```

**Ahora:**
```
⚠️ Stock insuficiente
No hay suficiente inventario. Disponible: 0 unidades, Solicitado: 1 unidades. 
Actualiza el inventario del producto.
```

## ❓ Preguntas Frecuentes

### ¿Por qué los productos tienen 0 stock?
Los productos nuevos empiezan sin stock por seguridad. En producción, configurarías el stock al recibir mercancía.

### ¿Tengo que hacer esto cada vez?
No. El script es para **desarrollo/testing**. En producción, usarás el módulo de compras para registrar stock.

### ¿El script borrará mi data?
No. El script solo **agrega** stock a productos que tienen 0 unidades.

### ¿Qué pasa si ejecuto el script dos veces?
Se duplicará el stock de los productos. No es recomendado, pero tampoco romperá nada.

## 🐛 Si Aún No Funciona

1. Verifica que el script se ejecutó sin errores
2. Revisa los logs del backend
3. Confirma que la base de datos está corriendo
4. Limpia el caché del navegador (Ctrl+Shift+R)
5. Reinicia el frontend

## 📝 Siguiente Paso

Una vez agregado el stock:

1. **Prueba una venta** en el POS
2. **Agrega un cliente** para ventas a crédito
3. **Explora el inventario** para ver el stock actualizado
4. **Revisa los reportes** de ventas

---

**¿Todo listo?** Ejecuta el comando y empieza a vender: 

```bash
cd backend && npm run fix:stock
```

🎉 **¡Disfruta NexoPOS!**
