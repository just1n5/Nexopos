# Guía de Deployment en Render - NexoPOS

## 📋 Información de Servicios

### URLs de Producción
- **Frontend**: https://nexopos-1.onrender.com
- **Backend**: https://nexopos-aaj2.onrender.com
- **Base de Datos**: dpg-d3hiuoj3fgac739rg2hg-a (PostgreSQL)

---

## 🚀 Configuración Inicial

### 1. Backend (NestJS)

#### Variables de Entorno Requeridas en Render

Ve a tu servicio backend en Render y configura estas variables de entorno:

```env
# Node
NODE_ENV=production
PORT=3000

# Database (Render las configura automáticamente desde la DB)
DB_HOST=dpg-d3hiuoj3fgac739rg2hg-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=nexopos
DB_USER=nexopos
DB_PASSWORD=[tu-password-de-render]
DB_SCHEMA=public
DB_LOGGING=false
DB_SYNC=false

# Authentication
JWT_SECRET=[genera-un-secreto-seguro]
JWT_EXPIRES_IN=86400s
BCRYPT_SALT_ROUNDS=12
```

#### Build Command
```bash
cd backend && npm install && npm run build
```

#### Start Command
```bash
cd backend && npm run start:prod
```

---

### 2. Frontend (React + Vite)

#### Variables de Entorno Requeridas en Render

**IMPORTANTE**: Las variables `VITE_*` deben configurarse ANTES del build.

```env
# API
VITE_API_URL=https://nexopos-aaj2.onrender.com/api

# Ambiente
VITE_ENV=production

# DIAN
VITE_DIAN_TEST_MODE=true
VITE_DIAN_API_URL=https://api.dian.gov.co/v1

# App
VITE_APP_VERSION=1.0.0

# Features
VITE_FEATURE_ECOMMERCE=false
VITE_FEATURE_MULTI_BRANCH=false
VITE_FEATURE_ANALYTICS=true

# Hardware (deshabilitado en web)
VITE_ENABLE_BARCODE_SCANNER=false
VITE_ENABLE_PRINTER=false
VITE_ENABLE_CASH_DRAWER=false

# Soporte
VITE_SUPPORT_EMAIL=soporte@nexopos.com
VITE_SUPPORT_PHONE=+57 300 123 4567
VITE_SUPPORT_WHATSAPP=573001234567
```

#### Build Command
```bash
cd frontend && npm install && npm run build
```

#### Publish Directory
```
frontend/dist
```

#### Configuración de SPA (Single Page Application)

Render necesita redirigir todas las rutas a `index.html` para que React Router funcione.

**Opción 1: Usar configuración de Rewrite Rules**
En Render Dashboard → Settings → Redirects/Rewrites:
- Source: `/*`
- Destination: `/index.html`
- Type: `Rewrite`

**Opción 2: Usar render.yaml** (ya incluido en este proyecto)

---

### 3. Base de Datos PostgreSQL

#### Información de Conexión
- **Name**: nexopos-db
- **ID**: dpg-d3hiuoj3fgac739rg2hg-a
- **Region**: Oregon

#### Conexión Manual (para migraciones o troubleshooting)
```bash
# Desde el dashboard de Render, copia la "External Database URL"
psql [EXTERNAL_DATABASE_URL]
```

#### Migraciones

**Opción 1: Ejecutar desde local**
```bash
cd backend
# Configura temporalmente DB_HOST con la URL externa de Render
npm run migration:run
```

**Opción 2: Ejecutar desde Render Shell**
```bash
# En el dashboard de backend, abre Shell y ejecuta:
npm run migration:run
```

---

## 🔧 Pasos para Actualizar el Deployment

### Actualizar Backend

1. Haz commit y push de tus cambios:
```bash
git add .
git commit -m "Update backend"
git push origin main
```

2. Render detectará el push y comenzará el deployment automáticamente.

3. Si hay migraciones nuevas, ejecútalas desde el Shell de Render.

### Actualizar Frontend

1. **IMPORTANTE**: Asegúrate de que las variables de entorno estén configuradas en Render.

2. Haz commit y push:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```

3. Render rebuildeará el frontend con las variables correctas.

### Forzar Rebuild

Si necesitas forzar un rebuild sin cambios:
- Ve al dashboard del servicio en Render
- Click en "Manual Deploy" → "Clear build cache & deploy"

---

## 🐛 Troubleshooting

### Error: Frontend no conecta con Backend

**Problema**: El frontend muestra errores de conexión o CORS.

**Solución**:
1. Verifica que `VITE_API_URL` esté configurada en las variables de entorno de Render.
2. Rebuilda el frontend (las variables `VITE_*` se leen en build-time, no runtime).
3. Verifica que el backend esté corriendo: visita `https://nexopos-aaj2.onrender.com/api`

### Error: Backend no inicia

**Problema**: El servicio del backend falla al iniciar.

**Solución**:
1. Revisa los logs en Render Dashboard → Logs
2. Verifica las variables de entorno de la base de datos
3. Asegúrate de que el build command incluya `npm run build`

### Error: 404 en rutas del frontend

**Problema**: Al navegar directamente a una URL como `/inventory`, obtienes 404.

**Solución**:
1. Configura el rewrite rule en Render (ver sección Frontend arriba)
2. O asegúrate de que `render.yaml` esté en el root del proyecto

### Error: Database connection refused

**Problema**: El backend no puede conectarse a la base de datos.

**Solución**:
1. Verifica que la base de datos esté activa en Render
2. Revisa las credenciales en las variables de entorno
3. Asegúrate de usar la URL **interna** de la base de datos (no la externa) para mejor rendimiento:
   - Interna: `dpg-xxx-a` (más rápido, solo funciona entre servicios de Render)
   - Externa: `dpg-xxx-a.oregon-postgres.render.com` (más lento, funciona desde cualquier lugar)

### Plan Free se suspende (servicios inactivos)

**Problema**: Los servicios free de Render se suspenden después de 15 minutos de inactividad.

**Soluciones**:
1. **Inmediata**: El primer request despertará el servicio (puede tardar 30-60 segundos)
2. **Temporal**: Configurar un cron job o uptime monitor (ej: UptimeRobot) para hacer ping cada 10 minutos
3. **Permanente**: Upgradear a plan paid ($7/mes por servicio)

---

## 📝 Checklist de Deployment

### Primera vez

- [ ] Base de datos creada en Render
- [ ] Backend deployado y conectado a DB
- [ ] Variables de entorno del backend configuradas
- [ ] Migraciones ejecutadas
- [ ] Seed de datos iniciales (opcional)
- [ ] Frontend deployado
- [ ] Variables de entorno del frontend configuradas (especialmente `VITE_API_URL`)
- [ ] Rewrite rules configuradas para SPA
- [ ] Crear un usuario de prueba
- [ ] Verificar login funcional
- [ ] Verificar que el POS carga productos

### Cada actualización

- [ ] Código commiteado y pusheado a main
- [ ] Render detectó el push (o manual deploy)
- [ ] Build exitoso (revisar logs)
- [ ] Migraciones ejecutadas (si hay nuevas)
- [ ] Smoke test: abrir app y verificar funcionalidad básica

---

## 🔐 Seguridad

### Variables Sensibles

**NUNCA** hagas commit de:
- Passwords de base de datos
- JWT secrets
- API keys de terceros (DIAN, pasarelas de pago)

Render las inyecta de forma segura via environment variables.

### Recomendaciones

1. Genera un `JWT_SECRET` fuerte:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. Usa diferentes secrets para development y production

3. Rota los secrets periódicamente

---

## 📊 Monitoreo

### Logs

Ver logs en tiempo real:
- Render Dashboard → Tu servicio → Logs

### Health Checks

Render hace health checks automáticos al endpoint raíz.

Para el backend, puedes agregar un endpoint `/health`:
```typescript
@Get('health')
getHealth() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

### Métricas

Render Free plan incluye:
- CPU usage
- Memory usage
- Bandwidth
- Request count

---

## 💡 Optimizaciones

### Backend

1. **Caching**: Considera agregar Redis para cache (disponible en Render)
2. **Connection Pooling**: TypeORM ya lo maneja, pero puedes ajustar `max` connections
3. **Logging**: En production, usa `DB_LOGGING=false` para mejor performance

### Frontend

1. **Code Splitting**: Vite ya lo hace automáticamente
2. **Asset Optimization**: Las imágenes deben estar optimizadas antes del build
3. **CDN**: Considera usar Cloudflare en frente de Render para mejor cache global

---

## 📞 Soporte

Si tienes problemas con Render:
- [Render Docs](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [Render Status](https://status.render.com/)

Para problemas específicos de NexoPOS:
- Revisa los logs del backend y frontend
- Verifica las variables de entorno
- Asegúrate de que las URLs estén correctamente configuradas
