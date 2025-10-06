# 🛒 NexoPOS - Error de Stock Insuficiente

## ⚠️ Problema Actual

Si intentas realizar una venta y ves este error:

```
❌ Error: Failed to update inventory: Insufficient stock. Available: 0, Requested: 1
```

**¡No te preocupes!** Este NO es un error del sistema. Es una característica de seguridad que previene vender productos sin inventario.

## 🔧 Solución en 3 Pasos

### 1️⃣ Abre una terminal en el backend

```bash
cd C:\Users\justi\Desktop\NexoPos\Nexoposdesarrollo\backend
```

### 2️⃣ Ejecuta el comando de arreglo

```bash
npm run fix:stock
```

### 3️⃣ Espera a que termine

Verás algo como esto:

```
✅ Database connected
📦 Found 15 products
  ✓ Added 100 units to product: Arroz Diana x 500g
  ✓ Added 100 units to product: Pan Integral
  ✓ Added 50 units to variant: Cerveza Corona - 330ml
  ✓ Added 50 units to variant: Cerveza Corona - 1L
📊 Summary:
  Products updated: 10
  Variants updated: 8
  Total items updated: 18
✅ Script completed successfully
```

### ✅ ¡Listo! Ahora puedes vender

Regresa al POS y haz una venta. Ya no verás el error.

---

## 📋 Documentación Completa

- **[SOLUCION_STOCK_ERROR.md](./SOLUCION_STOCK_ERROR.md)** - Explicación detallada del problema y soluciones
- **[INICIO_RAPIDO_STOCK.md](./INICIO_RAPIDO_STOCK.md)** - Guía rápida de uso

## 🎯 ¿Qué hace el script?

El script `fix:stock` automáticamente:

1. ✅ Se conecta a tu base de datos
2. ✅ Busca todos los productos con stock 0
3. ✅ Agrega **100 unidades** a productos simples
4. ✅ Agrega **50 unidades** a cada variante
5. ✅ Crea registros de inventario correctos
6. ✅ Genera movimientos para trazabilidad

## 🔍 Verificar el Stock

Después de ejecutar el script, verifica en el POS:

- Los productos mostrarán un **badge** con el stock
- Badge **verde/azul** = Stock suficiente
- Badge **rojo** = Stock bajo (menos de 10 unidades)

## 💡 Mejoras Implementadas

### Frontend (POSView.tsx)
- ✅ Mensajes de error más claros y específicos
- ✅ Muestra cantidad disponible vs solicitada
- ✅ Sugiere acción a tomar
- ✅ Duración extendida del toast (6 segundos)

### Backend (Script nuevo)
- ✅ `add-initial-stock.ts` - Agrega stock inicial automáticamente
- ✅ Comando npm: `npm run fix:stock`
- ✅ Maneja productos simples y con variantes
- ✅ Calcula costos correctamente

## ⚡ Comandos Útiles

```bash
# Agregar stock inicial (una sola vez)
cd backend && npm run fix:stock

# Ver productos y su stock (SQL)
# Conéctate a tu base de datos y ejecuta:
SELECT 
  p.name,
  p.sku,
  i.quantity,
  i.status
FROM products p
LEFT JOIN inventory_stock i ON p.id = i.product_id
ORDER BY p.name;

# Reiniciar frontend si es necesario
cd frontend
npm run dev
```

## ❓ Preguntas Frecuentes

### ¿Por qué los productos tienen 0 stock?
Por seguridad. En producción, agregarías stock al recibir mercancía.

### ¿Tengo que hacer esto cada vez?
No. Solo es necesario una vez para testing/desarrollo.

### ¿El script borrará datos?
No. Solo agrega stock a productos que tienen 0 unidades.

### ¿Puedo ejecutarlo dos veces?
Sí, pero duplicará el stock. No es recomendado.

## 🚨 Si Aún Tienes Problemas

1. ✅ Verifica que el backend esté corriendo
2. ✅ Confirma que la base de datos esté activa
3. ✅ Revisa que no haya errores en la consola
4. ✅ Limpia el caché del navegador (Ctrl+Shift+R)
5. ✅ Reinicia ambos servidores (backend y frontend)

## 📞 Soporte

Si después de seguir estos pasos el problema persiste:

1. Revisa los logs del backend
2. Verifica la conexión a la base de datos
3. Consulta el archivo `SOLUCION_STOCK_ERROR.md` para más detalles

---

## 🎉 ¡Siguiente Paso!

Una vez solucionado el problema de stock:

```bash
# 1. Ejecuta el fix
cd backend && npm run fix:stock

# 2. Ve al POS y realiza una venta
# 3. ¡Disfruta NexoPOS!
```

**Listo para vender** 🚀
