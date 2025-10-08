# 🚀 Guía Rápida de Testing - NexoPOS

## ⏱️ Test Rápido (15 minutos)

Si tienes poco tiempo, prueba esto primero:

### 1. Login (2 min)
- [ ] Login con admin@nexopos.co / Admin123!
- [ ] Verifica que muestra tu nombre arriba

### 2. POS - Venta Básica (5 min)
- [ ] Presiona F1 o ve a POS
- [ ] Busca "coca"
- [ ] Agrega 2 Coca Colas
- [ ] Agrega 1 Agua Cristal
- [ ] Método de pago: Efectivo $10,000
- [ ] Procesar Venta
- [ ] Verifica recibo generado

### 3. Inventario (3 min)
- [ ] Presiona F2 o ve a Inventario
- [ ] Verifica que Coca Cola tiene menos stock
- [ ] Haz click en "Ver movimientos"
- [ ] Confirma que aparece la venta

### 4. Caja (3 min)
- [ ] Presiona F4 o ve a Caja
- [ ] Si no hay caja abierta, abre una con $100,000
- [ ] Verifica que la venta aparece en movimientos
- [ ] Cierra la caja
- [ ] Verifica el arqueo

### 5. Navegación (2 min)
- [ ] Prueba todos los atajos (F1 a F6)
- [ ] Verifica que no hay errores en consola (F12)
- [ ] Logout y vuelve a hacer login

**✅ Si todo esto funciona, el 80% del sistema está OK**

---

## 🎯 Escenarios Críticos (30 minutos)

### Escenario 1: Flujo Completo de Tienda
**Objetivo**: Simular un día de trabajo completo

1. **Apertura** (2 min)
   - Login como Admin
   - Abrir caja con $200,000

2. **Ventas** (10 min)
   - Venta 1: 2 Coca Colas + 1 Pan Bimbo (Efectivo)
   - Venta 2: 3 Aguas + 2 Jabones (Tarjeta)
   - Venta 3: 1 Leche + 1 Papel higiénico (Nequi)
   - Venta 4: 5 Lapiceros + 2 Cuadernos (Efectivo con cambio)

3. **Crédito** (5 min)
   - Venta a crédito a Juan Pérez
   - Registrar abono de $20,000
   - Verificar saldo actualizado

4. **Ajustes** (5 min)
   - Ir a Inventario
   - Ajustar stock de "Coca Cola" +24 (nueva caja llegó)
   - Agregar nota: "Compra a proveedor"

5. **Cierre** (5 min)
   - Cerrar caja
   - Verificar arqueo correcto
   - Ver reporte del día

6. **Reportes** (3 min)
   - Ver ventas del día
   - Ver productos más vendidos
   - Verificar totales

---

### Escenario 2: Gestión de Crédito
**Objetivo**: Probar todo el ciclo de fiado

1. Cliente con crédito (Juan Pérez: límite $500,000)
2. Venta a crédito por $150,000
3. Cliente intenta otra venta por $400,000 (debe rechazar)
4. Registrar abono de $50,000
5. Ahora sí puede vender $400,000 (tiene disponible)
6. Registrar abonos hasta pagar todo
7. Verificar que crédito queda en $0

---

### Escenario 3: Control de Inventario
**Objetivo**: Verificar que el stock se maneja correctamente

1. Ver stock inicial de un producto (ej: Coca Cola = X)
2. Vender 5 unidades
3. Verificar stock = X - 5
4. Intentar vender más de lo que hay en stock (debe alertar)
5. Ajustar stock manualmente +10
6. Verificar movimientos de inventario
7. Ver que aparecen: venta (-5) y ajuste (+10)

---

## 🐛 Bugs Comunes a Buscar

### UI/Frontend
- [ ] Botones que no responden al click
- [ ] Textos cortados o superpuestos
- [ ] Imágenes rotas
- [ ] Scroll que no funciona
- [ ] Modales que no cierran
- [ ] Formularios que no limpian después de enviar
- [ ] Números con formato incorrecto ($1.234.567 ✅ vs 1234567 ❌)
- [ ] Fechas con formato incorrecto

### Validaciones
- [ ] Se pueden enviar formularios vacíos
- [ ] Se pueden ingresar números negativos donde no deberían
- [ ] Se puede ingresar texto donde van números
- [ ] Emails sin @ son aceptados
- [ ] Passwords muy cortos son aceptados

### Lógica de Negocio
- [ ] Total de venta incorrecto
- [ ] Descuentos mal calculados
- [ ] IVA mal calculado
- [ ] Stock no se descuenta
- [ ] Stock se vuelve negativo
- [ ] Cambio incorrecto en ventas con efectivo
- [ ] Saldo de crédito mal calculado
- [ ] Arqueo de caja con diferencias inexplicables

### Performance
- [ ] Búsquedas muy lentas (> 3 segundos)
- [ ] Carga inicial muy lenta (> 5 segundos)
- [ ] Lags al escribir
- [ ] Animaciones entrecortadas

### Datos
- [ ] Productos duplicados
- [ ] SKUs duplicados
- [ ] Datos que no persisten al recargar
- [ ] Sesión se pierde al recargar
- [ ] Ventas que no aparecen en reportes

---

## 🔍 Herramientas de Testing

### DevTools (F12)

**Console**:
```javascript
// Ver token guardado
localStorage.getItem('auth-storage')

// Ver usuario actual
JSON.parse(localStorage.getItem('auth-storage'))

// Limpiar sesión (para testing)
localStorage.clear()
```

**Network**:
- Filtrar por "api" para ver todas las requests
- Buscar requests que fallen (rojo)
- Ver tiempos de respuesta
- Ver payloads enviados

**Application**:
- Ver localStorage
- Ver sessionStorage
- Desregistrar Service Worker (si causa problemas)

---

## 📊 Métricas de Performance

### Tiempos Aceptables
- Primera carga: < 3 segundos
- Navegación entre vistas: < 500ms
- Búsqueda: < 1 segundo
- Guardar formulario: < 2 segundos
- Procesar venta: < 2 segundos

### Cómo Medir
1. F12 → Network → Reload
2. Ver "DOMContentLoaded" y "Load" en la parte inferior
3. Si alguno es > 3 segundos, hay problema de performance

---

## 📝 Cómo Reportar Bugs

### Información Mínima
1. **Título claro**: "No se puede agregar productos al carrito"
2. **Pasos exactos** para reproducir
3. **Qué esperabas** que pasara
4. **Qué pasó** en realidad
5. **Navegador y versión**
6. **Screenshot** (si es visual)
7. **Errores de consola** (F12 → Console)

### Ejemplo de Bug Report

```markdown
**BUG-001: Total de venta se calcula mal con descuento**

**Pasos**:
1. Agregar Coca Cola $3,000 x 2 = $6,000
2. Aplicar descuento de 10%
3. Ver total

**Esperado**: $5,400 (10% de descuento)
**Actual**: $6,300 (descuento mal calculado)

**Navegador**: Chrome 120
**Screenshot**: [adjuntar]
**Console**: No hay errores
```

---

## ✅ Checklist Mínimo para Aprobar

**Funcionalidad Core (debe funcionar 100%)**:
- [ ] Login/Logout
- [ ] Crear venta básica (efectivo)
- [ ] Stock se descuenta después de venta
- [ ] Buscar productos en POS
- [ ] Abrir y cerrar caja
- [ ] Ver reportes básicos

**Funcionalidad Importante (debe funcionar 80%)**:
- [ ] Ventas con todos los métodos de pago
- [ ] Ventas a crédito
- [ ] Registrar abonos
- [ ] Ajustar inventario
- [ ] Crear/editar productos
- [ ] Crear/editar clientes

**Funcionalidad Nice-to-Have (puede tener bugs menores)**:
- [ ] Reportes avanzados
- [ ] Gráficas
- [ ] Exportar PDF/Excel
- [ ] PWA/Instalación

---

## 🎓 Tips de Testing

1. **Siempre abre DevTools** (F12) mientras pruebas
2. **Prueba en modo incógnito** para evitar caché
3. **Usa datos reales** (nombres, precios colombianos)
4. **Prueba casos límite**: 0, números grandes, textos largos
5. **Intenta romper el sistema**: clicks dobles, spam de botones
6. **Verifica en móvil**: al menos prueba en tu teléfono
7. **Recarga frecuentemente**: para ver si datos persisten
8. **Logout y login**: para verificar sesión

---

## 🚨 Red Flags (reportar inmediatamente)

- ❌ No se puede hacer login
- ❌ Ventas no se registran
- ❌ Stock no se descuenta
- ❌ Totales incorrectos
- ❌ Errores 500 del backend
- ❌ App completamente rota en móvil
- ❌ Datos se pierden al recargar
- ❌ No se puede abrir caja

---

¿Listo para empezar?

**Sugerencia**: Empieza con el "Test Rápido (15 min)" y luego avanza a los escenarios críticos.

¡Documenta todo lo que encuentres!
