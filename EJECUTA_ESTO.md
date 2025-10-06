# ⚡ Ejecuta Esto Ahora - Solución Rápida

## 🎯 Tienes el error "Insufficient stock"?

### Ejecuta estos comandos en orden:

```bash
# 1. Abre una terminal (CMD o PowerShell)
cd C:\Users\justi\Desktop\NexoPos\Nexoposdesarrollo\backend

# 2. Ejecuta el fix
npm run fix:stock

# 3. Espera a ver este mensaje:
# ✅ Script completed successfully

# 4. ¡Listo! Vuelve al navegador y vende
```

---

## 📺 Lo que verás en la consola:

```
> nexopos-backend@0.1.0 fix:stock
> ts-node src/scripts/fixes/add-initial-stock.ts

✅ Database connected
📦 Found 15 products
  ✓ Added 100 units to product: Arroz Diana x 500g
  ✓ Added 100 units to product: Pan Integral
  ✓ Added 100 units to product: Leche Entera
  ✓ Added 50 units to variant: Cerveza Corona - 330ml
  ✓ Added 50 units to variant: Cerveza Corona - 1L
  ✓ Added 50 units to variant: Camisa - Talla M
  ✓ Added 50 units to variant: Camisa - Talla L

📊 Summary:
  Products updated: 10
  Variants updated: 8
  Total items updated: 18
✅ Database connection closed
✅ Script completed successfully
```

---

## ✅ Verificación

Después de ejecutar:

1. **Abre el POS** en tu navegador
2. **Los productos mostrarán stock** en un badge
3. **Intenta una venta** - ya no verás error
4. **Completa el pago** - ¡funciona!

---

## ❌ Si ves errores en la consola:

### Error: "Cannot find module"
```bash
# Instala dependencias
npm install
# Luego intenta de nuevo
npm run fix:stock
```

### Error: "Connection refused"
```bash
# El backend debe estar corriendo
# Abre otra terminal y ejecuta:
cd backend
npm run start:dev
# Espera a que inicie, luego en otra terminal:
npm run fix:stock
```

### Error: "ECONNREFUSED postgresql"
```bash
# La base de datos no está corriendo
# Inicia PostgreSQL y luego intenta de nuevo
```

---

## 🔄 Si necesitas reiniciar todo:

```bash
# 1. Detén el backend (Ctrl+C en su terminal)

# 2. Reinicia backend
cd backend
npm run start:dev

# 3. En OTRA terminal, ejecuta el fix
cd backend
npm run fix:stock

# 4. Reinicia frontend
cd frontend
npm run dev
```

---

## 📱 Acceso Rápido

- **POS:** http://localhost:5173/pos
- **Inventario:** http://localhost:5173/inventory
- **Backend API:** http://localhost:3000

---

## 🆘 Ayuda Adicional

Si después de esto el problema persiste:

1. 📄 Lee: `SOLUCION_STOCK_ERROR.md`
2. 📄 Lee: `FIX_STOCK_README.md`
3. 🔍 Revisa los logs del backend
4. 🔍 Abre la consola del navegador (F12)

---

## ⏱️ Tiempo estimado: 1 minuto

**Ejecuta el comando ahora y empieza a vender** 🚀

```bash
cd C:\Users\justi\Desktop\NexoPos\Nexoposdesarrollo\backend && npm run fix:stock
```
