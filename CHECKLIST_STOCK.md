# ✅ Checklist - Solución Error de Stock

## 📋 Antes de Empezar

- [ ] El backend está corriendo (`npm run start:dev`)
- [ ] La base de datos PostgreSQL está activa
- [ ] Puedes acceder al POS en el navegador

---

## 🔧 Proceso de Solución

### Paso 1: Abrir Terminal
- [ ] Abre CMD, PowerShell o Git Bash
- [ ] Navega al directorio del backend
  ```bash
  cd C:\Users\justi\Desktop\NexoPos\Nexoposdesarrollo\backend
  ```

### Paso 2: Ejecutar el Script
- [ ] Ejecuta el comando de fix
  ```bash
  npm run fix:stock
  ```
- [ ] Espera a que termine (aproximadamente 5-10 segundos)

### Paso 3: Verificar Salida
- [ ] Viste el mensaje "✅ Database connected"
- [ ] Viste la lista de productos actualizados
- [ ] Viste "✅ Script completed successfully"
- [ ] No viste errores en rojo

### Paso 4: Probar en el POS
- [ ] Abre el POS en el navegador
- [ ] Los productos muestran badge con stock
- [ ] Agrega un producto al carrito
- [ ] Procesa el pago
- [ ] ✅ La venta se completa sin errores

---

## 🎯 Indicadores de Éxito

### En la Consola del Script
```
✅ Database connected             ← Debe aparecer
📦 Found X products                ← Debe mostrar número
  ✓ Added 100 units to...         ← Debe listar productos
📊 Summary:                        ← Debe aparecer
  Products updated: X              ← Debe ser > 0
✅ Script completed successfully   ← Debe aparecer
```

### En el POS
- [ ] Badge de stock visible en cada producto
- [ ] Badge verde/azul (no rojo) en mayoría de productos
- [ ] Sin error al agregar al carrito
- [ ] Sin error al procesar pago
- [ ] Recibo se genera correctamente

### En la Consola del Navegador (F12)
- [ ] No hay errores 400 (Bad Request)
- [ ] No hay mensaje "Insufficient stock"
- [ ] Request a `/api/sales` retorna 201 (Created)

---

## ❌ Troubleshooting

### Si no ves "Database connected"
- [ ] Verifica que PostgreSQL esté corriendo
- [ ] Revisa las credenciales en `.env`
- [ ] Confirma que la BD existe

### Si ves "Cannot find module"
- [ ] Ejecuta `npm install` en backend
- [ ] Vuelve a intentar el fix

### Si no aparecen productos
- [ ] Verifica que el seed se haya ejecutado antes
- [ ] Ejecuta `npm run seed` primero
- [ ] Luego ejecuta `npm run fix:stock`

### Si el error persiste en el POS
- [ ] Limpia caché del navegador (Ctrl+Shift+R)
- [ ] Reinicia el frontend
- [ ] Verifica que el backend esté corriendo
- [ ] Revisa la consola del navegador

---

## 📊 Verificación en Base de Datos (Opcional)

Si quieres confirmar en la BD:

```sql
-- Ver stock de todos los productos
SELECT 
  p.name,
  p.sku,
  COALESCE(i.quantity, 0) as stock,
  i.status
FROM products p
LEFT JOIN inventory_stock i ON p.id = i.product_id
ORDER BY p.name;
```

Deberías ver:
- [ ] Productos con `stock > 0`
- [ ] Status = 'IN_STOCK'
- [ ] No hay productos con stock NULL

---

## 🎉 Todo Está Listo Cuando...

- ✅ Script ejecutado sin errores
- ✅ Productos tienen stock > 0
- ✅ Puedes completar una venta en el POS
- ✅ No ves error "Insufficient stock"
- ✅ El recibo se imprime/descarga

---

## 📝 Después de Completar

- [ ] Guarda los documentos de ayuda para referencia
- [ ] Marca este archivo como completado
- [ ] Continúa probando otras funcionalidades
- [ ] Reporta cualquier otro problema encontrado

---

## 🚀 Siguiente Fase

Una vez que las ventas funcionen:

- [ ] Probar ventas a crédito (con cliente)
- [ ] Probar diferentes métodos de pago
- [ ] Revisar reportes de ventas
- [ ] Explorar gestión de inventario
- [ ] Agregar más productos

---

## 📞 Si Nada Funciona

Última opción de troubleshooting completo:

```bash
# 1. Detener todo (Ctrl+C en ambas terminales)

# 2. Limpiar y reinstalar backend
cd backend
rm -rf node_modules
npm install

# 3. Limpiar y reinstalar frontend  
cd ../frontend
rm -rf node_modules
npm install

# 4. Reiniciar PostgreSQL

# 5. Ejecutar seed
cd ../backend
npm run seed

# 6. Ejecutar fix de stock
npm run fix:stock

# 7. Iniciar backend
npm run start:dev

# 8. En otra terminal, iniciar frontend
cd ../frontend
npm run dev

# 9. Probar en navegador
```

---

**Última actualización:** 30 de Septiembre, 2025
**Estado del Fix:** ✅ Implementado y Documentado
