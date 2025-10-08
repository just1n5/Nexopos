# 📋 Checklist de QA - NexoPOS

## Información de Testing

**Ambiente**: Production (Render)
- Frontend: https://nexopos-1.onrender.com
- Backend: https://nexopos-aaj2.onrender.com/api

**Usuarios de Prueba**:
- Admin: admin@nexopos.co / Admin123!
- Cajero: cajero@nexopos.co / Cajero123!
- Demo: demo@nexopos.co / Demo123!

**Datos de Prueba**: 8 productos, 4 clientes, 8 categorías, 4 impuestos

---

## 🔐 1. Autenticación y Seguridad

### Login
- [ ] Login exitoso con credenciales de Admin
- [ ] Login exitoso con credenciales de Cajero
- [ ] Login exitoso con credenciales de Demo
- [ ] Login falla con email incorrecto
- [ ] Login falla con password incorrecto
- [ ] Mensaje de error claro cuando falla
- [ ] Redirige al dashboard después de login exitoso

### Sesión
- [ ] Token se guarda en localStorage
- [ ] Sesión persiste al recargar la página
- [ ] Logout limpia el token
- [ ] Logout redirige a login
- [ ] Usuario no autenticado es redirigido a login
- [ ] Nombre del usuario aparece en la UI

### Roles y Permisos
- [ ] Admin puede acceder a todas las vistas
- [ ] Cajero tiene acceso limitado (según permisos)
- [ ] Demo tiene acceso limitado

---

## 🛒 2. Punto de Venta (POS)

### Navegación y Carga
- [ ] Vista POS carga correctamente (F1)
- [ ] Lista de productos se muestra
- [ ] Buscador de productos está visible
- [ ] Carrito de compra está visible
- [ ] Total se muestra en $0 inicialmente

### Búsqueda de Productos
- [ ] Buscar por nombre funciona (ej: "coca")
- [ ] Buscar por SKU funciona (ej: "BEB001")
- [ ] Resultados se filtran en tiempo real
- [ ] Búsqueda vacía muestra todos los productos
- [ ] No rompe con caracteres especiales (áéíóúñ)

### Agregar Productos al Carrito
- [ ] Click en producto lo agrega al carrito
- [ ] Cantidad por defecto es 1
- [ ] Total se actualiza correctamente
- [ ] Se puede agregar el mismo producto múltiples veces
- [ ] Cantidad se incrementa correctamente

### Modificar Carrito
- [ ] Se puede aumentar cantidad con botón +
- [ ] Se puede disminuir cantidad con botón -
- [ ] Al llegar a 0, el producto se elimina
- [ ] Se puede eliminar producto con botón de eliminar
- [ ] Total se recalcula correctamente
- [ ] Subtotal, IVA y total son correctos

### Métodos de Pago
- [ ] Seleccionar Efectivo funciona
- [ ] Seleccionar Tarjeta funciona
- [ ] Seleccionar Nequi funciona
- [ ] Seleccionar Daviplata funciona
- [ ] Seleccionar Fiado funciona
- [ ] Se puede ingresar monto pagado
- [ ] Calcula cambio correctamente (efectivo)
- [ ] Validación cuando pago es insuficiente

### Procesar Venta
- [ ] Botón "Procesar Venta" funciona
- [ ] Venta se registra en backend
- [ ] Se genera número de factura
- [ ] Carrito se limpia después de venta
- [ ] Mensaje de confirmación aparece
- [ ] Stock se descuenta correctamente

### Descuentos
- [ ] Descuento por producto funciona
- [ ] Descuento general funciona
- [ ] Descuento % calcula correctamente
- [ ] Descuento $ calcula correctamente
- [ ] Total se actualiza con descuento

### Cliente en Venta
- [ ] Se puede seleccionar cliente
- [ ] Buscar cliente funciona
- [ ] Cliente "Consumidor Final" por defecto
- [ ] Cliente seleccionado aparece en venta
- [ ] Datos del cliente correctos en recibo

### Recibo/Factura
- [ ] Se muestra vista de recibo después de venta
- [ ] Datos del negocio correctos
- [ ] Datos del cliente correctos
- [ ] Lista de productos correcta
- [ ] Totales correctos
- [ ] Número de factura correcto
- [ ] Fecha y hora correctas
- [ ] Botón imprimir funciona
- [ ] Botón "Nueva Venta" funciona

---

## 📦 3. Inventario

### Navegación
- [ ] Vista Inventario carga correctamente (F2)
- [ ] Lista de productos se muestra
- [ ] Paginación funciona (si hay muchos productos)
- [ ] Buscador funciona

### Ver Productos
- [ ] Tabla muestra: SKU, Nombre, Precio, Stock
- [ ] Stock actualizado se muestra correctamente
- [ ] Se puede ver detalle de producto
- [ ] Imágenes de producto se muestran (si existen)

### Crear Producto
- [ ] Modal/formulario de crear producto abre
- [ ] Validaciones funcionan (campos requeridos)
- [ ] Se puede seleccionar categoría
- [ ] Se puede seleccionar impuesto
- [ ] Precio se ingresa correctamente
- [ ] SKU se valida (único)
- [ ] Producto se crea exitosamente
- [ ] Aparece en lista después de crear

### Editar Producto
- [ ] Modal/formulario de editar abre
- [ ] Datos actuales se cargan
- [ ] Se pueden modificar campos
- [ ] Cambios se guardan
- [ ] Actualización se refleja en lista

### Ajuste de Stock
- [ ] Modal de ajuste de stock abre
- [ ] Se puede ingresar cantidad
- [ ] Se puede seleccionar tipo (entrada/salida)
- [ ] Se puede agregar nota/razón
- [ ] Stock se actualiza correctamente
- [ ] Movimiento se registra

### Movimientos de Inventario
- [ ] Historial de movimientos se muestra
- [ ] Muestra: fecha, tipo, cantidad, usuario
- [ ] Se pueden filtrar por fecha
- [ ] Se pueden filtrar por tipo
- [ ] Se pueden filtrar por producto

### Búsqueda y Filtros
- [ ] Buscar por nombre funciona
- [ ] Buscar por SKU funciona
- [ ] Filtrar por categoría funciona
- [ ] Filtrar por stock bajo funciona
- [ ] Filtrar por estado (activo/inactivo)

---

## 💳 4. Ventas a Crédito (Fiado)

### Navegación
- [ ] Vista Crédito carga correctamente (F3)
- [ ] Lista de créditos se muestra
- [ ] Resumen de créditos aparece

### Ver Créditos
- [ ] Tabla muestra: Cliente, Monto, Saldo, Estado
- [ ] Saldo se calcula correctamente
- [ ] Se puede ver detalle de crédito
- [ ] Historial de abonos se muestra

### Crear Venta a Crédito
- [ ] Se puede crear venta a crédito desde POS
- [ ] Se valida límite de crédito del cliente
- [ ] Crédito se registra correctamente
- [ ] Saldo inicial es correcto

### Registrar Abono
- [ ] Modal de abono abre
- [ ] Se puede ingresar monto
- [ ] Se puede seleccionar método de pago
- [ ] Se valida que abono no exceda saldo
- [ ] Abono se registra correctamente
- [ ] Saldo se actualiza
- [ ] Cuando saldo = 0, crédito se marca como pagado

### Búsqueda y Filtros
- [ ] Buscar por cliente funciona
- [ ] Filtrar por estado (pendiente/pagado) funciona
- [ ] Filtrar por rango de fechas funciona

### Validaciones
- [ ] No se puede vender a crédito si cliente no tiene crédito habilitado
- [ ] No se puede exceder límite de crédito
- [ ] Mensaje de error claro cuando límite excedido

---

## 💰 5. Caja Registradora

### Navegación
- [ ] Vista Caja carga correctamente (F4)
- [ ] Estado de caja se muestra (abierta/cerrada)
- [ ] Saldo actual se muestra

### Abrir Caja
- [ ] Modal de abrir caja aparece
- [ ] Se puede ingresar saldo inicial
- [ ] Caja se abre correctamente
- [ ] Saldo inicial se registra
- [ ] Timestamp de apertura correcto

### Movimientos de Caja
- [ ] Se pueden registrar ingresos
- [ ] Se pueden registrar egresos
- [ ] Se puede agregar concepto/nota
- [ ] Movimiento se registra
- [ ] Saldo se actualiza

### Cerrar Caja
- [ ] Modal de cierre aparece
- [ ] Muestra saldo esperado
- [ ] Se puede ingresar saldo real
- [ ] Calcula diferencia (sobrante/faltante)
- [ ] Se puede agregar nota de cierre
- [ ] Arqueo se registra correctamente
- [ ] Caja queda cerrada

### Historial de Arqueos
- [ ] Lista de arqueos anteriores se muestra
- [ ] Muestra: fecha, usuario, saldo inicial, final, diferencia
- [ ] Se puede ver detalle de arqueo
- [ ] Se puede imprimir arqueo
- [ ] Se puede filtrar por fecha
- [ ] Se puede filtrar por usuario

---

## 📊 6. Reportes

### Navegación
- [ ] Vista Reportes carga correctamente (F5)
- [ ] Dashboard con métricas aparece

### Dashboard/Métricas
- [ ] Total de ventas del día se muestra
- [ ] Total de ventas del mes se muestra
- [ ] Productos más vendidos se muestran
- [ ] Gráficas cargan correctamente
- [ ] Datos son correctos

### Reporte de Ventas
- [ ] Se puede seleccionar rango de fechas
- [ ] Tabla de ventas se muestra
- [ ] Totales correctos
- [ ] Se puede exportar (PDF/Excel)
- [ ] Filtro por usuario funciona
- [ ] Filtro por método de pago funciona

### Reporte de Inventario
- [ ] Stock actual se muestra
- [ ] Valor del inventario correcto
- [ ] Productos con stock bajo resaltados
- [ ] Se puede exportar

### Reporte de Créditos
- [ ] Créditos pendientes se muestran
- [ ] Total por cobrar correcto
- [ ] Créditos vencidos resaltados
- [ ] Se puede exportar

---

## ⚙️ 7. Configuración

### Navegación
- [ ] Vista Configuración carga correctamente (F6)
- [ ] Tabs/secciones se muestran

### Datos del Negocio
- [ ] Se pueden editar datos del negocio
- [ ] Nombre, NIT, dirección, etc.
- [ ] Cambios se guardan
- [ ] Se reflejan en recibos/facturas

### Usuarios
- [ ] Lista de usuarios se muestra
- [ ] Se puede crear usuario nuevo
- [ ] Se puede editar usuario
- [ ] Se puede desactivar usuario
- [ ] Roles se asignan correctamente
- [ ] Validaciones funcionan

### Categorías
- [ ] Lista de categorías se muestra
- [ ] Se puede crear categoría
- [ ] Se puede editar categoría
- [ ] Se puede eliminar categoría (si no tiene productos)

### Impuestos
- [ ] Lista de impuestos se muestra
- [ ] IVA 19%, 5%, Exento, INC aparecen
- [ ] Se puede crear impuesto
- [ ] Se puede editar impuesto
- [ ] Se puede activar/desactivar

### Clientes
- [ ] Lista de clientes se muestra
- [ ] Se puede crear cliente
- [ ] Se puede editar cliente
- [ ] Validación de documento funciona
- [ ] Configuración de crédito funciona
- [ ] Se puede buscar cliente

### Resolución DIAN
- [ ] Resolución actual se muestra
- [ ] Numeración actual correcta
- [ ] Rango disponible se muestra
- [ ] Alerta cuando quedan pocos números

---

## 🌐 8. UI/UX General

### Responsividad
- [ ] Se ve bien en desktop (1920x1080)
- [ ] Se ve bien en laptop (1366x768)
- [ ] Se ve bien en tablet (iPad)
- [ ] Se ve bien en móvil (iPhone)
- [ ] Menú hamburguesa funciona en móvil

### Navegación
- [ ] Atajos de teclado funcionan (F1-F6)
- [ ] Menú lateral funciona
- [ ] Navegación con breadcrumbs funciona
- [ ] Botón "Atrás" del navegador funciona

### Performance
- [ ] Primera carga < 3 segundos
- [ ] Navegación entre vistas es fluida
- [ ] No hay lags al escribir
- [ ] Búsquedas son rápidas
- [ ] Imágenes optimizadas

### Accesibilidad
- [ ] Contraste de colores adecuado
- [ ] Texto legible
- [ ] Botones tienen tamaño adecuado
- [ ] Inputs tienen labels
- [ ] Errores son claros y visibles

### Idioma
- [ ] Todo el texto está en español
- [ ] Tildes y ñ se muestran correctamente
- [ ] Formato de moneda colombiano ($)
- [ ] Formato de fecha colombiano (DD/MM/YYYY)

---

## 🐛 9. Manejo de Errores

### Conexión
- [ ] Mensaje claro cuando backend no responde
- [ ] Retry automático funciona
- [ ] No rompe la app cuando no hay conexión

### Validaciones
- [ ] Formularios validan campos requeridos
- [ ] Mensajes de error son claros
- [ ] Errores se muestran en el campo correcto
- [ ] Se puede corregir y reenviar

### Casos Límite
- [ ] Carrito con 0 productos no permite venta
- [ ] Stock negativo no es posible
- [ ] Precios en 0 no son posibles
- [ ] Cantidades negativas no son posibles
- [ ] Textos muy largos no rompen UI

---

## 🔄 10. Integración

### Ventas → Inventario
- [ ] Venta descuenta stock correctamente
- [ ] Movimiento de inventario se crea
- [ ] Si stock = 0, producto no se puede vender

### Ventas → Caja
- [ ] Venta se registra en caja abierta
- [ ] Monto se suma al saldo de caja
- [ ] Aparece en movimientos de caja

### Ventas → Crédito
- [ ] Venta a crédito crea registro de crédito
- [ ] Límite de crédito se valida
- [ ] Abono reduce saldo del crédito

### Caja → Reportes
- [ ] Arqueos aparecen en reportes
- [ ] Totales coinciden
- [ ] Fechas correctas

---

## 📱 11. PWA (Progressive Web App)

### Instalación
- [ ] Prompt de instalación aparece
- [ ] Se puede instalar en escritorio
- [ ] Se puede instalar en móvil
- [ ] Ícono aparece correctamente

### Offline (si aplica)
- [ ] Service Worker se registra
- [ ] Recursos se cachean
- [ ] App funciona offline (funcionalidad básica)

---

## 🚀 12. Deployment y DevOps

### Render
- [ ] Backend responde en https://nexopos-aaj2.onrender.com/api
- [ ] Frontend responde en https://nexopos-1.onrender.com
- [ ] SSL/HTTPS funciona
- [ ] No hay errores de CORS
- [ ] Variables de entorno correctas

### Database
- [ ] Conexión a PostgreSQL funciona
- [ ] Datos persisten después de restart
- [ ] Backup automático configurado (Render hace esto)

### Monitoreo
- [ ] Logs del backend accesibles
- [ ] Logs del frontend accesibles
- [ ] Errores se registran

---

## 🎯 Casos de Uso End-to-End

### Flujo Completo de Venta
1. [ ] Abrir caja con saldo inicial $100,000
2. [ ] Ir al POS
3. [ ] Buscar "Coca Cola"
4. [ ] Agregar 2 unidades al carrito
5. [ ] Agregar "Agua Cristal" 1 unidad
6. [ ] Verificar que total es correcto
7. [ ] Seleccionar método de pago: Efectivo
8. [ ] Ingresar $10,000
9. [ ] Procesar venta
10. [ ] Verificar recibo generado
11. [ ] Verificar que stock se descontó
12. [ ] Verificar que venta aparece en caja
13. [ ] Cerrar caja
14. [ ] Verificar que arqueo es correcto

### Flujo de Crédito
1. [ ] Ir a POS
2. [ ] Agregar productos
3. [ ] Seleccionar cliente "Juan Pérez"
4. [ ] Seleccionar método: Fiado
5. [ ] Procesar venta
6. [ ] Ir a vista de Créditos
7. [ ] Verificar que crédito aparece
8. [ ] Registrar abono parcial
9. [ ] Verificar saldo actualizado
10. [ ] Registrar abono final
11. [ ] Verificar crédito marcado como pagado

### Flujo de Inventario
1. [ ] Ir a Inventario
2. [ ] Crear producto nuevo
3. [ ] Asignar categoría e impuesto
4. [ ] Ingresar stock inicial
5. [ ] Ir al POS
6. [ ] Vender el producto nuevo
7. [ ] Verificar stock descontado
8. [ ] Ver movimientos de inventario
9. [ ] Ajustar stock manualmente
10. [ ] Verificar nuevo stock

---

## 📝 Notas de Testing

**Navegadores a probar**:
- [ ] Chrome (versión actual)
- [ ] Firefox (versión actual)
- [ ] Edge (versión actual)
- [ ] Safari (si tienes Mac/iPhone)

**Dispositivos**:
- [ ] Desktop/Laptop
- [ ] Tablet
- [ ] Móvil (Android)
- [ ] Móvil (iOS)

**Datos de Prueba Iniciales**:
- Productos: 8 (verificar en Inventario)
- Clientes: 4 (verificar en Configuración → Clientes)
- Categorías: 8
- Impuestos: 4

**Recomendaciones**:
1. Probar en orden: primero módulos básicos, luego integraciones
2. Tomar screenshots de bugs encontrados
3. Documentar pasos para reproducir bugs
4. Verificar en diferentes navegadores problemas de UI
5. Probar casos límite y validaciones
6. Verificar que los datos persisten después de recargar

---

## 🐛 Registro de Bugs Encontrados

### Template de Bug Report

```markdown
**ID**: BUG-001
**Módulo**: [POS/Inventario/Crédito/Caja/Reportes/Config]
**Severidad**: [Crítico/Alto/Medio/Bajo]
**Título**: Descripción breve del bug

**Pasos para reproducir**:
1.
2.
3.

**Resultado esperado**:

**Resultado actual**:

**Navegador/Dispositivo**:

**Screenshots**: (si aplica)
```

---

## ✅ Criterios de Aprobación

**Para pasar QA, debe cumplir**:
- ✅ 0 bugs críticos (que impidan usar funcionalidad core)
- ✅ < 3 bugs de severidad alta
- ✅ Todos los flujos end-to-end funcionan
- ✅ UI responsiva en al menos 2 dispositivos
- ✅ No hay errores de consola graves
- ✅ Performance aceptable (< 3s carga inicial)

---

**Fecha de Testing**: _______________
**Testeador**: _______________
**Versión**: 1.0.0 MVP
**Ambiente**: Production (Render)
