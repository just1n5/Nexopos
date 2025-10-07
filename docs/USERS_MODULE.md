# 📚 Módulo de Gestión de Usuarios - NexoPOS

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Roles y Permisos](#roles-y-permisos)
3. [API Endpoints](#api-endpoints)
4. [Guía de Usuario](#guía-de-usuario)
5. [Características de Seguridad](#características-de-seguridad)
6. [Auditoría](#auditoría)
7. [FAQ](#faq)

---

## Descripción General

El módulo de gestión de usuarios permite a los administradores y managers crear, editar y gestionar las cuentas de usuario del sistema NexoPOS. Incluye control de acceso basado en roles, auditoría completa y validaciones de seguridad.

### Características Principales

✅ CRUD completo de usuarios
✅ Sistema de roles (Admin, Manager, Cajero)
✅ Cambio de contraseña seguro
✅ Validación de fortaleza de contraseña
✅ Auditoría de acciones críticas
✅ Activación/Desactivación de usuarios
✅ Búsqueda y filtros avanzados
✅ Interfaz responsive (desktop y mobile)

---

## Roles y Permisos

### 🔴 ADMIN (Administrador)

**Permisos:**
- ✅ Crear, editar y eliminar cualquier usuario
- ✅ Crear otros administradores
- ✅ Acceso a todas las configuraciones
- ✅ Ver todos los reportes
- ✅ Configurar DIAN
- ✅ Gestionar hardware y pagos

**Restricciones:**
- ❌ No puede eliminar su propia cuenta
- ❌ No puede desactivarse a sí mismo
- ❌ No puede eliminar el último administrador

### 🟡 MANAGER (Manager)

**Permisos:**
- ✅ Crear y editar cajeros
- ✅ Ver reportes
- ✅ Gestionar inventario
- ✅ Configurar hardware
- ✅ Aprobar créditos

**Restricciones:**
- ❌ No puede crear administradores ni managers
- ❌ No puede editar usuarios administradores
- ❌ No puede configurar DIAN ni pagos
- ❌ Solo puede eliminar cajeros

### 🟢 CASHIER (Cajero)

**Permisos:**
- ✅ Procesar ventas
- ✅ Manejar caja registradora
- ✅ Ver su propio perfil
- ✅ Cambiar su propia contraseña
- ✅ Ver inventario (solo lectura)

**Restricciones:**
- ❌ No puede gestionar usuarios
- ❌ No puede ver reportes completos
- ❌ No puede modificar configuraciones
- ❌ Solo puede ver sus propias ventas

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/users
```

### Autenticación
Todos los endpoints requieren JWT token en el header:
```
Authorization: Bearer {token}
```

---

### 📌 GET /users
Obtener lista de todos los usuarios.

**Permisos:** Admin, Manager

**Response:**
```json
[
  {
    "id": "uuid",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

---

### 📌 GET /users/me
Obtener perfil del usuario autenticado.

**Permisos:** Todos

**Response:**
```json
{
  "id": "uuid",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "role": "CASHIER",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### 📌 GET /users/:id
Obtener usuario específico por ID.

**Permisos:** Admin, Manager

**Response:**
```json
{
  "id": "uuid",
  "firstName": "María",
  "lastName": "García",
  "email": "maria@example.com",
  "role": "MANAGER",
  "isActive": true,
  "createdAt": "2024-02-10T10:00:00Z",
  "updatedAt": "2024-02-10T10:00:00Z"
}
```

---

### 📌 POST /users
Crear nuevo usuario.

**Permisos:** Admin (cualquier rol), Manager (solo CASHIER)

**Request Body:**
```json
{
  "firstName": "Pedro",
  "lastName": "López",
  "email": "pedro@example.com",
  "password": "Admin123!",
  "role": "CASHIER"
}
```

**Validaciones:**
- Email: formato válido, único
- Password: mínimo 8 caracteres
- firstName/lastName: máximo 60 caracteres
- role: ADMIN | MANAGER | CASHIER (opcional, default: CASHIER)

**Response:**
```json
{
  "id": "uuid-nuevo",
  "firstName": "Pedro",
  "lastName": "López",
  "email": "pedro@example.com",
  "role": "CASHIER",
  "isActive": true,
  "createdAt": "2024-03-05T10:00:00Z",
  "updatedAt": "2024-03-05T10:00:00Z"
}
```

---

### 📌 PUT /users/:id
Actualizar usuario existente.

**Permisos:** Admin (cualquier usuario), Manager (solo CASHIER)

**Request Body:**
```json
{
  "firstName": "Pedro Actualizado",
  "lastName": "López",
  "password": "NuevaPass123!",
  "role": "MANAGER"
}
```

**Notas:**
- Todos los campos son opcionales
- Si se incluye password, se hasheará automáticamente
- Manager no puede cambiar rol a ADMIN/MANAGER

---

### 📌 DELETE /users/:id
Eliminar usuario.

**Permisos:** Admin (cualquier usuario), Manager (solo CASHIER)

**Validaciones:**
- No se puede eliminar a sí mismo
- No se puede eliminar el último admin
- Manager solo puede eliminar cajeros

**Response:** 204 No Content

---

### 📌 PATCH /users/:id/toggle-active
Activar o desactivar usuario.

**Permisos:** Admin, Manager

**Validaciones:**
- No se puede desactivar a sí mismo
- No se puede desactivar el último admin activo
- Manager solo puede modificar cajeros

**Response:**
```json
{
  "id": "uuid",
  "firstName": "Pedro",
  "lastName": "López",
  "email": "pedro@example.com",
  "role": "CASHIER",
  "isActive": false,
  "createdAt": "2024-03-05T10:00:00Z",
  "updatedAt": "2024-03-05T15:00:00Z"
}
```

---

### 📌 PATCH /users/me/change-password
Cambiar contraseña propia.

**Permisos:** Todos

**Request Body:**
```json
{
  "currentPassword": "MiPasswordActual123!",
  "newPassword": "MiNuevoPassword456!"
}
```

**Validaciones:**
- currentPassword: debe ser correcta
- newPassword: mínimo 8 caracteres
- newPassword: debe ser diferente a currentPassword

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

---

## Guía de Usuario

### Para Administradores

#### Crear un Nuevo Usuario

1. Ir a **Configuración** (F6)
2. Seleccionar pestaña **Usuarios**
3. Click en **"Nuevo Usuario"**
4. Completar formulario:
   - Nombre y Apellido
   - Email (único en el sistema)
   - Contraseña (mínimo 8 caracteres)
   - Seleccionar rol
5. Click en **"Crear Usuario"**

#### Editar un Usuario

1. En la tabla de usuarios, click en el icono ✏️ (Editar)
2. Modificar los campos necesarios
3. Click en **"Actualizar"**

**Nota:** Dejar contraseña vacía si no deseas cambiarla.

#### Desactivar un Usuario

1. Click en el icono 🔒 (Lock) del usuario
2. Confirmar la acción en el diálogo
3. El usuario no podrá iniciar sesión hasta ser reactivado

#### Eliminar un Usuario

1. Click en el icono 🗑️ (Trash) del usuario
2. Confirmar eliminación en el diálogo
3. **Advertencia:** Esta acción es irreversible

---

### Para Managers

#### Crear un Cajero

1. Ir a **Configuración** > **Usuarios**
2. Click en **"Nuevo Usuario"**
3. Completar datos del cajero
4. El rol se asignará automáticamente como CASHIER
5. Click en **"Crear Usuario"**

**Restricción:** Solo puedes crear usuarios con rol de Cajero.

---

### Para Todos los Usuarios

#### Cambiar Tu Contraseña

1. Ir a **Configuración** > **Mi Perfil**
2. Scroll hasta sección **"Seguridad"**
3. Click en **"Cambiar Contraseña"**
4. Completar:
   - Contraseña Actual
   - Nueva Contraseña (ver indicador de fortaleza)
   - Confirmar Nueva Contraseña
5. Click en **"Cambiar Contraseña"**

#### Indicador de Fortaleza de Contraseña

La barra muestra 5 niveles:

| Color | Nivel | Requisitos |
|-------|-------|------------|
| 🔴 Rojo | Muy débil | < 8 caracteres |
| 🟠 Naranja | Débil | 8+ caracteres |
| 🟡 Amarillo | Aceptable | + mayús/minús |
| 🟢 Verde | Fuerte | + números |
| 🟢 Verde oscuro | Muy fuerte | + símbolos |

**Recomendación:** Usar contraseñas de nivel "Fuerte" o superior.

---

## Características de Seguridad

### Hash de Contraseñas
- Algoritmo: **bcrypt**
- Salt rounds: **12** (configurable)
- Las contraseñas nunca se almacenan en texto plano

### Validaciones Backend
- Email único en el sistema
- Contraseña mínimo 8 caracteres
- Validación de contraseña actual antes de cambiar
- Protección contra eliminación del último admin

### Validaciones Frontend
- Fortaleza de contraseña en tiempo real
- Confirmación de contraseña
- Prevención de errores con confirmaciones
- Debounce en búsqueda (evita sobrecarga)

### Rate Limiting
- Protección contra ataques de fuerza bruta
- Límite configurable por endpoint
- Headers informativos de límite

---

## Auditoría

Todas las acciones críticas quedan registradas en logs de auditoría:

### Acciones Auditadas

- ✅ USER_CREATED - Creación de usuario
- ✅ USER_UPDATED - Actualización de datos
- ✅ USER_DELETED - Eliminación de usuario
- ✅ USER_ACTIVATED - Activación de cuenta
- ✅ USER_DEACTIVATED - Desactivación de cuenta
- ✅ PASSWORD_CHANGED - Cambio de contraseña
- ✅ LOGIN_SUCCESS - Login exitoso
- ✅ LOGIN_FAILED - Intento de login fallido

### Información Registrada

Cada log incluye:
- Acción realizada
- Usuario afectado
- Usuario que realizó la acción
- Metadatos adicionales (email, rol, etc.)
- IP address
- User Agent
- Timestamp

### Consultar Logs de Auditoría

**Como Administrador:**

```bash
# Ver logs de un usuario específico
GET /api/users/audit/:userId

# Ver logs recientes del sistema
GET /api/users/audit/recent?limit=100

# Ver logs por tipo de acción
GET /api/users/audit/action/PASSWORD_CHANGED
```

---

## FAQ

### ¿Puedo recuperar un usuario eliminado?
❌ No. La eliminación es permanente. Se recomienda **desactivar** en lugar de eliminar.

### ¿Qué pasa si olvido mi contraseña?
Contacta a un administrador para que restablezca tu contraseña.

### ¿Puedo cambiar mi rol?
❌ No. Solo un administrador puede cambiar roles de usuario.

### ¿Cuántos administradores puede haber?
✅ Ilimitados. Pero siempre debe haber al menos uno activo.

### ¿Los cajeros pueden ver reportes?
⚠️ Parcialmente. Solo ven sus propias ventas, no reportes globales.

### ¿Se pueden recuperar contraseñas?
❌ No. Las contraseñas están hasheadas y no se pueden descifrar. Solo se pueden restablecer.

### ¿Qué pasa con las ventas de un usuario eliminado?
✅ Las ventas se mantienen, pero quedan sin usuario asociado.

### ¿Puedo desactivar temporalmente un usuario?
✅ Sí. Usa el toggle de activación/desactivación.

### ¿Se notifica al usuario cuando se le crea una cuenta?
❌ No automáticamente. El administrador debe comunicar las credenciales.

---

## Soporte

Para reportar bugs o solicitar funcionalidades:
- GitHub: [NexoPOS Issues](https://github.com/just1n5/Nexopos/issues)
- Email: soporte@nexopos.com

---

**Última actualización:** 2025-01-07
**Versión del módulo:** 1.0.0
**Autor:** NexoPOS Team
