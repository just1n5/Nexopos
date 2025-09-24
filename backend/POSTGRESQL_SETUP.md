# 📋 GUÍA RÁPIDA: Configuración PostgreSQL para NexoPOS

## 🚀 INICIO RÁPIDO (5 minutos)

### **Opción 1: Si NO tienes PostgreSQL instalado**

#### 1️⃣ **Instalar PostgreSQL**
```bash
# Descargar desde:
https://www.postgresql.org/download/windows/

# Durante instalación:
- Password: postgres123 (anótala!)
- Puerto: 5432
- [✓] PostgreSQL Server
- [✓] pgAdmin 4
- [✓] Command Line Tools
```

#### 2️⃣ **Crear Base de Datos (usando pgAdmin)**
1. Abrir **pgAdmin 4** desde el menú de Windows
2. Expandir: Servers → PostgreSQL 15 → Databases
3. Click derecho en "Databases" → Create → Database
4. Nombre: `nexopos`
5. Click "Save"

#### 3️⃣ **Configurar NexoPOS**
```bash
# En la carpeta backend, editar .env:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexopos
DB_USER=postgres
DB_PASSWORD=postgres123  # La que pusiste en instalación
```

---

### **Opción 2: Si YA tienes PostgreSQL**

#### 1️⃣ **Crear la Base de Datos (Terminal)**
```bash
# Abrir PowerShell o CMD como Administrador
psql -U postgres

# Ingresar contraseña y ejecutar:
CREATE DATABASE nexopos;
\q
```

#### 2️⃣ **Configurar .env**
```bash
# Usar tus credenciales existentes
DB_USER=postgres         # o tu usuario
DB_PASSWORD=tu_password  # tu contraseña actual
```

---

## ✅ **VERIFICAR CONFIGURACIÓN**

```bash
# En la carpeta backend:
cd backend

# Probar conexión:
node src/scripts/test-db.js

# Si ves "✅ ¡Conexión exitosa!" está todo listo
```

---

## 🔧 **SOLUCIÓN DE PROBLEMAS COMUNES**

### **Error: "password authentication failed"**
```bash
# La contraseña en .env no coincide
# Solución: Verificar la contraseña correcta
```

### **Error: "database nexopos does not exist"**
```sql
-- Crear la base de datos:
-- En pgAdmin o psql:
CREATE DATABASE nexopos;
```

### **Error: "connection refused" o "ECONNREFUSED"**
```bash
# PostgreSQL no está corriendo
# Solución en Windows:

# Opción 1: Desde Servicios
1. Presionar Win + R
2. Escribir: services.msc
3. Buscar: "postgresql-x64-15" (o tu versión)
4. Click derecho → Iniciar

# Opción 2: Desde CMD (como Admin)
net start postgresql-x64-15
```

### **Error: "role does not exist"**
```sql
-- Crear usuario en psql:
CREATE USER nexopos_user WITH PASSWORD 'nexopos123';
GRANT ALL PRIVILEGES ON DATABASE nexopos TO nexopos_user;
```

---

## 🎯 **CONFIGURACIÓN COMPLETA PASO A PASO**

### **Desde Cero con pgAdmin (Método Visual)**

1. **Abrir pgAdmin**
   - Usuario: postgres@localhost
   - Contraseña: (la que configuraste)

2. **Crear Usuario Dedicado**
   ```
   Login/Group Roles → Create → Login/Group Role
   - General:
     Name: nexopos_user
   - Definition:
     Password: nexopos123
   - Privileges:
     [✓] Can login
     [✓] Create databases
   ```

3. **Crear Base de Datos**
   ```
   Databases → Create → Database
   - General:
     Database: nexopos
     Owner: nexopos_user
   - Security:
     Grantee: nexopos_user
     Privileges: ALL
   ```

4. **Actualizar .env**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=nexopos
   DB_USER=nexopos_user
   DB_PASSWORD=nexopos123
   ```

---

## 📝 **COMANDOS ÚTILES**

### **Verificar si PostgreSQL está instalado**
```bash
# Windows PowerShell:
psql --version

# Si no reconoce el comando, agregar al PATH:
# C:\Program Files\PostgreSQL\15\bin
```

### **Conectar por línea de comandos**
```bash
# Conectar como superusuario
psql -U postgres -d nexopos

# Conectar con usuario específico
psql -U nexopos_user -d nexopos -h localhost
```

### **Comandos SQL básicos**
```sql
-- Ver todas las bases de datos
\l

-- Conectar a una base de datos
\c nexopos

-- Ver todas las tablas
\dt

-- Ver estructura de una tabla
\d nombre_tabla

-- Salir
\q
```

### **Backup y Restore**
```bash
# Backup
pg_dump -U postgres -d nexopos > backup.sql

# Restore
psql -U postgres -d nexopos < backup.sql
```

---

## ✨ **CONFIGURACIÓN ÓPTIMA PARA DESARROLLO**

### **.env para Desarrollo Local**
```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexopos_dev
DB_USER=postgres
DB_PASSWORD=tu_password_local
DB_SYNC=true           # Crear/actualizar tablas automáticamente
DB_LOGGING=true        # Ver queries SQL en consola

# JWT
JWT_SECRET=desarrollo-local-secret-key-12345
JWT_EXPIRES_IN=7d      # Tokens duran más en desarrollo

# DIAN
DIAN_ENABLED=false     # Sin validación DIAN en desarrollo
DIAN_ENVIRONMENT=test
```

### **pgAdmin: Query Tool útiles**
```sql
-- Ver tamaño de la base de datos
SELECT pg_database_size('nexopos')/1024/1024 as size_mb;

-- Ver todas las tablas con sus tamaños
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Contar registros en todas las tablas
SELECT
    schemaname,
    tablename,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## 🚦 **CHECKLIST FINAL**

Antes de ejecutar NexoPOS, verifica:

- [ ] PostgreSQL está instalado y corriendo
- [ ] Base de datos `nexopos` creada
- [ ] Usuario configurado con permisos
- [ ] Archivo `.env` configurado con credenciales correctas
- [ ] Prueba de conexión exitosa (`node src/scripts/test-db.js`)

Si todo está ✅, entonces:

```bash
# Instalar dependencias
npm install

# Iniciar el servidor
npm run start:dev

# En otra terminal, ejecutar seeds
npm run seed

# Abrir navegador
http://localhost:3000/api
```

---

## 📞 **¿NECESITAS AYUDA?**

Si tienes problemas:

1. **Ejecuta el test de conexión:**
   ```bash
   node src/scripts/test-db.js
   ```

2. **Revisa los logs de PostgreSQL:**
   ```
   C:\Program Files\PostgreSQL\15\data\log\
   ```

3. **Verifica el servicio:**
   ```bash
   # PowerShell como Admin
   Get-Service -Name "postgresql*"
   ```

---

¡Con esto deberías tener PostgreSQL configurado y funcionando! 🎉
