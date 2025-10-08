# Troubleshooting - NexoPOS

## Errores de Terceros en la Consola del Navegador

### Error: `overbridgenet.com/jsv8/offer` o `LaunchDarkly`

**Síntoma**: Ves estos errores en la consola del navegador:
```
overbridgenet.com/jsv8/offer:1  Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR
[LaunchDarkly] LaunchDarkly client initialized
```

**Causa**: Estos errores **NO son de tu aplicación NexoPOS**. Son causados por:
- Extensiones del navegador (ad blockers, optimizadores, etc.)
- Software de terceros instalado en tu sistema

**Solución**: Para probar tu aplicación sin interferencias:

1. **Modo Incógnito/Privado**:
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
   - Edge: `Ctrl + Shift + N`

   Las extensiones generalmente están deshabilitadas en modo incógnito.

2. **Deshabilitar extensiones temporalmente**:
   - Chrome: Ve a `chrome://extensions/`
   - Desactiva todas las extensiones
   - Recarga tu aplicación

3. **Verificar extensiones sospechosas**:
   - Busca extensiones relacionadas con:
     - Ad blockers
     - VPN
     - Optimizadores web
     - Extensiones desconocidas
   - Desinstala las que no reconozcas

**Verificación**: Si el error desaparece en modo incógnito, confirma que era una extensión.

---

## Error: Favicon 404

**Síntoma**:
```
/favicon.ico:1  Failed to load resource: the server responded with a status of 404 ()
```

**Causa**: El archivo `favicon.ico` no existe en `/public` del frontend.

**Solución**:
```bash
cd frontend/public
# Agrega un favicon.ico o copia el vite.svg como favicon
```

**Nota**: Este error es cosmético y no afecta la funcionalidad.

---

## Frontend no conecta con Backend

**Síntoma**: La aplicación carga pero no puede hacer login o fetch data.

**Pasos de diagnóstico**:

1. **Abre DevTools** (F12) → **Network**
2. Intenta hacer login
3. Busca requests a `/api/auth/login`
4. Verifica:
   - ¿La request va a `https://nexopos-aaj2.onrender.com/api`?
   - ¿O va a `localhost:3000/api`?

**Si va a localhost**:
```bash
# Necesitas rebuild del frontend con VITE_API_URL correcta
# 1. Ve a Render Dashboard → nexopos-1 (frontend)
# 2. Environment → Agrega:
#    VITE_API_URL=https://nexopos-aaj2.onrender.com/api
# 3. Manual Deploy → Deploy latest commit
```

**Si va a nexopos-aaj2 pero falla**:
- Verifica que el backend esté activo: https://nexopos-aaj2.onrender.com/api
- Revisa logs del backend en Render Dashboard

---

## Error de CORS

**Síntoma**:
```
Access to fetch at 'https://nexopos-aaj2.onrender.com/api/auth/login' from origin 'https://nexopos-1.onrender.com' has been blocked by CORS policy
```

**Causa**: El backend no está permitiendo requests del frontend.

**Solución**:

1. **Verifica CORS en backend** (`backend/src/main.ts`):
   ```typescript
   app.enableCors({
     origin: true, // Permite cualquier origen
     credentials: true,
   });
   ```

2. **O especifica el origen exacto**:
   ```typescript
   app.enableCors({
     origin: 'https://nexopos-1.onrender.com',
     credentials: true,
   });
   ```

3. **Redeploy del backend** después de cambios

---

## Base de Datos: Conexión rechazada

**Síntoma**: Backend falla al iniciar con error de conexión a PostgreSQL.

**Pasos**:

1. **Verifica que la DB esté activa** en Render Dashboard
2. **Revisa variables de entorno** del backend:
   ```env
   DB_HOST=dpg-d3hiuoj3fgac739rg2hg-a
   DB_PORT=5432
   DB_NAME=nexopos
   DB_USER=nexopos
   DB_PASSWORD=[tu-password]
   ```
3. **Usa la URL interna** de la DB (no la externa) para mejor performance

---

## Servicios se suspenden (Plan Free)

**Síntoma**: La primera request tarda 30-60 segundos después de inactividad.

**Causa**: Los servicios Free de Render se suspenden después de 15 minutos sin uso.

**Soluciones**:

1. **Inmediata**: Espera que el servicio despierte (es normal)
2. **Temporal**: Usa un uptime monitor (ej: UptimeRobot) para hacer ping cada 10 min
3. **Permanente**: Upgradea a plan paid ($7/mes por servicio)

---

## No puedo hacer login

**Síntoma**: Frontend y backend conectan, pero login falla.

**Pasos**:

1. **Verifica que exista un usuario** en la base de datos:
   ```bash
   # Render Dashboard → Backend → Shell
   npm run seed
   ```

2. **O crea un usuario manualmente**:
   ```bash
   # Shell del backend
   npx typeorm query "INSERT INTO users (email, password, name, role) VALUES ('admin@nexopos.com', '$2b$12$...', 'Admin', 'admin')"
   ```

3. **Revisa logs del backend** para ver el error exacto

---

## Migraciones no aplicadas

**Síntoma**: Backend arranca pero falla al usar ciertas features.

**Solución**:
```bash
# Render Dashboard → Backend → Shell
npm run migration:run
```

---

## Build del Frontend falla

**Síntoma**: Deploy del frontend falla en Render con errores de TypeScript.

**Pasos**:

1. **Verifica localmente**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Revisa logs** en Render para el error exacto

3. **Verifica node version**:
   - En `package.json` especifica la versión de Node
   - Render usa la version del `engines` field

---

## Scripts de Verificación

### Verificar servicios están activos
```bash
node check-render.js
```

### Verificación completa
```bash
node test-deployment.js
```

---

## Logs Útiles

### Backend Logs
```bash
# Render Dashboard → nexopos-backend → Logs
# Busca por:
# - "Error" - errores generales
# - "database" - problemas de DB
# - "port" - problemas de puerto
```

### Frontend Logs (en el navegador)
```javascript
// Abre DevTools → Console
// Filtra por:
localStorage.getItem('auth-storage') // Ver token guardado
```

---

## Contacto y Recursos

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com/
- **NexoPOS Deployment Guide**: `DEPLOYMENT_RENDER.md`

---

## Checklist de Verificación Rápida

Cuando algo no funciona, verifica en orden:

- [ ] ¿Servicios activos? → `node check-render.js`
- [ ] ¿Frontend tiene VITE_API_URL correcta? → Render Dashboard → Environment
- [ ] ¿Backend conecta a DB? → Revisa logs
- [ ] ¿Migraciones aplicadas? → `npm run migration:run` en Shell
- [ ] ¿Usuario existe? → `npm run seed` en Shell
- [ ] ¿CORS configurado? → Revisa `backend/src/main.ts`
- [ ] ¿Errores en consola de NEXOPOS?** → Ignora errores de extensiones (overbridgenet, etc.)

---

## Notas Importantes

1. **Errores de terceros** (overbridgenet, LaunchDarkly, etc.) **NO afectan tu aplicación**
2. **Variables VITE_*** se baken en build-time, necesitas rebuild después de cambiarlas
3. **Servicios Free** se suspenden, el primer request tarda más
4. **Logs** son tu mejor amigo para debugging
