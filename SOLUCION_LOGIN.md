# 🔧 Solución al Error de Login

## Problema Identificado

El error muestra:
```
POST https://nexopos-aaj2.onrender.com/auth/login 404 (Not Found)
```

Debería ser:
```
POST https://nexopos-aaj2.onrender.com/api/auth/login
```

**Falta el `/api` en la URL.**

## Causa

Render **NO está usando** el archivo `.env.production` del repositorio. Render requiere que las variables de entorno se configuren manualmente en el Dashboard.

## ✅ Solución Paso a Paso

### 1. Ve a Render Dashboard

https://dashboard.render.com

### 2. Selecciona el servicio del frontend

- Busca **nexopos-1** o **nexopos-frontend**
- Click en el servicio

### 3. Ve a Environment

- En el menú lateral izquierdo, click en **"Environment"**

### 4. Agrega/Edita la variable VITE_API_URL

**IMPORTANTE**: Debe incluir `/api` al final

```
VITE_API_URL=https://nexopos-aaj2.onrender.com/api
```

Si ya existe la variable pero sin `/api`, edítala para agregar el `/api`.

### 5. Guarda los cambios

- Click en **"Save Changes"**

### 6. Redeploy

Render debería hacer redeploy automáticamente. Si no:
- Click en **"Manual Deploy"** (botón arriba a la derecha)
- Selecciona **"Clear build cache & deploy"**

### 7. Espera el deployment

El proceso tarda 2-5 minutos. Puedes ver el progreso en la pestaña **"Logs"**.

### 8. Prueba el login

Una vez completado el deployment:

1. Abre https://nexopos-1.onrender.com
2. **Hard refresh**: Presiona `Ctrl + Shift + R` o `Ctrl + F5`
3. Si hay Service Worker viejo, abre DevTools (F12) → Application → Service Workers → Unregister
4. Recarga la página
5. Intenta login con:
   - Email: `admin@nexopos.co`
   - Password: `Admin123!`

---

## 🧪 Herramienta de Prueba

Si quieres verificar que el backend funciona antes de esperar el redeploy, abre este archivo en tu navegador:

```
test-login.html
```

Este archivo hace login directamente al backend y te mostrará si las credenciales funcionan.

---

## ❓ Si sigue sin funcionar

1. **Limpia caché del navegador**:
   - Chrome: Ctrl + Shift + Delete → Selecciona "Cached images and files" → Clear data

2. **Desregistra Service Worker**:
   - F12 → Application → Service Workers → Click "Unregister" en nexopos-1.onrender.com

3. **Prueba en modo incógnito**:
   - Ctrl + Shift + N

4. **Verifica que el build usó la variable correcta**:
   - Abre DevTools → Console
   - Escribe: `localStorage.clear()` y presiona Enter
   - Recarga la página
   - En Network tab, busca el archivo JS principal
   - Busca dentro la string "nexopos-aaj2.onrender.com/api"

---

## 📋 Checklist

- [ ] Variable `VITE_API_URL=https://nexopos-aaj2.onrender.com/api` configurada en Render Dashboard
- [ ] Deployment completado (sin errores en Logs)
- [ ] Hard refresh en el navegador (Ctrl + Shift + R)
- [ ] Service Worker desregistrado (si existía)
- [ ] Login funciona con admin@nexopos.co / Admin123!

---

## 🎯 Confirmación

Una vez que funcione, deberías ver:
- En Network tab: `POST https://nexopos-aaj2.onrender.com/api/auth/login` → Status 200
- La aplicación te redirige al dashboard
- Ves tu nombre de usuario arriba a la derecha

---

## 📞 Si necesitas ayuda

1. Revisa los Logs del deployment en Render
2. Busca errores de build
3. Verifica que la variable aparece en los logs como: `VITE_API_URL: https://nexopos-aaj2.onrender.com/api`
