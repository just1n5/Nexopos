# Credenciales de Supabase - NexoPOS Production

## Información del Proyecto

- **Project ID**: vohlomomrskxnuksodmt
- **Project Name**: nexopos-production
- **Region**: us-east-2 (US East - Ohio)
- **Status**: ✅ ACTIVE_HEALTHY
- **PostgreSQL Version**: 17.6.1

## URLs y Endpoints

### Supabase Dashboard
```
https://supabase.com/dashboard/project/vohlomomrskxnuksodmt
```

### API URL (Frontend)
```
https://vohlomomrskxnuksodmt.supabase.co
```

### Database Settings
```
https://supabase.com/dashboard/project/vohlomomrskxnuksodmt/settings/database
```

## API Keys

### Anon Key (Pública - Frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvaGxvbW9tcnNreG51a3NvZG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDIzMDgsImV4cCI6MjA3ODI3ODMwOH0.mY_WgdW_ljh-h5Acxi4Fs8YJeOkfMqG4GbHFwpXxDVM
```

### Service Role Key (Privada - Solo Backend)
⚠️ **NUNCA expongas esta key en el frontend**
```
(Obtenerla desde: Settings > API > service_role)
```

## Connection Strings

### Database Password
```
WHsA3FfvLFDCzQqv
```

**IMPORTANTE:** Contraseña reseteada el 2025-11-10
- ✅ Funcionando en producción (Dokku)
- La contraseña anterior era: Tomateatomico41*

### Direct Connection (Puerto 5432)
**Usar para:** Migraciones, pg_dump, psql
**Formato:**
```
postgresql://postgres:Aguacate41*@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres
```

### Connection Pooler - Transaction Mode (Puerto 6543)
**Usar para:** Aplicaciones en producción
**Formato:**
```
postgresql://postgres.vohlomomrskxnuksodmt:Aguacate41*@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

### Connection Pooler - Session Mode (Puerto 5432)
**Usar para:** Aplicaciones que necesitan sesiones persistentes
**Formato:**
```
postgresql://postgres.vohlomomrskxnuksodmt:Aguacate41*@aws-0-us-east-2.pooler.supabase.com:5432/postgres
```

## Configuración en el Proyecto

### Backend (.env)

#### Para Desarrollo Local
```bash
# Usar Direct Connection
DATABASE_URL=postgresql://postgres:Aguacate41*@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres
DB_SCHEMA=public
DB_SYNC=false
DB_LOGGING=true
```

#### Para Producción (Dokku)
```bash
# Usar Connection Pooler (Transaction Mode)
DATABASE_URL=postgresql://postgres.vohlomomrskxnuksodmt:Aguacate41*@aws-0-us-east-2.pooler.supabase.com:6543/postgres
DB_SCHEMA=public
DB_SYNC=false
DB_LOGGING=false
```

### Frontend (.env)

```bash
VITE_SUPABASE_URL=https://vohlomomrskxnuksodmt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvaGxvbW9tcnNreG51a3NvZG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDIzMDgsImV4cCI6MjA3ODI3ODMwOH0.mY_WgdW_ljh-h5Acxi4Fs8YJeOkfMqG4GbHFwpXxDVM
```

## Estado Actual de la Migración

### ✅ Completado

1. **Extensiones**
   - [x] uuid-ossp habilitada

2. **Tipos ENUM** (27 tipos)
   - [x] account_nature_enum
   - [x] account_type_enum
   - [x] cash_movements_category_enum
   - [x] cash_movements_type_enum
   - [x] customer_credits_status_enum
   - [x] customer_credits_type_enum
   - [x] expense_payment_method_enum
   - [x] expense_status_enum
   - [x] expense_type_enum
   - [x] fiscal_responsibility_enum
   - [x] journal_entry_status_enum
   - [x] journal_entry_type_enum
   - [x] movement_category_enum
   - [x] movement_status_enum
   - [x] movement_type_enum
   - [x] otp_purpose_enum
   - [x] payment_method_enum
   - [x] payment_status_enum
   - [x] person_type_enum
   - [x] stock_status_enum
   - [x] tax_regime_enum
   - [x] taxes_type_enum
   - [x] vat_declaration_period_enum
   - [x] weight_unit_enum
   - [x] withholding_concept_enum
   - [x] withholding_direction_enum
   - [x] withholding_type_enum

3. **Tablas** (25 tablas)
   - [x] beta_keys
   - [x] cash_movements
   - [x] cash_registers
   - [x] categories
   - [x] chart_of_accounts
   - [x] customer_credits
   - [x] customers
   - [x] dian_resolutions
   - [x] expenses
   - [x] fiscal_configs
   - [x] inventory_movements
   - [x] inventory_stock
   - [x] journal_entries
   - [x] journal_entry_lines
   - [x] migrations
   - [x] otp_codes
   - [x] payments
   - [x] products
   - [x] product_variants
   - [x] sales
   - [x] sale_items
   - [x] taxes
   - [x] tenants
   - [x] users

4. **Constraints**
   - [x] 25 Primary Keys
   - [x] 42 Foreign Keys

5. **Índices**
   - [x] 44 índices

### 🚧 Pendiente

6. **Datos**
   - [ ] Importar datos existentes desde Dokku

## Estado de Conectividad

✅ **PRODUCCIÓN (Dokku): FUNCIONANDO**
- Servidor Dokku se conecta correctamente a Supabase vía IPv6
- Base de datos operativa con todas las tablas migradas
- Aplicación corriendo exitosamente

⚠️ **Desarrollo Local (Windows): Limitado**
- IPv6 no disponible desde Windows local
- Connection Pooler tiene problemas de autenticación
- **Solución:** Desarrollar y probar desde servidor Dokku o usar VPN/red diferente

### Soluciones posibles:

1. **Desde otro lugar con mejor conectividad**
   - Usar una red diferente (ej. datos móviles, otra WiFi)
   - Usar VPN

2. **Desde tu servidor Dokku**
   ```bash
   # SSH al servidor
   ssh dokku@192.168.80.17

   # El servidor probablemente sí tenga conectividad DNS
   # Ejecutar migraciones desde ahí
   ```

3. **Configurar DNS alternativo**
   - Cambiar DNS a 8.8.8.8 (Google) o 1.1.1.1 (Cloudflare)

## Próximos Pasos para Completar la Migración

### Opción A: Crear Schema con TypeORM (Recomendado)

```bash
# Una vez tengas conectividad DNS:
cd backend

# Configurar DATABASE_URL en .env con Supabase
DATABASE_URL=postgresql://postgres:Aguacate41*@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres

# Ejecutar migraciones
npm run migration:run

# O permitir que TypeORM cree las tablas automáticamente (solo en desarrollo)
# DB_SYNC=true npm run start:dev
```

### Opción B: Ejecutar SQL del Backup

```bash
# Desde tu máquina (una vez tengas conectividad)
psql "postgresql://postgres:Aguacate41*@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres" < nexopos_backup.sql
```

### Opción C: Migrar datos tabla por tabla

```javascript
// Script Node.js para copiar datos de Dokku a Supabase
// Ver: migrate-data.js (por crear)
```

## Comandos Útiles

### Verificar conexión
```bash
psql "postgresql://postgres:Aguacate41*@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres" -c "SELECT version();"
```

### Listar tablas
```bash
psql "postgresql://postgres:Aguacate41*@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres" -c "\dt"
```

### Ver tipos creados
```bash
psql "postgresql://postgres:Aguacate41*@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres" -c "\dT+"
```

## Soporte

- **Supabase Docs**: https://supabase.com/docs
- **Dashboard**: https://supabase.com/dashboard
- **Support**: support@supabase.io

---

**Última actualización**: 2025-11-09
**Estado**: Schema completo ✅ | Solo falta importar datos ⏳

## Resumen de la Migración Completada

✅ **Extensiones**: 1/1
✅ **Tipos ENUM**: 27/27
✅ **Tablas**: 25/25
✅ **Primary Keys**: 25/25
✅ **Foreign Keys**: 42/42
✅ **Índices**: 44/44

**Total completado**: 164/164 (100%)

### Próximo Paso

El schema de la base de datos está 100% migrado a Supabase. El siguiente paso es importar los datos de producción desde Dokku cuando sea necesario.
