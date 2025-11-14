# Guía de Migración a Supabase

Esta guía detalla el proceso completo para migrar NexoPOS de PostgreSQL local (Dokku) a Supabase.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Fase 1: Configuración de Supabase](#fase-1-configuración-de-supabase)
- [Fase 2: Migración de Base de Datos](#fase-2-migración-de-base-de-datos)
- [Fase 3: Configuración del Backend](#fase-3-configuración-del-backend)
- [Fase 4: Configuración del Frontend](#fase-4-configuración-del-frontend)
- [Fase 5: Deploy a Producción](#fase-5-deploy-a-producción)
- [Features Adicionales de Supabase](#features-adicionales-de-supabase)
- [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

- [ ] Cuenta en [Supabase](https://supabase.com)
- [ ] Acceso al servidor Dokku actual
- [ ] Backup de la base de datos actual (si hay datos importantes)

---

## Fase 1: Configuración de Supabase

### 1.1 Crear Proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com)
2. Crear cuenta o iniciar sesión
3. Click en "New Project"
4. Configurar:
   - **Name:** nexopos-production (o el nombre que prefieras)
   - **Database Password:** Genera uno seguro y guárdalo
   - **Region:** Selecciona la más cercana a Colombia (ej. us-east-1)
   - **Plan:** Free tier para comenzar (puede escalar después)

5. Esperar ~2 minutos mientras se crea el proyecto

### 1.2 Obtener Credenciales

Una vez creado el proyecto, ir a **Settings > Database**:

```bash
# Connection String (Pool)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Connection String (Direct) - usar esta para migraciones
DATABASE_URL_DIRECT=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

También necesitarás de **Settings > API**:

```bash
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...tu-key-aqui
SUPABASE_SERVICE_KEY=eyJhbGci...tu-key-aqui (solo para backend, ¡no exponer!)
```

---

## Fase 2: Migración de Base de Datos

### Opción A: Empezar desde Cero (Recomendado para datos de prueba)

Si solo tienes datos de prueba, la forma más simple es:

```bash
# 1. Configurar DATABASE_URL en backend/.env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 2. Ejecutar migraciones de TypeORM para crear el schema
cd backend
npm run migration:run

# 3. Ejecutar seed para datos iniciales
npm run seed
npm run seed:accounting
```

### Opción B: Migrar Datos Existentes

Si tienes datos importantes en producción:

#### Paso 1: Exportar desde Dokku PostgreSQL

```bash
# Conectarse al servidor Dokku
ssh dokku@192.168.80.17

# Exportar la base de datos
dokku postgres:export nexopos-db > nexopos_backup.sql

# Descargar el backup a tu máquina local
# (desde tu máquina local)
scp dokku@192.168.80.17:~/nexopos_backup.sql ./
```

#### Paso 2: Importar a Supabase

**Método 1: Using Supabase Dashboard**

1. Ir a **Database > Backups > Restore**
2. Subir el archivo `nexopos_backup.sql`
3. Ejecutar restore

**Método 2: Using psql (recomendado para archivos grandes)**

```bash
# Instalar psql si no lo tienes
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Importar a Supabase
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" < nexopos_backup.sql
```

#### Paso 3: Verificar Migración

```bash
# Conectarse a Supabase
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Verificar tablas
\dt

# Verificar datos (ejemplo)
SELECT COUNT(*) FROM product;
SELECT COUNT(*) FROM sale;
SELECT COUNT(*) FROM customer;

# Salir
\q
```

---

## Fase 3: Configuración del Backend

### 3.1 Actualizar Variables de Entorno

**Desarrollo Local** (`backend/.env`):

```bash
# Comentar o eliminar estas variables
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=nexopos
# DB_USER=nexopos
# DB_PASSWORD=changeme

# Agregar DATABASE_URL de Supabase
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DB_LOGGING=false
DB_SYNC=false  # IMPORTANTE: siempre false en producción
```

**Producción Dokku**:

```bash
# Configurar en Dokku
dokku config:set nexopos \
  DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  DB_SYNC=false \
  DB_LOGGING=false
```

> **Nota:** Para producción, usar la Connection Pooler URL (puerto 6543) para mejor rendimiento.

### 3.2 Verificar Conexión

```bash
cd backend
npm run start:dev

# Deberías ver en los logs:
# [TypeOrmModule] Connected to database successfully
```

### 3.3 Ejecutar Migraciones (si aplicable)

```bash
cd backend
npm run migration:run
```

---

## Fase 4: Configuración del Frontend

### 4.1 Actualizar Variables de Entorno

**Desarrollo Local** (`frontend/.env`):

```bash
# Supabase (opcional - para features adicionales)
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...tu-anon-key-aqui
```

**Producción Dokku**:

```bash
# Si usas variables de entorno para frontend en Dokku
dokku config:set nexopos \
  VITE_SUPABASE_URL="https://[PROJECT-REF].supabase.co" \
  VITE_SUPABASE_ANON_KEY="tu-anon-key-aqui"
```

### 4.2 Verificar Configuración

El cliente de Supabase ya está instalado y configurado en `frontend/src/lib/supabase.ts`.

Para verificar que funciona:

```typescript
import { isSupabaseConfigured } from '@/lib/supabase';

// En cualquier componente
console.log('Supabase configured:', isSupabaseConfigured());
```

---

## Fase 5: Deploy a Producción

### 5.1 Commit de Cambios

```bash
# Agregar cambios
git add .

# Commit
git commit -m "feat: migrar a Supabase como base de datos

Cambios:
- Instalado @supabase/supabase-js en frontend
- Creado archivo de configuración frontend/src/lib/supabase.ts
- Agregadas variables de entorno para Supabase
- Configuración lista para usar DATABASE_URL de Supabase

Beneficios:
- Mayor disponibilidad (BD en la nube)
- Backups automáticos gestionados por Supabase
- Acceso a features adicionales (Storage, Realtime)
- Preparado para multi-tenant y multi-sucursal

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5.2 Deploy a Dokku

```bash
# Push a Dokku (esto desplegará automáticamente)
git push dokku main

# Verificar logs
dokku logs nexopos -t
```

### 5.3 Ejecutar Migraciones en Producción

```bash
# Si es necesario ejecutar migraciones
dokku run nexopos bash -c "cd backend && npm run migration:run"
```

### 5.4 Verificar que Todo Funciona

1. Acceder a https://nexopos.cloution.cloud
2. Iniciar sesión
3. Verificar que se carguen productos, ventas, etc.
4. Realizar una venta de prueba
5. Verificar en Supabase Dashboard > Table Editor que los datos se guardan

---

## Features Adicionales de Supabase

Una vez migrada la base de datos, puedes aprovechar features adicionales:

### 1. Supabase Storage (Imágenes de Productos)

Ya está implementado en `frontend/src/lib/supabase.ts`.

#### Configurar Storage Bucket:

1. En Supabase Dashboard, ir a **Storage**
2. Crear nuevo bucket: `product-images`
3. Configurar como público:
   - Click en bucket > Settings
   - Public bucket: ON

#### Usar en código:

```typescript
import { uploadProductImage, deleteProductImage } from '@/lib/supabase';

// Upload
const imageUrl = await uploadProductImage(file, tenantId, productId);

// Delete
await deleteProductImage(imageUrl);
```

### 2. Supabase Realtime (Sincronización Multi-Caja)

Perfecto para sincronizar ventas en tiempo real entre múltiples cajas registradoras.

#### Habilitar Realtime:

1. En Supabase Dashboard, ir a **Database > Replication**
2. Habilitar replicación para tabla `sale`:
   - Source: `sale`
   - Enable INSERT

#### Usar en código:

```typescript
import { subscribeToSalesChannel, unsubscribeFromChannel } from '@/lib/supabase';

// En tu componente POS
const channel = subscribeToSalesChannel(tenantId, (newSale) => {
  console.log('Nueva venta en otra caja:', newSale);
  // Actualizar UI, refrescar totales, etc.
});

// Cleanup al desmontar
return () => unsubscribeFromChannel(channel);
```

### 3. Row Level Security (RLS) - Multi-tenant

Para seguridad a nivel de base de datos entre tenants.

**Ejemplo para tabla `product`:**

```sql
-- Habilitar RLS
ALTER TABLE product ENABLE ROW LEVEL SECURITY;

-- Policy: usuarios solo ven sus propios productos
CREATE POLICY tenant_isolation_policy ON product
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Backend debe configurar tenant_id en cada request:**

```typescript
// En NestJS guard o interceptor
await queryRunner.query(`SET app.tenant_id = '${user.tenantId}'`);
```

### 4. Supabase Auth (Opcional)

Si quieres migrar de JWT manual a Supabase Auth:

**Ventajas:**
- Magic links (login sin contraseña)
- Social login (Google, Facebook, etc.)
- Email verification automático
- Password reset automático

**Requiere:** Cambios mayores en backend y frontend.

---

## Troubleshooting

### Error: "password authentication failed"

```bash
# Verificar que usaste el password correcto
# Resetear password si es necesario en Supabase Dashboard > Settings > Database
```

### Error: "too many connections"

```bash
# Usar Connection Pooler URL en vez de Direct URL
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Error: "relation does not exist"

```bash
# Ejecutar migraciones
cd backend
npm run migration:run

# Si persiste, verificar que el schema sea correcto (default: public)
```

### Migraciones no se ejecutan en Dokku

```bash
# Verificar que DATABASE_URL esté configurado
dokku config:show nexopos | grep DATABASE_URL

# Ejecutar migraciones manualmente
dokku run nexopos bash -c "cd backend && npm run migration:run"

# Ver logs detallados
dokku logs nexopos -t
```

### Frontend no se conecta a Supabase

```bash
# Verificar variables en el build
dokku config:show nexopos | grep VITE_SUPABASE

# Asegurarse de que las variables VITE_ estén disponibles durante el build
# Rebuild después de configurar variables
dokku ps:rebuild nexopos
```

### Supabase Storage da error 403

```bash
# Verificar que el bucket sea público
# Ir a Storage > [bucket-name] > Settings > Public bucket: ON

# Verificar que las policies permitan acceso
# Storage > [bucket-name] > Policies
```

---

## Checklist Final

Antes de considerar la migración completa:

- [ ] Base de datos conectada correctamente
- [ ] Migraciones ejecutadas exitosamente
- [ ] Seed de datos funcionando (si aplica)
- [ ] Login funciona
- [ ] Crear venta funciona
- [ ] Ver inventario funciona
- [ ] Reportes funcionan
- [ ] Backend en producción (Dokku) conectado a Supabase
- [ ] Frontend en producción usa Supabase (opcional)
- [ ] Backup de datos antigos guardado de forma segura
- [ ] Variables de entorno documentadas
- [ ] Equipo informado del cambio

---

## Recursos Adicionales

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)

---

## Contacto de Soporte

Si tienes problemas durante la migración:

- Supabase Support: support@supabase.io
- Documentación Supabase: https://supabase.com/docs
- Discord de Supabase: https://discord.supabase.com

---

**Nota:** Esta migración ha sido preparada específicamente para NexoPOS. El código está listo para usar Supabase, solo necesitas configurar las credenciales.
