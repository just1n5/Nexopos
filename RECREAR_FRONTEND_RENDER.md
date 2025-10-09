# Cómo Recrear el Servicio Frontend en Render

## Problema
Render NO puede cambiar automáticamente un servicio de tipo "Static Site" a "Web Service".
El servicio `nexopos-frontend` fue creado como Static Site, y necesita ser Web Service para usar Express.

## Solución: Recrear el Servicio Manualmente

### Paso 1: Eliminar el servicio actual

1. Ve a https://dashboard.render.com
2. Busca el servicio **`nexopos-frontend`**
3. Click en el servicio
4. Ve a **Settings** (en la barra lateral)
5. Scroll hasta el final y click en **"Delete Web Service"**
6. Confirma la eliminación

⚠️ **IMPORTANTE**: Anota la URL del servicio antes de eliminarlo (ej: `nexopos-1.onrender.com`)

### Paso 2: Crear nuevo servicio Web Service

**Opción A: Usando Blueprint (Recomendado)**

1. En el Dashboard, click **"New +"** → **"Blueprint"**
2. Conecta tu repositorio **`just1n5/Nexopos`**
3. Selecciona la rama **`main`**
4. Render detectará automáticamente el archivo `render.yaml`
5. Click **"Apply"**
6. Render creará todos los servicios (backend, frontend, database)

**Opción B: Manual**

1. En el Dashboard, click **"New +"** → **"Web Service"**
2. Conecta tu repositorio **`just1n5/Nexopos`**
3. Configuración:
   ```
   Name: nexopos-frontend
   Region: Oregon
   Branch: main
   Runtime: Node
   Build Command: cd frontend && npm install && npm run build
   Start Command: cd frontend && npm start
   ```
4. Variables de entorno (añadir una por una):
   ```
   NODE_ENV=production
   PORT=3001
   VITE_API_URL=https://nexopos-aaj2.onrender.com/api
   VITE_ENV=production
   VITE_DIAN_TEST_MODE=true
   VITE_APP_VERSION=1.0.0
   VITE_FEATURE_ECOMMERCE=false
   VITE_FEATURE_MULTI_BRANCH=false
   VITE_FEATURE_ANALYTICS=true
   ```
5. Click **"Create Web Service"**

### Paso 3: Actualizar DNS/URLs (si es necesario)

Si la nueva URL es diferente a `nexopos-1.onrender.com`:
1. Anota la nueva URL (ej: `nexopos-frontend-abc123.onrender.com`)
2. Actualiza las variables de entorno del **backend** si usa la URL del frontend
3. Actualiza cualquier configuración de CORS en el backend

### Paso 4: Esperar el Deploy

- El primer deploy puede tomar **10-15 minutos**
- Ve a la pestaña "Logs" para ver el progreso
- Busca el mensaje: `✅ Frontend server running on http://0.0.0.0:3001`

### Paso 5: Probar

Prueba estas URLs directamente:
- ✅ https://[TU-URL].onrender.com/
- ✅ https://[TU-URL].onrender.com/login
- ✅ https://[TU-URL].onrender.com/register

**Todas deberían funcionar sin 404**

---

## Alternativa: Si no puedes/quieres recrear

Si prefieres NO recrear el servicio, usa la **Opción 2** en `WORKAROUND_STATIC_RENDER.md`
