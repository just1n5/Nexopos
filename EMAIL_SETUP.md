# Configuración de Email para NexoPOS

## Descripción
El sistema envía emails de bienvenida automáticamente cuando un nuevo usuario se registra usando una beta key.

## Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env` o en la configuración de Render:

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
EMAIL_FROM=NexoPOS <noreply@nexopos.com>
FRONTEND_URL=https://nexopos-1.onrender.com
```

### Opción 1: Gmail (Recomendado para desarrollo)

1. **Habilitar autenticación de 2 factores** en tu cuenta de Gmail
2. **Generar contraseña de aplicación**:
   - Ve a https://myaccount.google.com/security
   - Busca "Contraseñas de aplicaciones"
   - Genera una nueva contraseña para "Correo"
   - Copia la contraseña generada (sin espacios)

3. **Configurar variables**:
```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tunegocio@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # La contraseña de aplicación
EMAIL_FROM=NexoPOS <noreply@tunegocio.com>
```

### Opción 2: SendGrid (Recomendado para producción)

1. Crear cuenta en https://sendgrid.com (gratis hasta 100 emails/día)
2. Generar API Key
3. Configurar:

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Tu SendGrid API Key
EMAIL_FROM=NexoPOS <noreply@tudominio.com>
```

### Opción 3: Mailgun

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@tudominio.mailgun.org
EMAIL_PASS=tu-mailgun-password
EMAIL_FROM=NexoPOS <noreply@tudominio.com>
```

### Opción 4: Amazon SES

```env
EMAIL_ENABLED=true
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=tu-ses-smtp-username
EMAIL_PASS=tu-ses-smtp-password
EMAIL_FROM=NexoPOS <noreply@tudominio.com>
```

## Desactivar Emails

Si no quieres enviar emails (por ejemplo en desarrollo local):

```env
EMAIL_ENABLED=false
```

El registro funcionará normalmente, simplemente no se enviará el email de bienvenida.

## Contenido del Email

El email de bienvenida incluye:

- ✅ Saludo personalizado con nombre del usuario
- ✅ Confirmación del nombre del negocio
- ✅ Clave beta utilizada
- ✅ Botón de acceso directo al login
- ✅ Lista de primeros pasos
- ✅ Tips para comenzar
- ✅ Diseño responsive (HTML profesional)

## Testing

Para probar el envío de emails localmente:

```bash
# 1. Configurar .env con credenciales de Gmail
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password-de-app
EMAIL_FROM=NexoPOS Dev <dev@nexopos.com>
FRONTEND_URL=http://localhost:5173

# 2. Reiniciar el servidor
npm run start:dev

# 3. Registrar un usuario de prueba con una beta key válida
# El email debería llegar en unos segundos
```

## Troubleshooting

### Error: "Invalid login"
- Verifica que EMAIL_USER y EMAIL_PASS sean correctos
- Si usas Gmail, asegúrate de usar una contraseña de aplicación, no tu contraseña normal

### Error: "Connection timeout"
- Verifica que EMAIL_HOST y EMAIL_PORT sean correctos
- Algunos proveedores de internet bloquean el puerto 587, prueba con puerto 465

### Email no llega
- Revisa la carpeta de spam
- Verifica los logs del backend para errores
- Verifica que EMAIL_FROM sea un email válido

### Email llega sin formato
- Asegúrate de que el cliente de email soporte HTML
- El template está optimizado para Gmail, Outlook y Apple Mail

## Configuración en Render

1. Ve a tu servicio backend en Render
2. Click en "Environment"
3. Agrega las variables de email:
   ```
   EMAIL_ENABLED=true
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=tunegocio@gmail.com
   EMAIL_PASS=tu-password-de-app
   EMAIL_FROM=NexoPOS <noreply@tunegocio.com>
   FRONTEND_URL=https://nexopos-1.onrender.com
   ```
4. Click en "Save Changes"
5. El servicio se reiniciará automáticamente

## Seguridad

⚠️ **NUNCA** commitees las credenciales reales en el repositorio
✅ Siempre usa variables de entorno
✅ Usa contraseñas de aplicación, no contraseñas principales
✅ Considera rotar las credenciales periódicamente

## Personalización

Si quieres modificar el template del email, edita:
`backend/src/modules/email/email.service.ts` → método `getWelcomeEmailTemplate()`

## Logs

Los emails se registran en los logs del backend:
- ✅ Éxito: `Welcome email sent to user@example.com: <message-id>`
- ⚠️ Advertencia: `Email transporter not configured. Skipping welcome email.`
- ❌ Error: `Failed to send welcome email to user@example.com: [error]`
