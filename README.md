# 🚀 NexoPOS - Sistema de Punto de Venta para Colombia

<div align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB.svg" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.0.0-3178C6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Status-MVP-green.svg" alt="Status">
</div>

## 📋 Descripción

NexoPOS es una plataforma de software como servicio (SaaS) de nueva generación, diseñada específicamente para el mercado colombiano. Nuestra misión es empoderar a los comerciantes colombianos, desde el tendero de barrio hasta las grandes cadenas de retail, con una herramienta intuitiva, poderosa y que garantiza el cumplimiento normativo con la DIAN.

### 🎯 Características Principales

- **✅ Facturación Electrónica DIAN** - Cumplimiento total con la Resolución 00165 de 2023
- **📱 Multiplataforma** - Funciona en móvil, tablet y desktop
- **🔄 Sincronización en tiempo real** - Datos siempre actualizados
- **📊 Análisis y reportes** - Toma decisiones basadas en datos
- **💳 Múltiples métodos de pago** - Efectivo, tarjeta, Nequi, Daviplata, fiado
- **📦 Control de inventario** - Gestión completa con alertas de stock bajo
- **👥 Gestión de clientes** - CRM integrado con control de crédito
- **🏪 Multi-sucursal** - Gestiona múltiples puntos de venta

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React 18 con TypeScript
- **UI Components:** Tailwind CSS + Radix UI (shadcn/ui)
- **Animaciones:** Framer Motion
- **State Management:** Zustand
- **Routing:** React Router v6
- **Build Tool:** Vite

### Backend (Planificado)
- **Runtime:** Node.js
- **Framework:** NestJS
- **Base de datos:** PostgreSQL
- **ORM:** Prisma
- **Autenticación:** JWT + OAuth 2.0
- **API:** RESTful + GraphQL

### Infraestructura
- **Despliegue:** Dokku (PaaS auto-hospedado)
- **Servidor:** Laptop local (192.168.80.17)
- **CI/CD:** Git push deployment

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Git

### Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/just1n5/Nexopos.git
cd Nexoposdesarrollo

# Instalar todas las dependencias (root, backend, frontend)
npm run install:all

# Configurar variables de entorno
# Backend
cd backend && cp .env.example .env
# Editar backend/.env con tus credenciales de BD

# Iniciar en modo desarrollo (backend + frontend)
npm run dev
```

El servidor de desarrollo estará disponible en:
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000/api`
- **Swagger Docs:** `http://localhost:3000/api`

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia backend + frontend simultáneamente
npm run backend          # Solo backend (modo watch)
npm run frontend         # Solo frontend
npm run install:all      # Instala dependencias de todo el monorepo

# Backend
cd backend
npm run start:dev        # Desarrollo con hot-reload
npm run start:debug      # Debug mode
npm run build            # Compila para producción
npm run start:prod       # Producción
npm run migration:run    # Ejecutar migraciones
npm run migration:generate  # Generar nueva migración
npm run seed             # Seed de datos

# Frontend
cd frontend
npm run dev              # Desarrollo
npm run build            # Compila para producción
npm run preview          # Preview de build
npm run lint             # Ejecuta el linter
```

## 🚀 Despliegue en Producción (Dokku)

### Configuración Inicial del Remote

El proyecto ya tiene configurados los remotes de Dokku:

```bash
# Ver remotes configurados
git remote -v

# Deberías ver:
# dokku   ssh://dokku@192.168.80.17/nexopos (fetch)
# dokku   ssh://dokku@192.168.80.17/nexopos (push)
```

### Flujo de Despliegue

```bash
# 1. Asegúrate de tener todos los cambios commiteados
git add .
git commit -m "Tu mensaje de commit"

# 2. Despliega a producción
git push dokku main

# 3. Dokku automáticamente:
#    - Detecta que es una aplicación Node.js
#    - Instala dependencias (npm install)
#    - Construye backend y frontend
#    - Reinicia la aplicación

# 4. (Opcional) Ejecutar migraciones post-despliegue
dokku enter nexopos
cd backend && npm run migration:run
exit
```

### Comandos Útiles de Dokku

```bash
# Ver logs en tiempo real
dokku logs nexopos -t

# Ver estado de la aplicación
dokku ps:report nexopos

# Reiniciar la aplicación
dokku ps:restart nexopos

# Configurar variables de entorno
dokku config:set nexopos DB_HOST=... DB_PASSWORD=...

# Ver variables de entorno configuradas
dokku config:show nexopos

# Entrar al contenedor (para ejecutar comandos)
dokku enter nexopos

# Ver todas las aplicaciones
dokku apps:list
```

### Verificación Post-Despliegue

```bash
# 1. Verificar logs para errores
dokku logs nexopos -t

# 2. Acceder a la aplicación
# http://192.168.80.17 (o el puerto configurado)

# 3. Verificar que el backend responde
# curl http://192.168.80.17/api/health
```

### Acceso a la Aplicación en Producción

- **URL Base:** `http://192.168.80.17` (red local)
- **API:** `http://192.168.80.17/api`
- **Nota:** Aún no hay dominio configurado. La aplicación corre en la laptop servidor (192.168.80.17)

## 📱 Funcionalidades por Módulo

### 1. Punto de Venta (POS)
- Interfaz intuitiva con teclas rápidas
- Búsqueda rápida de productos
- Escáner de código de barras (cámara/lector USB)
- Aplicación de descuentos
- Múltiples métodos de pago
- Generación automática de recibos

### 2. Gestión de Inventario
- Control de stock en tiempo real
- Gestión por atributos (talla, color, lote)
- Alertas de stock bajo
- Kardex de productos
- Carga masiva desde Excel
- Gestión de múltiples bodegas

### 3. Control de Fiado (Crédito)
- Registro de ventas a crédito
- Control de límites por cliente
- Registro de abonos parciales
- Recordatorios por WhatsApp
- Historial de pagos
- Reportes de cartera

### 4. Cierre de Caja
- Arqueo de caja automático
- Registro de gastos
- Cálculo de ganancias diarias
- Generación de reportes para contador
- Historial de cierres

### 5. Reportes y Analíticas
- Dashboard con KPIs principales
- Productos más vendidos
- Análisis por método de pago
- Ventas por hora/día/mes
- Comparativas de períodos
- Exportación a Excel/PDF

### 6. Gestión de Clientes
- Base de datos de clientes
- Control de crédito
- Historial de compras
- Programa de fidelización
- Segmentación de clientes

## 🎯 Roadmap del Producto

### Fase 1: MVP (Actual) ✅
- [x] Punto de venta básico
- [x] Gestión de inventario
- [x] Control de fiado
- [x] Cierre de caja
- [x] Reportes básicos
- [x] Gestión de clientes

### Fase 2: Escalado PYMES 🚧
- [ ] Multi-sucursal
- [ ] Integración e-commerce
- [ ] Programa de puntos
- [ ] Reportes avanzados
- [ ] App móvil nativa
- [ ] Gestión de empleados

### Fase 3: Enterprise 📋
- [ ] SSO (Single Sign-On)
- [ ] API pública
- [ ] Integración con ERPs
- [ ] Auditoría avanzada
- [ ] Personalización white-label
- [ ] SLA 99.99%

## 🤝 Contribuir

¡Contribuciones son bienvenidas! Por favor, lee nuestra [guía de contribución](CONTRIBUTING.md) para más detalles.

### Cómo contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- 📧 Email: soporte@nexopos.co
- 💬 WhatsApp: +57 300 123 4567
- 📖 Documentación: [docs.nexopos.co](https://docs.nexopos.co)
- 🐛 Reportar bugs: [GitHub Issues](https://github.com/tu-usuario/nexopos/issues)

## 👥 Equipo

Desarrollado con ❤️ por el equipo de NexoPOS

- **Product Manager:** [Nombre]
- **Tech Lead:** [Nombre]
- **Frontend Developer:** [Nombre]
- **Backend Developer:** [Nombre]
- **UI/UX Designer:** [Nombre]

## 🏆 Reconocimientos

- Gracias a todos los comerciantes que confían en NexoPOS
- A la comunidad open source por las herramientas increíbles
- A nuestros beta testers por su invaluable feedback

---

<div align="center">
  <p>Hecho con ❤️ en Colombia 🇨🇴</p>
  <p>© 2024 NexoPOS. Todos los derechos reservados.</p>
</div>
