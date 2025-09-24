# NexoPOS Backend - Módulos del MVP

## 📊 Estado de Implementación de Módulos

### ✅ Módulos Completados para MVP (Fase 1)

#### 1. **Sales Module** (Ventas/POS) 🛒
- **Ubicación**: `/src/modules/sales`
- **Funcionalidades**:
  - Sistema completo de punto de venta
  - Gestión de items de venta
  - Múltiples métodos de pago (Efectivo, Tarjeta, Nequi, Daviplata, Crédito/Fiado)
  - Cálculo automático de cambio
  - Descuentos por producto y venta total
  - Ventas rápidas (Quick Sale)
  - Cancelación de ventas
  - Reportes diarios

#### 2. **Invoice DIAN Module** (Facturación Electrónica) 📄
- **Ubicación**: `/src/modules/invoice-dian`
- **Funcionalidades**:
  - Generación de documentos POS electrónicos
  - Cumplimiento con Resolución 00165 de 2023
  - Gestión de resoluciones DIAN
  - Generación de CUFE/CUDE
  - Códigos QR para validación
  - XML firmado digitalmente
  - Control de numeración consecutiva

#### 3. **Cash Register Module** (Caja) 💰
- **Ubicación**: `/src/modules/cash-register`
- **Funcionalidades**:
  - Apertura y cierre de caja
  - Arqueo de caja con conteo por denominación
  - Movimientos de efectivo (entradas/salidas)
  - Registro de gastos
  - Cash drops (depósitos a caja fuerte)
  - Conciliación de efectivo esperado vs real
  - Alertas de discrepancias

#### 4. **Inventory Module** (Inventario) 📦
- **Ubicación**: `/src/modules/inventory`
- **Funcionalidades**:
  - Control de stock en tiempo real
  - Movimientos de inventario (kardex)
  - Alertas de stock bajo
  - Control de lotes y fechas de vencimiento
  - Valoración de inventario
  - Ajustes y conteo físico
  - Productos próximos a vencer

#### 5. **Products Module** (Productos) 📝
- **Ubicación**: `/src/modules/products`
- **Funcionalidades**:
  - Gestión de productos
  - Variantes (talla, color, etc.)
  - SKU y códigos de barras
  - Precios y costos

#### 6. **Categories Module** (Categorías) 🏷️
- **Ubicación**: `/src/modules/categories`
- **Funcionalidades**:
  - Organización jerárquica de productos
  - Categorías y subcategorías

#### 7. **Customers Module** (Clientes) 👥
- **Ubicación**: `/src/modules/customers`
- **Funcionalidades**:
  - Gestión de clientes
  - Sistema de "fiado" (cuentas por cobrar)
  - Historial de compras

#### 8. **Taxes Module** (Impuestos) 💸
- **Ubicación**: `/src/modules/taxes`
- **Funcionalidades**:
  - Configuración de IVA y otros impuestos
  - Cálculo automático en ventas

#### 9. **Auth Module** (Autenticación) 🔐
- **Ubicación**: `/src/modules/auth`
- **Funcionalidades**:
  - JWT authentication
  - Login/Logout
  - Protección de rutas

#### 10. **Users Module** (Usuarios) 👤
- **Ubicación**: `/src/modules/users`
- **Funcionalidades**:
  - Gestión de usuarios
  - Roles y permisos básicos

## 🚀 Instrucciones de Instalación

```bash
# Instalar dependencias
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones de base de datos

# Ejecutar migraciones (si están configuradas)
npm run migration:run

# Iniciar en modo desarrollo
npm run start:dev

# Iniciar en modo producción
npm run build
npm run start:prod
```

## 📋 Endpoints Principales

### Sales (Ventas)
- `POST /sales` - Crear venta
- `POST /sales/quick` - Venta rápida
- `POST /sales/calculate` - Calcular totales
- `GET /sales` - Listar ventas
- `GET /sales/:id` - Obtener venta
- `DELETE /sales/:id/cancel` - Cancelar venta
- `GET /sales/daily-summary` - Resumen diario

### Invoice DIAN (Facturación)
- `POST /invoice-dian` - Generar factura
- `GET /invoice-dian` - Listar facturas
- `GET /invoice-dian/resolutions` - Ver resoluciones
- `POST /invoice-dian/resolutions` - Crear resolución
- `DELETE /invoice-dian/:id/cancel` - Cancelar factura

### Cash Register (Caja)
- `POST /cash-register/open` - Abrir caja
- `POST /cash-register/:sessionId/close` - Cerrar caja
- `GET /cash-register/status` - Estado actual
- `POST /cash-register/:sessionId/movements` - Agregar movimiento
- `POST /cash-register/:sessionId/expense` - Registrar gasto
- `GET /cash-register/daily-summary` - Resumen diario

### Inventory (Inventario)
- `GET /inventory/stock/:productId` - Ver stock de producto
- `GET /inventory/low-stock` - Productos con stock bajo
- `GET /inventory/expiring` - Productos por vencer
- `GET /inventory/movements` - Historial de movimientos
- `GET /inventory/valuation` - Valoración de inventario

## 🔗 Integraciones entre Módulos

1. **Sales → Inventory**: Las ventas actualizan automáticamente el inventario
2. **Sales → Invoice DIAN**: Las ventas pueden generar facturas electrónicas
3. **Sales → Cash Register**: Las ventas se registran en la caja abierta
4. **Products → Inventory**: Los productos están vinculados con su stock
5. **Products → Categories**: Los productos pertenecen a categorías
6. **Sales → Customers**: Las ventas pueden asignarse a clientes (fiado)

## 📈 Próximas Mejoras (Fase 2)

- [ ] Gestión Multi-sucursal
- [ ] Integración con E-commerce (Shopify, Tiendanube)
- [ ] CRM y programas de fidelización
- [ ] Reportes y analíticas avanzadas
- [ ] Gestión avanzada de usuarios y roles

## 🔧 Configuración de Base de Datos

El sistema usa PostgreSQL con las siguientes tablas principales:

- `sales` - Ventas
- `sale_items` - Items de venta
- `payments` - Pagos
- `invoices_dian` - Facturas electrónicas
- `dian_resolutions` - Resoluciones DIAN
- `cash_register_sessions` - Sesiones de caja
- `cash_movements` - Movimientos de efectivo
- `cash_counts` - Conteos de efectivo
- `inventory_stock` - Stock actual
- `inventory_movements` - Movimientos de inventario
- `products` - Productos
- `product_variants` - Variantes de productos
- `categories` - Categorías
- `customers` - Clientes
- `taxes` - Impuestos
- `users` - Usuarios

## 🛡️ Seguridad

- Autenticación JWT en todos los endpoints
- Validación de datos con class-validator
- Transacciones de base de datos para operaciones críticas
- Logs de auditoría para operaciones sensibles

## 📚 Documentación API

La documentación completa de la API está disponible en Swagger:
```
http://localhost:3000/api
```

## 🤝 Contribuir

Para agregar nuevas funcionalidades:

1. Crear un nuevo módulo en `/src/modules/`
2. Definir entidades en `/entities/`
3. Crear DTOs en `/dto/`
4. Implementar servicio y controlador
5. Registrar el módulo en `app.module.ts`
6. Agregar pruebas unitarias

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación, revisar la documentación en los archivos del proyecto o contactar al equipo de desarrollo.

---

**NexoPOS** - Sistema POS integral para el mercado colombiano 🇨🇴
