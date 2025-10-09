# Fix para SPA Routing en Render

## Problema
URLs directas como `/login` o `/register` retornan 404 en producción.

## Causa
Render está intentando buscar archivos físicos `/login.html` en lugar de servir `index.html` para todas las rutas (comportamiento esperado de SPA).

## Soluciones Implementadas

### 1. Archivos de configuración
- ✅ `frontend/public/_redirects` - Ya existía con `/* /index.html 200`
- ✅ `frontend/public/_headers` - Añadido para security headers
- ✅ `render.yaml` - Actualizado con sección `routes`

### 2. Configuración Manual en Render Dashboard

**IMPORTANTE**: Si los cambios en `render.yaml` no se aplican automáticamente, sigue estos pasos:

#### Opción A: Configurar Redirects/Rewrites en el Dashboard

1. Ve a https://dashboard.render.com
2. Selecciona el servicio `nexopos-frontend`
3. Ve a la pestaña **"Redirects/Rewrites"** (puede estar en Settings)
4. Añade una nueva regla:
   ```
   Source: /*
   Destination: /index.html
   Type: Rewrite (200)
   ```
5. Guarda y espera el re-deploy automático

#### Opción B: Verificar configuración del servicio

1. En el servicio `nexopos-frontend`
2. Ve a **"Settings"**
3. Verifica que:
   - **Publish Directory**: `./frontend/dist` ✅
   - **Build Command**: `cd frontend && npm install && npm run build` ✅
   - **Auto-Deploy**: Yes ✅

#### Opción C: Re-crear el servicio (si nada funciona)

1. Elimina el servicio `nexopos-frontend`
2. Crea uno nuevo usando el blueprint `render.yaml`
3. Render aplicará todas las configuraciones correctamente

### 3. Verificar que funciona

Después del deploy, prueba estas URLs directamente en el navegador:

- ✅ https://nexopos-1.onrender.com/
- ✅ https://nexopos-1.onrender.com/login
- ✅ https://nexopos-1.onrender.com/register
- ✅ Recarga (F5) en cualquier ruta

**Todas deberían cargar correctamente sin error 404**

### 4. Limpiar caché del navegador

Después del deploy, limpia el caché:
- **Chrome/Edge**: Ctrl + Shift + R (Windows) / Cmd + Shift + R (Mac)
- **Firefox**: Ctrl + F5
- O usa modo incógnito para probar

## Archivos modificados

- `frontend/public/_headers` (nuevo)
- `render.yaml` (actualizado)

## Commit
```
18d64b1 - Fix: Configurar SPA routing para Render static site
```
