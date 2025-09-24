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

### Infraestructura (Planificada)
- **Contenedores:** Docker
- **Orquestación:** Kubernetes
- **Cloud:** AWS/Azure/GCP
- **CI/CD:** GitHub Actions

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Git

### Pasos de instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/nexopos.git
cd nexopos

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar en modo desarrollo
npm run dev
```

El servidor de desarrollo estará disponible en `http://localhost:5173`

### Scripts disponibles

```bash
npm run dev        # Inicia el servidor de desarrollo
npm run build      # Compila para producción
npm run preview    # Preview de la build de producción
npm run lint       # Ejecuta el linter
npm run test       # Ejecuta los tests
```

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
