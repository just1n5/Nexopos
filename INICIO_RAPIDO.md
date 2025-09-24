# 🚀 GUÍA DE INICIO RÁPIDO - NEXOPOS MVP

## ⚡ INICIO RÁPIDO (3 PASOS)

### PASO 1: Iniciar Backend
```bash
# Terminal 1
cd backend
npm install            # Solo la primera vez
npm run start:dev
```

### PASO 2: Iniciar Frontend
```bash
# Terminal 2
cd frontend
npm install            # Solo la primera vez
npm run dev
```

### PASO 3: Cargar Datos de Prueba
```bash
# Terminal 3 (Solo la primera vez)
cd backend
npm run seed
```

---

## 🌐 ACCESOS DEL SISTEMA

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | Aplicación principal |
| **API Docs** | http://localhost:3000/api | Documentación Swagger |
| **Backend** | http://localhost:3000 | API REST |
| **pgAdmin** | http://localhost:5050 | Administrador de BD |

---

## 👤 USUARIOS DE PRUEBA

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| **Admin** | admin@nexopos.com | Admin123! | Acceso total |
| **Cajero** | cajero@nexopos.com | Cajero123! | Ventas y caja |
| **Tendero** | tendero@nexopos.com | Tendero123! | Vista limitada |

---

## 🧪 FLUJOS DE PRUEBA DEL MVP

### 1️⃣ **FLUJO BÁSICO DE VENTA**

```
1. Login como cajero@nexopos.com
2. Abrir Caja (Monto inicial: $50,000)
3. Nueva Venta:
   - Agregar 2x Coca-Cola 600ml
   - Agregar 1x Doritos Nacho
   - Cliente: Juan Pérez
   - Método de pago: Efectivo
   - Total: $10,500
   - Pago: $20,000
   - Cambio: $9,500
4. Generar Factura
5. Verificar:
   ✓ Stock descontado
   ✓ Factura DIAN generada
   ✓ Movimiento en caja
```

### 2️⃣ **FLUJO DE FIADO (CRÉDITO)**

```
1. Nueva Venta
2. Seleccionar cliente: María García
3. Agregar productos
4. Método de pago: "Crédito/Fiado"
5. Verificar:
   ✓ Venta marcada como pendiente
   ✓ Aparece en "Cuentas por Cobrar"
   ✓ Cliente tiene deuda registrada
```

### 3️⃣ **FLUJO DE INVENTARIO**

```
1. Ir a Inventario
2. Buscar "Coca-Cola"
3. Verificar stock actual
4. Hacer una venta
5. Regresar a inventario
6. Verificar:
   ✓ Stock actualizado
   ✓ Historial de movimientos
```

### 4️⃣ **FLUJO DE CIERRE DE CAJA**

```
1. Al final del día
2. Ir a "Caja" → "Cerrar Caja"
3. Contar efectivo físico
4. Ingresar monto contado
5. Verificar:
   ✓ Resumen de ventas del día
   ✓ Diferencia (si existe)
   ✓ Reporte Z generado
```

---

## 🔍 VERIFICACIÓN DEL SISTEMA

```bash
# Ejecutar script de verificación
node verificar-sistema.js
```

Este script verifica:
- ✓ Conexión a PostgreSQL
- ✓ Tablas creadas
- ✓ Backend funcionando
- ✓ Frontend funcionando
- ✓ Datos de prueba cargados

---

## 📊 DATOS DE PRUEBA INCLUIDOS

### Productos (8)
- **Bebidas**: Coca-Cola 600ml, Agua Cristal, Jugo Hit
- **Snacks**: Doritos, Papas Margarita, De Todito
- **Básicos**: Arroz Diana, Aceite Girasol

### Categorías (8)
- Bebidas, Snacks, Lácteos, Aseo Personal
- Abarrotes, Licores, Panadería, Verduras

### Clientes (4)
- Juan Pérez (Contado)
- María García (Crédito frecuente)
- Tienda Don Carlos (Mayorista)
- Cliente Genérico

### Impuestos (4)
- IVA 19% (General)
- IVA 5% (Básicos)
- Exento 0%
- INC 8% (Bebidas azucaradas)

---

## 🛠️ COMANDOS ÚTILES

### Backend
```bash
npm run start:dev      # Desarrollo con hot-reload
npm run build         # Compilar para producción
npm run seed          # Cargar datos de prueba
npm run migration:run # Ejecutar migraciones
npm run test          # Ejecutar tests
```

### Frontend
```bash
npm run dev           # Desarrollo con Vite
npm run build        # Compilar para producción
npm run preview      # Vista previa de producción
npm run lint         # Verificar código
```

### Base de Datos
```bash
# Conectar con psql
psql -U nexopos_user -d nexopos -h localhost

# Ver tablas
\dt

# Ver datos de una tabla
SELECT * FROM products;
SELECT * FROM users;
SELECT * FROM sales;
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL esté corriendo
# Windows: Servicios → PostgreSQL → Iniciar
```

### Error: "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### Error: "Port 5173 already in use"
```bash
# Windows
netstat -ano | findstr :5173
taskkill /F /PID <PID>
```

### Error: "No tables found"
```bash
cd backend
npm run migration:run
npm run seed
```

---

## 📱 PROBAR EN DISPOSITIVO MÓVIL

Para probar desde tu celular en la misma red:

1. Obtén tu IP local:
```bash
ipconfig
# Busca "IPv4 Address": 192.168.x.x
```

2. Modifica frontend/.env:
```env
VITE_API_URL=http://192.168.x.x:3000/api
```

3. Inicia frontend con:
```bash
npm run dev -- --host
```

4. Accede desde el celular:
```
http://192.168.x.x:5173
```

---

## ✅ CHECKLIST DE PRUEBAS MVP

### Funcionalidades Core
- [ ] Login/Logout
- [ ] Abrir/Cerrar Caja
- [ ] Crear Venta
- [ ] Aplicar Descuentos
- [ ] Generar Factura DIAN
- [ ] Gestionar Inventario
- [ ] Ver Reportes

### Integraciones
- [ ] Stock se actualiza al vender
- [ ] Facturas se generan correctamente
- [ ] Caja registra movimientos
- [ ] Créditos se registran

### Hardware (Opcional)
- [ ] Lector de código de barras
- [ ] Impresora térmica
- [ ] Cajón monedero

---

## 📞 SOPORTE

Si encuentras problemas:

1. Revisa los logs:
   - Backend: Terminal donde ejecutaste `npm run start:dev`
   - Frontend: Consola del navegador (F12)
   - PostgreSQL: `C:\Program Files\PostgreSQL\17\data\log\`

2. Ejecuta verificación:
   ```bash
   node verificar-sistema.js
   ```

3. Consulta la documentación:
   - API Docs: http://localhost:3000/api
   - README.md en cada carpeta

---

¡Todo listo para comenzar las pruebas! 🎉
