# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto Overview

NexoPOS es un sistema de punto de venta (POS) SaaS diseñado específicamente para el mercado colombiano, con cumplimiento de facturación electrónica DIAN según la Resolución 00165 de 2023.

## Consideraciones de Codificación

**IMPORTANTE**: Este proyecto maneja contenido en español. Siempre usar:
- Codificación UTF-8 en todos los archivos
- Preservar caracteres especiales del español (tildes: á, é, í, ó, ú, ñ)
- No corromper acentos en strings, comentarios o mensajes de usuario

## Arquitectura del Proyecto

### Estructura General

Monorepo con dos aplicaciones principales:
- **backend/**: API REST con NestJS + TypeORM + PostgreSQL
- **frontend/**: SPA con React + TypeScript + Vite

### Backend (NestJS)

**Framework**: NestJS con TypeORM
**Base de datos**: PostgreSQL
**Autenticación**: JWT con Passport

#### Módulos Principales

El backend está organizado en módulos de dominio en `backend/src/modules/`:

- **auth**: Autenticación JWT
- **users**: Gestión de usuarios
- **products**: Catálogo de productos con variantes y precios
- **categories**: Categorización de productos
- **inventory**: Control de stock y movimientos de inventario
- **sales**: Procesamiento de ventas y transacciones
- **customers**: Gestión de clientes
- **credits**: Sistema de ventas a crédito (fiado)
- **cash-register**: Caja registradora y arqueos
- **taxes**: Impuestos (IVA colombiano)
- **reports**: Generación de reportes
- **integration**: Integración futura con DIAN
- **invoice-dian**: Facturación electrónica DIAN

#### Configuración de Base de Datos

- TypeORM con autoLoadEntities habilitado
- Sincronización automática controlada por `DB_SYNC` en .env
- Schemas: usar el schema configurado en `DB_SCHEMA` (default: 'public')

### Frontend (React + TypeScript)

**Framework**: React 18 con TypeScript
**Build Tool**: Vite
**UI**: Tailwind CSS + Radix UI (shadcn/ui)
**State Management**: Zustand
**Routing**: React Router v6
**Animaciones**: Framer Motion

#### Estructura de Carpetas

- **components/**: Componentes reutilizables de UI
- **views/**: Páginas/vistas principales del sistema
- **stores/**: Estado global con Zustand (authStore, posStore, inventoryStore, cashRegisterStore)
- **services/**: Servicios de API (comunicación con backend)
- **types/**: Definiciones de tipos TypeScript compartidos
- **lib/**: Utilidades y helpers

#### Vistas Principales

- **POSView**: Punto de venta (ruta `/`)
- **InventoryView**: Gestión de inventario
- **CreditView**: Control de ventas a crédito
- **CashRegisterView**: Caja y arqueos
- **DashboardView**: Reportes y analíticas
- **SettingsView**: Configuración del sistema
- **LoginView**: Autenticación

#### Navegación

El sistema usa atajos de teclado:
- F1: Punto de Venta
- F2: Inventario
- F3: Fiado
- F4: Caja
- F5: Reportes
- F6: Configuración

## Comandos de Desarrollo

### Instalación Inicial

```bash
# Instalar todas las dependencias (root, backend, frontend)
npm run install:all
```

### Desarrollo

```bash
# Iniciar backend y frontend simultáneamente
npm run dev

# Solo backend (modo watch)
npm run backend
# O directamente:
cd backend && npm run start:dev

# Solo frontend
npm run frontend
# O directamente:
cd frontend && npm run dev
```

### Backend

```bash
cd backend

# Desarrollo con hot-reload
npm run start:dev

# Debug mode
npm run start:debug

# Build para producción
npm run build

# Producción
npm run start:prod

# Linting
npm run lint

# Tests
npm run test
npm run test:watch
npm run test:cov

# Seed de datos
npm run seed

# Scripts de corrección
npm run fix:stock
```

### Frontend

```bash
cd frontend

# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Linting
npm run lint
```

### Migraciones de Base de Datos

```bash
cd backend

# Generar migración
npm run migration:generate

# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:revert
```

## Configuración de Entorno

### Backend

Crear archivo `backend/.env` basado en `backend/.env.example`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexopos
DB_USER=nexopos
DB_PASSWORD=changeme
DB_SCHEMA=public
DB_LOGGING=false
DB_SYNC=false  # IMPORTANTE: false en producción

# Auth
JWT_SECRET=super-secret-change-me
JWT_EXPIRES_IN=3600s
BCRYPT_SALT_ROUNDS=12
```

## URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api

## Características Específicas del Dominio

### Sistema de Productos

- Soporte para variantes de productos (tallas, colores, lotes)
- Precios con IVA incluido/excluido
- Productos vendidos por peso (frutas, verduras)
- Códigos de barras y SKUs

### Inventario

- Movimientos de inventario registrados en `inventory-movement` entity
- Stock calculado en tiempo real
- Soporte para múltiples bodegas (preparado para multi-sucursal)

### Ventas

- Múltiples métodos de pago (efectivo, tarjeta, Nequi, Daviplata, fiado)
- Generación de recibos
- Descuentos por producto y por venta total

### Crédito (Fiado)

- Sistema de límite de crédito por cliente
- Registro de abonos parciales
- Control de saldo pendiente

### Facturación DIAN

- Módulo preparado para integración con facturación electrónica
- Cumplimiento con normativa colombiana (Resolución 00165/2023)

## Patrones y Convenciones

### Backend

- DTOs para validación de entrada (class-validator)
- Response DTOs para serialización de salida
- Guards de autenticación con Passport JWT
- Global prefix `/api` para todas las rutas
- Swagger documentation habilitada

### Frontend

- Componentes funcionales con hooks
- Zustand para estado global
- React Router para navegación declarativa
- Lazy loading de vistas para optimización
- shadcn/ui para componentes de UI consistentes

## Estado Actual del Proyecto

El proyecto está en fase MVP con funcionalidades core implementadas:
- ✅ Punto de venta básico
- ✅ Gestión de inventario
- ✅ Control de fiado
- ✅ Cierre de caja
- ✅ Reportes básicos
- 🚧 Integración DIAN (en progreso)
- 🚧 Multi-sucursal (planificado)

## Despliegue en Producción (Dokku)

### Información del Servidor

- **Plataforma:** Dokku (PaaS auto-hospedado)
- **Servidor:** Laptop local en red LAN
- **IP:** 192.168.80.17
- **Aplicación:** nexopos
- **Dominio:** No configurado aún (acceso por IP)

### Git Remotes Configurados

```bash
dokku   ssh://dokku@192.168.80.17/nexopos (fetch/push)
dokku-frontend  dokku@nexopos.cloution-servidor.local:nexopos-frontend (fetch/push)
origin  https://github.com/just1n5/Nexopos.git (fetch/push)
```

### Flujo de Despliegue a Producción

1. **Desarrollo Local**
   - Desarrolla y prueba cambios localmente con `npm run dev`
   - Asegúrate de que todo funcione correctamente

2. **Commit de Cambios**
   ```bash
   git add .
   git commit -m "Descripción de los cambios"
   ```

3. **Despliegue a Dokku**
   ```bash
   git push dokku main
   ```

   Dokku automáticamente:
   - Detecta el proyecto Node.js (usando package.json)
   - Ejecuta `npm install` en root, backend y frontend
   - Construye el frontend (`npm run build` en frontend/)
   - Construye el backend (`npm run build` en backend/)
   - Reinicia la aplicación con la nueva versión

4. **Post-Despliegue: Ejecutar Migraciones**

   Si hiciste cambios en la base de datos, ejecuta las migraciones:
   ```bash
   dokku enter nexopos
   cd backend && npm run migration:run
   exit
   ```

5. **Verificación**
   ```bash
   # Ver logs en tiempo real
   dokku logs nexopos -t

   # Verificar estado de la app
   dokku ps:report nexopos
   ```

### Comandos Útiles de Dokku

#### Logs y Debugging
```bash
# Ver logs en tiempo real (tail)
dokku logs nexopos -t

# Ver últimas 100 líneas de logs
dokku logs nexopos --num 100

# Ver logs de un servicio específico
dokku logs nexopos --ps web
```

#### Gestión de la Aplicación
```bash
# Listar todas las apps
dokku apps:list

# Ver información de la app
dokku ps:report nexopos

# Reiniciar la aplicación
dokku ps:restart nexopos

# Detener la aplicación
dokku ps:stop nexopos

# Iniciar la aplicación
dokku ps:start nexopos

# Ver procesos en ejecución
dokku ps nexopos
```

#### Variables de Entorno
```bash
# Ver todas las variables de entorno
dokku config:show nexopos

# Configurar una variable
dokku config:set nexopos DB_HOST=localhost

# Configurar múltiples variables
dokku config:set nexopos \
  DB_HOST=localhost \
  DB_PORT=5432 \
  JWT_SECRET=nuevo-secret

# Eliminar una variable
dokku config:unset nexopos VARIABLE_NAME
```

#### Ejecución de Comandos
```bash
# Entrar al contenedor de la app
dokku enter nexopos

# Ejecutar un comando sin entrar
dokku run nexopos npm --version

# Ejecutar migraciones
dokku run nexopos bash -c "cd backend && npm run migration:run"
```

#### Base de Datos
```bash
# Si usas PostgreSQL con Dokku
dokku postgres:info nexopos-db
dokku postgres:logs nexopos-db -t
dokku postgres:connect nexopos-db
```

### URLs de Acceso

**Producción (Dokku):**
- **Frontend:** http://192.168.80.17 (puerto configurado por Dokku)
- **API:** http://192.168.80.17/api
- **Swagger:** http://192.168.80.17/api (si está habilitado)

**Desarrollo Local:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api

### Troubleshooting

#### La aplicación no inicia después del deploy
```bash
# Ver logs completos
dokku logs nexopos --num 500

# Verificar que las dependencias se instalaron
dokku run nexopos npm list

# Reconstruir la app desde cero
dokku ps:rebuild nexopos
```

#### Migraciones fallan
```bash
# Entrar al contenedor
dokku enter nexopos

# Verificar conexión a BD
cd backend
npm run typeorm schema:log

# Ejecutar migraciones manualmente
npm run migration:run
```

#### Variables de entorno no se aplican
```bash
# Ver variables actuales
dokku config:show nexopos

# Reiniciar después de cambiar config
dokku ps:restart nexopos
```

### Notas Importantes

- **No usar `DB_SYNC=true` en producción** - Siempre usar migraciones
- **JWT_SECRET** debe ser diferente entre desarrollo y producción
- **Backups de BD** - Configurar backups regulares de PostgreSQL
- **Logs** - Los logs de Dokku se rotan automáticamente
- **Recursos** - La laptop servidor debe tener recursos suficientes (RAM, CPU)

### Futuras Mejoras

- [ ] Configurar dominio personalizado (ej. nexopos.miempresa.com)
- [ ] Configurar SSL/HTTPS con Let's Encrypt
- [ ] Implementar CI/CD con GitHub Actions
- [ ] Configurar backups automáticos de base de datos
- [ ] Monitoreo con herramientas externas
- [ ] Configurar alertas de errores

## Notas de Git

Hay múltiples archivos de documentación temporal (*.md) sin seguimiento en el repositorio. Estos son notas de desarrollo y no deben ser commiteados a menos que sean solicitados explícitamente.
