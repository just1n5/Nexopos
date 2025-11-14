# Credenciales y Datos de Prueba - NexoPOS

## 📋 Usuarios de Prueba

| Rol | Email | Password | Permisos |
|-----|-------|----------|----------|
| 🔐 **Super Admin** | `superadmin@test.nexopos.co` | `SuperAdmin123!` | Gestión de plataforma y beta keys |
| 👔 **Admin (Dueño)** | `admin@test.nexopos.co` | `Admin123!` | Acceso total al sistema |
| 📊 **Manager (Gerente)** | `manager@test.nexopos.co` | `Manager123!` | Reportes, inventario, configuración |
| 💰 **Cajero 1** | `cajero1@test.nexopos.co` | `Cajero123!` | Ventas, caja, fiado |
| 💰 **Cajero 2** | `cajero2@test.nexopos.co` | `Cajero123!` | Ventas, caja, fiado (testing concurrencia) |
| 💰 **Cajero 3** | `cajero3@test.nexopos.co` | `Cajero123!` | Ventas, caja, fiado (testing concurrencia) |

## 🏪 Tenant de Prueba

- **Nombre:** Tienda de Prueba NexoPOS
- **NIT:** 900123456-7
- **Email:** testing@nexopos.co
- **Teléfono:** +57 300 123 4567
- **Dirección:** Calle 123 #45-67, Bogotá, Cundinamarca, Colombia

## 📦 Datos de Prueba Creados

### Categorías (6)
1. 🥫 Abarrotes
2. 🥤 Bebidas
3. 🍿 Snacks
4. 🥛 Lácteos
5. 🧹 Aseo
6. 🍎 Frutas y Verduras

### Productos (20)

#### Vendidos por UNIDAD (17):
- **Abarrotes:** Arroz 500g, Aceite 1L, Pasta 500g, Azúcar 1kg, Sal 500g
- **Bebidas:** Coca-Cola 2L, Agua 500ml, Jugo 1L, Cerveza 330ml
- **Snacks:** Papas 150g, Chocolatina 40g, Galletas 294g
- **Lácteos:** Leche 1L, Yogurt 1L
- **Aseo:** Jabón 120g, Detergente 500g, Papel Higiénico x4

#### Vendidos por PESO (3):
- Queso Campesino
- Tomate Chonto
- Plátano Hartón

### Clientes (10)

#### Individuales sin crédito (5):
- María González (CC 1012345678)
- Carlos Ramírez (CC 1023456789)
- Ana López (CC 1034567890)
- Cliente Concurrencia 1 (CC 1067890123)
- Cliente Concurrencia 2 (CC 1078901234)

#### Individuales con crédito (2):
- Pedro Martínez (CC 1045678901) - Crédito: $500,000 (30 días)
- Laura Hernández (CC 1056789012) - Crédito: $300,000 (15 días)

#### Empresas con crédito (2):
- Restaurante El Buen Sabor (NIT 900123456-1) - Crédito: $2,000,000 (30 días)
- Minimarket La Esquina (NIT 900234567-2) - Crédito: $1,500,000 (15 días)

#### Cliente para concurrencia (1):
- Cliente Concurrencia 3 (CC 1089012345)

## 🔑 Acceso al Sistema

### Producción
- **URL:** https://nexopos.cloution.cloud
- **API:** https://nexopos.cloution.cloud/api
- **Swagger:** https://nexopos.cloution.cloud/api

### Desarrollo Local
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000/api
- **Swagger:** http://localhost:3000/api

## 🗄️ Base de Datos (Supabase)

- **Proyecto:** vohlomomrskxnuksodmt
- **Host:** db.vohlomomrskxnuksodmt.supabase.co
- **Database:** postgres
- **User:** postgres
- **Dashboard:** https://supabase.com/dashboard/project/vohlomomrskxnuksodmt

## 📝 Próximos Pasos

1. **Ejecutar Seeders en Producción:**
   ```bash
   ssh dokku@192.168.80.17 run nexopos bash -c "cd backend && npm run seed:test-users"
   ssh dokku@192.168.80.17 run nexopos bash -c "cd backend && npm run seed:test-data"
   ```

2. **Verificar Datos Creados:**
   - Ingresar a https://nexopos.cloution.cloud
   - Usar credenciales de Admin o Manager
   - Verificar que existan productos, categorías y clientes

3. **Ejecutar Pruebas Manuales:**
   - Seguir el plan de pruebas en `PLAN_PRUEBAS_FLUJOS.md`
   - Probar flujos de Inventario (4 casos)
   - Probar flujos de Ventas (5 casos)
   - Probar flujos de Caja (4 casos)
   - Probar Concurrencia (3 casos)

4. **Reportar Bugs:**
   - Usar el template en `PLAN_PRUEBAS_FLUJOS.md`
   - Incluir pasos para reproducir
   - Adjuntar screenshots si es posible

## ⚠️ Notas Importantes

- Todos los passwords de prueba usan el patrón: `Nombre123!`
- Los datos son **solo para testing**, no usar en producción real
- Los productos tienen precios de ejemplo del mercado colombiano
- El stock inicial es aleatorio entre 20-100 unidades
- Los códigos de barras son válidos (formato EAN-13 colombiano)

## 🧪 Testing Automatizado

### Tests E2E de Concurrencia

**Archivo:** `backend/test/sales.concurrency.e2e-spec.ts`

**Ejecutar:**
```bash
cd backend
npm run test:e2e
```

**Tests incluidos:**
- ✅ Prevención de overselling (2 tests)
- ✅ Rollback de transacciones (1 test)
- ✅ Sistema de reservas (3 tests)
- ✅ Stress testing 100+ ventas (2 tests)
- ✅ Nivel de aislamiento SERIALIZABLE (1 test)

## 📚 Documentación Relacionada

- `PLAN_PRUEBAS_FLUJOS.md` - Plan detallado de pruebas manuales
- `ARQUITECTURA_Y_MEJORAS.md` - Mejoras de concurrencia implementadas
- `SUPABASE_CREDENTIALS.md` - Credenciales y configuración de Supabase
- `backend/test/README.md` - Documentación de tests E2E

## 🚀 Ejecución de Seeders en Producción

Para poblar la base de datos de Supabase con los datos de prueba, ejecuta los seeders desde el servidor Dokku:

### 1. Crear Usuarios de Prueba

```bash
ssh dokku@192.168.80.17 run nexopos node /app/backend/dist/src/scripts/seed-test-users.js
```

### 2. Crear Datos de Prueba (Productos, Categorías, Clientes, Stock)

```bash
ssh dokku@192.168.80.17 run nexopos node /app/backend/dist/src/scripts/seed-test-data.js
```

### 3. Verificación

Después de ejecutar los seeders, verifica que los datos fueron creados exitosamente:

- **Usuarios:** 6 usuarios (1 Super Admin, 1 Admin, 1 Manager, 3 Cajeros)
- **Categorías:** 6 categorías (Abarrotes, Bebidas, Snacks, Lácteos, Aseo, Frutas y Verduras)
- **Productos:** 20 productos (17 por unidad, 3 por peso)
- **Clientes:** 10 clientes (5 individuales sin crédito, 2 individuales con crédito, 2 empresas, 3 testing)
- **Stock inicial:** 20-100 unidades por producto

---

**Fecha de creación:** 2025-11-14
**Versión:** 1.0
**Estado:** Listo para pruebas
