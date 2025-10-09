# ⚡ Solución Rápida - Configurar Rewrite en Dashboard de Render

## El Problema Real
Render Static Sites **requiere configuración MANUAL** de rewrites en el dashboard.
Los archivos `_redirects`, `render.json`, y `render.yaml` NO se aplican automáticamente a servicios existentes.

## ✅ Solución en 3 Minutos

### Paso 1: Ve al Dashboard
1. Abre https://dashboard.render.com
2. Busca el servicio **`nexopos-frontend`**
3. Click en el servicio para abrirlo

### Paso 2: Configurar Redirect/Rewrite

Busca una de estas secciones (varía según la versión de Render):

**Opción A: Si ves pestaña "Redirects/Rewrites"**
1. Click en la pestaña **"Redirects/Rewrites"**
2. Click en **"Add Rule"** o similar
3. Configura:
   ```
   Source: /*
   Destination: /index.html
   Type: Rewrite (o Status Code: 200)
   ```
4. Click **"Save"**

**Opción B: Si ves "Settings" → "Custom Domains & HTTPS"**
Puede que no haya opción de rewrites. En ese caso, **debes recrear el servicio como Web Service**.

**Opción C: Revisar "Environment" o "Settings"**
Algunos servicios tienen opciones de rewrite en Settings → Advanced o similar.

### Paso 3: Verificar

Si la opción existe y la configuraste:
1. El servicio se re-desplegará automáticamente (o haz "Manual Deploy")
2. Espera 2-3 minutos
3. Prueba: https://nexopos-1.onrender.com/login

### ⚠️ Si NO encuentras la opción de Redirects/Rewrites

**Significa que Render Static Sites en tu cuenta NO soporta rewrites configurables.**

**Única solución real**: Recrear como Web Service (ver `RECREAR_FRONTEND_RENDER.md`)

---

## 🎯 Recomendación Final

**Recrear el servicio como Web Service** es la solución más confiable:
- ✅ Control total del servidor (Express)
- ✅ No depende de características limitadas de Static Sites
- ✅ Funciona en todos los casos
- ✅ Más configurabilidad futura

**Toma solo 5-10 minutos y resuelve el problema definitivamente.**

Ver instrucciones completas en: `RECREAR_FRONTEND_RENDER.md`
