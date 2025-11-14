# 📚 Índice de Documentación - NexoPOS

Este documento sirve como guía para navegar por toda la documentación del proyecto NexoPOS.

---

## 🚀 Inicio Rápido

Si eres nuevo en el proyecto, comienza aquí:

1. **[README.md](./README.md)** - Visión general del proyecto
2. **[CLAUDE.md](./CLAUDE.md)** - Guía completa para desarrolladores
3. **Backend:** `backend/.env.example` - Configuración de variables de entorno
4. **Frontend:** `frontend/.env.example` - Configuración del frontend

---

## 📖 Documentación Principal

### Para Desarrolladores

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| **[README.md](./README.md)** | Visión general, stack tecnológico, instalación | ✅ Actualizado |
| **[CLAUDE.md](./CLAUDE.md)** | Guía completa para Claude Code, arquitectura, comandos | ✅ Actualizado |
| **`backend/.env.example`** | Variables de entorno del backend | ✅ Actualizado |
| **`frontend/.env.example`** | Variables de entorno del frontend | ✅ Actualizado |

### Migración a Supabase

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| **[MIGRACION_COMPLETADA.md](./MIGRACION_COMPLETADA.md)** | Resumen completo de la migración exitosa | ✅ Completado |
| **[SUPABASE_CREDENTIALS.md](./SUPABASE_CREDENTIALS.md)** | Credenciales, endpoints, connection strings | ✅ Actualizado |
| **[CONECTIVIDAD_SUPABASE.md](./CONECTIVIDAD_SUPABASE.md)** | Diagnóstico de conectividad, troubleshooting | ✅ Actualizado |

### Archivos Técnicos

| Archivo | Descripción |
|---------|-------------|
| **`sql_*.sql`** | Archivos SQL organizados de la migración |
| **`test-connection.js`** | Script para probar conectividad a Supabase |
| **`nexopos_backup.sql`** | Backup completo de la BD antes de migración |

---

## 🗂️ Estructura de Documentos por Tema

### 📦 Base de Datos

**Primero lee:**
1. [MIGRACION_COMPLETADA.md](./MIGRACION_COMPLETADA.md) - Para entender el estado actual
2. [SUPABASE_CREDENTIALS.md](./SUPABASE_CREDENTIALS.md) - Para obtener credenciales
3. [CONECTIVIDAD_SUPABASE.md](./CONECTIVIDAD_SUPABASE.md) - Si tienes problemas de conexión

**Archivos relacionados:**
- `sql_01_extension.sql` - Extensión uuid-ossp
- `sql_02_enums.sql` - 27 tipos ENUM
- `sql_03_tables.sql` - 25 tablas
- `sql_06_primary_keys.sql` - Primary keys
- `sql_07_foreign_keys.sql` - Foreign keys
- `sql_08_indexes.sql` - Índices

### 🏗️ Arquitectura y Desarrollo

**Primero lee:**
1. [README.md](./README.md) - Stack tecnológico
2. [CLAUDE.md](./CLAUDE.md) - Arquitectura detallada, módulos, patrones

**Secciones importantes en CLAUDE.md:**
- Arquitectura del Proyecto
- Módulos Principales
- Comandos de Desarrollo
- Patrones y Convenciones
- Despliegue en Producción

### 🚀 Despliegue

**Para deployment a producción:**
1. [CLAUDE.md - Sección Despliegue](./CLAUDE.md#despliegue-en-producción-dokku)
2. [MIGRACION_COMPLETADA.md - Sección Próximos Pasos](./MIGRACION_COMPLETADA.md#próximos-pasos-sugeridos)

**Variables de entorno en Dokku:**
```bash
ssh dokku@192.168.80.17 config:show nexopos
```

---

## 🎯 Escenarios Comunes

### "Quiero configurar el proyecto por primera vez"

1. Lee [README.md](./README.md) - Instalación
2. Copia `backend/.env.example` a `backend/.env`
3. Copia `frontend/.env.example` a `frontend/.env`
4. Lee [SUPABASE_CREDENTIALS.md](./SUPABASE_CREDENTIALS.md) para obtener credenciales
5. Ejecuta `npm run install:all`
6. Ejecuta `npm run dev`

### "Tengo problemas conectándome a Supabase"

1. Lee [CONECTIVIDAD_SUPABASE.md](./CONECTIVIDAD_SUPABASE.md)
2. Verifica tus credenciales en [SUPABASE_CREDENTIALS.md](./SUPABASE_CREDENTIALS.md)
3. Ejecuta `node test-connection.js` para diagnóstico
4. Si persiste, revisa la sección "Troubleshooting" en CONECTIVIDAD_SUPABASE.md

### "Quiero entender cómo funciona el sistema"

1. Lee [README.md](./README.md) - Características principales
2. Lee [CLAUDE.md](./CLAUDE.md) - Arquitectura completa
3. Revisa el código en:
   - `backend/src/modules/` - Módulos de negocio
   - `frontend/src/views/` - Vistas principales
   - `frontend/src/stores/` - Estado global

### "Quiero desplegar a producción"

1. Lee [CLAUDE.md - Despliegue](./CLAUDE.md#despliegue-en-producción-dokku)
2. Configura variables en Dokku (ver SUPABASE_CREDENTIALS.md)
3. Ejecuta `git push dokku main`
4. Verifica logs: `ssh dokku@192.168.80.17 logs nexopos -t`

### "Quiero hacer cambios en la base de datos"

**NO uses DB_SYNC en producción. Usa migraciones:**

```bash
cd backend

# Generar migración
npm run migration:generate

# Ejecutar migraciones
npm run migration:run

# Revertir si es necesario
npm run migration:revert
```

### "Quiero importar datos a Supabase"

Lee [MIGRACION_COMPLETADA.md - Próximos Pasos](./MIGRACION_COMPLETADA.md#próximos-pasos-sugeridos) para las 3 opciones disponibles.

---

## 📊 Estado Actual del Proyecto

**Última actualización:** 2025-11-10

| Componente | Estado | Notas |
|------------|--------|-------|
| **Frontend** | ✅ Funcionando | React 18 + Vite |
| **Backend** | ✅ Funcionando | NestJS en Dokku |
| **Base de Datos** | ✅ Producción | Supabase PostgreSQL 17.6.1 |
| **Schema BD** | ✅ 100% Migrado | 27 ENUMs, 25 tablas, 42 FKs |
| **Datos** | ⏳ Pendiente | Decisión de importar o comenzar limpio |
| **Autenticación** | ✅ Funcionando | JWT + Passport |
| **DIAN** | 🚧 En progreso | Módulo preparado |

---

## 🔗 Enlaces Útiles

### Producción
- **App:** https://nexopos.cloution.cloud
- **Supabase Dashboard:** https://supabase.com/dashboard/project/vohlomomrskxnuksodmt
- **Servidor Dokku:** `ssh dokku@192.168.80.17`

### Desarrollo
- **Frontend Local:** http://localhost:5173
- **Backend Local:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api

### Externos
- **Supabase Docs:** https://supabase.com/docs
- **NestJS Docs:** https://docs.nestjs.com
- **React Docs:** https://react.dev

---

## 📝 Mantenimiento de Documentación

### Cuando agregar/actualizar docs:

- **Nuevas features:** Actualiza README.md y CLAUDE.md
- **Cambios de BD:** Crea migración + actualiza docs relacionadas
- **Cambios de deploy:** Actualiza CLAUDE.md sección Despliegue
- **Nuevas variables de entorno:** Actualiza .env.example correspondiente
- **Problemas resueltos:** Documenta en CONECTIVIDAD_SUPABASE.md o crea nuevo archivo

### Estructura de nuevos docs:

```markdown
# Título Descriptivo

**Fecha:** YYYY-MM-DD
**Autor:** Nombre
**Estado:** Borrador/Completo/Obsoleto

## Descripción

[Breve descripción del propósito del documento]

## Contenido

[Contenido principal]

---

**Última actualización:** YYYY-MM-DD
```

---

## 🤝 Contribuir a la Documentación

Si encuentras información desactualizada o faltante:

1. Revisa este índice para encontrar el documento correcto
2. Actualiza el documento relevante
3. Actualiza la fecha de "Última actualización"
4. Si creas un nuevo documento, agrégalo a este índice

---

**Última actualización:** 2025-11-10
**Mantenido por:** Equipo NexoPOS
