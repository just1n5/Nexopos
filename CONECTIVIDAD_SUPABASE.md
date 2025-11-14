# Reporte de Conectividad a Supabase

## Estado Actual

### ✅ Completado
1. **Schema de BD migrado al 100%** en Supabase
   - 27 tipos ENUM
   - 25 tablas
   - 25 primary keys
   - 42 foreign keys
   - 44 índices

2. **DNS configurado correctamente**
   - Cloudflare DNS (1.1.1.1, 1.0.0.1) configurado en Windows
   - DNS resuelve correctamente los dominios de Supabase

3. **MCP de Supabase funcionando**
   - Podemos ejecutar queries SQL via MCP
   - Podemos gestionar el proyecto via API de Supabase

### ❌ Problema Actual

**Node.js local no puede conectarse a PostgreSQL de Supabase**

#### Síntomas:
1. **Conexión Directa** (`db.vohlomomrskxnuksodmt.supabase.co:5432`):
   - Error: `getaddrinfo ENOTFOUND`
   - Causa: El dominio solo devuelve IPv6, Node.js en Windows no puede conectarse

2. **Connection Pooler** (`aws-0-us-east-2.pooler.supabase.com:5432`):
   - Error: `Tenant or user not found`
   - Causa: Problema con las credenciales o formato del usuario

## Opciones de Solución

### Opción 1: Verificar Credenciales (RECOMENDADO)

**Pasos:**
1. Ve al dashboard de Supabase:
   ```
   https://supabase.com/dashboard/project/vohlomomrskxnuksodmt
   ```

2. Click en el botón **"Connect"** (esquina superior derecha)

3. Selecciona **"Connection Pooler"** > **"Session mode"**

4. Copia el connection string COMPLETO que aparece

5. Actualiza `backend/.env` con el connection string correcto

### Opción 2: Reset de Contraseña

Si las credenciales actuales no funcionan:

1. Ve a:
   ```
   https://supabase.com/dashboard/project/vohlomomrskxnuksodmt/settings/database
   ```

2. Click en **"Reset database password"**

3. Copia la nueva contraseña

4. Actualiza `backend/.env`:
   ```bash
   DATABASE_URL=postgresql://postgres.vohlomomrskxnuksodmt:[NUEVA_PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres
   ```

### Opción 3: Usar Supabase IPv4 Add-on (De Pago)

Si tienes plan Pro o superior:

1. Ve a Settings > Add-ons
2. Habilita "IPv4 Address"
3. Usa la conexión directa con IPv4

### Opción 4: Desarrollo en Producción (TEMPORAL)

Mientras resolvemos la conectividad local:

1. Configurar DATABASE_URL en Dokku con Supabase
2. Desarrollar/probar directamente en el servidor
3. El servidor probablemente tiene mejor soporte IPv6

**Comando:**
```bash
dokku config:set nexopos DATABASE_URL="postgresql://postgres.vohlomomrskxnuksodmt:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

### Opción 5: Usar VPN o Datos Móviles

Probar la conexión desde:
- Otra red WiFi
- Datos móviles del teléfono (hotspot)
- VPN (Cloudflare WARP, ProtonVPN, etc.)

## Próximos Pasos Recomendados

1. **Obtener connection string correcto** desde el dashboard (Opción 1)
2. **Probar conexión** con el nuevo connection string
3. Si funciona: **Importar datos** desde el backup de Dokku
4. **Desplegar a producción** en Dokku con las nuevas credenciales

## Comandos de Prueba

Una vez tengamos el connection string correcto:

```bash
# Probar conexión
node test-connection.js

# Iniciar backend
cd backend && npm run start:dev

# Si funciona, importar datos
node import-backup.js
```

## Información de Contacto

- **Proyecto Supabase:** nexopos-production
- **ID:** vohlomomrskxnuksodmt
- **Región:** us-east-2 (Ohio)
- **Dashboard:** https://supabase.com/dashboard/project/vohlomomrskxnuksodmt

## Notas Técnicas

### Formatos de Connection String

**Session Mode (IPv4):**
```
postgresql://postgres.PROJECT_ID:[PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres
```

**Direct Connection (IPv6):**
```
postgresql://postgres:[PASSWORD]@db.PROJECT_ID.supabase.co:5432/postgres
```

### Password Encoding

Si la contraseña tiene caracteres especiales:
- `*` debe codificarse como `%2A`
- Ejemplo: `Tomateatomico41*` → `Tomateatomico41%2A`

---

**Última actualización:** 2025-11-10
**Estado:** Esperando verification string correcto del dashboard
