# 📋 Plan de Pruebas UI - NexoPOS v1.0

## 🎯 Información General

**URL de Pruebas**: https://nexopos.cloution.cloud
**Fecha de Ejecución**: _____________
**Ejecutado por**: _____________
**Navegador**: Chrome / Firefox / Safari (marcar)
**Versión del Sistema**: 1.0.0

---

## 📖 Instrucciones Generales

### Cómo usar este documento:

1. **Ejecuta cada flujo en orden** (algunos dependen de datos creados previamente)
2. **Marca cada paso** con ✅ cuando pase o ❌ si falla
3. **Anota los errores** en la sección de "Defectos Encontrados" al final
4. **Toma screenshots** de cualquier error o comportamiento inesperado
5. **Usa datos de prueba** (no datos reales de producción)

### Atajos de Teclado:
- **F1**: Punto de Venta
- **F2**: Inventario
- **F3**: Fiado
- **F4**: Caja
- **F5**: Reportes
- **F6**: Configuración

---

## 1️⃣ MÓDULO: AUTENTICACIÓN

### TC-001: Login Exitoso

**Objetivo**: Verificar que un usuario puede iniciar sesión correctamente

**Pre-requisitos**:
- Tener credenciales de usuario válidas
- Sistema debe estar desplegado y accesible

**Pasos**:

1. [ ] Abrir navegador y navegar a https://nexopos.cloution.cloud
   - ✅ **Esperado**: Pantalla de login se carga sin errores

2. [ ] Ingresar email: `admin@nexopos.com` (o tu usuario de prueba)
   - ✅ **Esperado**: Campo acepta texto

3. [ ] Hacer clic en botón "Continuar" o presionar Enter
   - ✅ **Esperado**: Avanza a pantalla de contraseña

4. [ ] Ingresar contraseña válida
   - ✅ **Esperado**: Campo muestra puntos/asteriscos

5. [ ] Hacer clic en "Iniciar Sesión"
   - ✅ **Esperado**:
     - Loading spinner aparece brevemente
     - Redirige a vista de Punto de Venta (POS)
     - Muestra nombre de usuario en la esquina superior
     - No muestra errores

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-002: Login con Credenciales Incorrectas

**Objetivo**: Verificar que el sistema rechaza credenciales inválidas

**Pasos**:

1. [ ] Ir a pantalla de login (hacer logout si es necesario)

2. [ ] Ingresar email válido pero contraseña incorrecta: `wrongpassword123`

3. [ ] Hacer clic en "Iniciar Sesión"
   - ✅ **Esperado**:
     - Mensaje de error: "Credenciales inválidas" o similar
     - No permite acceso al sistema
     - Permanece en pantalla de login

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-003: Persistencia de Sesión

**Objetivo**: Verificar que la sesión se mantiene al refrescar

**Pasos**:

1. [ ] Iniciar sesión exitosamente

2. [ ] Presionar F5 (Refresh) en el navegador
   - ✅ **Esperado**:
     - Página se recarga
     - Sesión se mantiene activa
     - No pide login nuevamente

3. [ ] Cerrar pestaña del navegador

4. [ ] Abrir nueva pestaña y navegar a https://nexopos.cloution.cloud
   - ✅ **Esperado**: Usuario sigue logueado (sesión persiste)

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-004: Cerrar Sesión

**Objetivo**: Verificar que el logout funciona correctamente

**Pasos**:

1. [ ] Estando logueado, buscar botón/menú de "Cerrar Sesión" o "Logout"

2. [ ] Hacer clic en "Cerrar Sesión"
   - ✅ **Esperado**:
     - Redirige a pantalla de login
     - Sesión terminada

3. [ ] Intentar navegar a https://nexopos.cloution.cloud directamente
   - ✅ **Esperado**: Redirige a login (no permite acceso sin autenticación)

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 2️⃣ MÓDULO: GESTIÓN DE PRODUCTOS

### TC-101: Crear Producto por Unidad (Sin Variantes)

**Objetivo**: Crear un producto simple vendido por unidad

**Pre-requisitos**: Usuario logueado con permisos de productos

**Pasos**:

1. [ ] Presionar **F2** para ir a Inventario

2. [ ] Hacer clic en botón "Agregar Producto" o "Nuevo Producto"
   - ✅ **Esperado**: Modal de creación de producto aparece

3. [ ] Llenar formulario:
   - **Nombre**: `Coca Cola 400ml - Prueba`
   - **Descripción**: `Bebida gaseosa sabor cola`
   - **Tipo de identificador**: Seleccionar "Ambos (SKU y Código de Barras)"
   - **SKU**: `TEST-COC-400`
   - **Código de Barras**: `7700000000001`
   - **Tipo de venta**: `Por Unidad`
   - **Precio base**: `3500`
   - **Costo unitario**: `2000`
   - **Stock inicial**: `50`
   - **Categoría**: Seleccionar o crear "Bebidas"

4. [ ] Hacer clic en "Guardar"
   - ✅ **Esperado**:
     - Mensaje de éxito: "Producto creado"
     - Modal se cierra
     - Producto aparece en la tabla de inventario
     - Muestra stock: 50 unidades
     - Muestra precio: $3.500

5. [ ] Verificar producto en la tabla
   - ✅ **Esperado**:
     - Nombre correcto
     - SKU correcto
     - Stock correcto
     - Precio correcto
     - Estado: Activo

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-102: Validaciones de Campos Obligatorios

**Objetivo**: Verificar que no se puede crear producto sin campos requeridos

**Pasos**:

1. [ ] Ir a Inventario (F2)

2. [ ] Hacer clic en "Agregar Producto"

3. [ ] Intentar guardar SIN llenar ningún campo
   - ✅ **Esperado**:
     - Mensaje de error
     - Indica campos faltantes

4. [ ] Llenar solo nombre: `Producto Incompleto`

5. [ ] Intentar guardar
   - ✅ **Esperado**: Error indicando falta SKU o código de barras

6. [ ] Llenar nombre y SKU pero dejar precio en 0

7. [ ] Intentar guardar
   - ✅ **Esperado**: Error indicando precio inválido

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-103: Crear Producto por Peso

**Objetivo**: Crear un producto vendido por peso (gramos/kilos)

**Pasos**:

1. [ ] Ir a Inventario (F2) → "Agregar Producto"

2. [ ] Llenar formulario:
   - **Nombre**: `Plátano Hartón - Prueba`
   - **SKU**: `TEST-FRU-PLAT`
   - **Código de Barras**: `7700000000002`
   - **Tipo de venta**: Seleccionar "Por Peso"
   - **Precio por gramo**: `5` (5 pesos por gramo)
   - **Costo por gramo**: `3`
   - **Unidad de peso**: `Kilogramo`
   - **Stock inicial**: `100` (100 kg = 100,000 gramos)

3. [ ] Guardar producto
   - ✅ **Esperado**:
     - Producto creado exitosamente
     - Aparece en inventario
     - Muestra "Por Peso" como tipo
     - Stock: 100 kg o 100,000 g

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-104: Crear Producto con Variantes

**Objetivo**: Crear producto con múltiples variantes (tallas)

**Pasos**:

1. [ ] Ir a Inventario (F2) → "Agregar Producto"

2. [ ] Llenar información base:
   - **Nombre**: `Camiseta Basic - Prueba`
   - **SKU**: `TEST-CAM-BAS`
   - **Precio base**: `25000`
   - **Costo unitario**: `12000`

3. [ ] Agregar variantes:
   - **Variante 1**:
     - Nombre: `Talla S`
     - SKU: `TEST-CAM-BAS-S`
     - Delta de precio: `0`
     - Stock: `10`

   - **Variante 2**:
     - Nombre: `Talla M`
     - SKU: `TEST-CAM-BAS-M`
     - Delta de precio: `0`
     - Stock: `15`

   - **Variante 3**:
     - Nombre: `Talla L`
     - SKU: `TEST-CAM-BAS-L`
     - Delta de precio: `2000`
     - Stock: `12`

   - **Variante 4**:
     - Nombre: `Talla XL`
     - SKU: `TEST-CAM-BAS-XL`
     - Delta de precio: `3000`
     - Stock: `8`

4. [ ] Guardar producto
   - ✅ **Esperado**:
     - Producto creado con 4 variantes
     - Stock total: 45 unidades (suma de variantes)
     - Cada variante con precio correcto

5. [ ] Verificar en tabla de inventario
   - ✅ **Esperado**:
     - Muestra producto principal
     - Al expandir muestra 4 variantes
     - Precios: S=$25k, M=$25k, L=$27k, XL=$28k

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-105: Subir Imagen a Producto

**Objetivo**: Agregar imagen a un producto existente

**Pre-requisitos**: Tener una imagen de prueba (JPG/PNG, <5MB)

**Pasos**:

1. [ ] Ir a Inventario (F2)

2. [ ] Buscar producto "Coca Cola 400ml - Prueba" (creado en TC-101)

3. [ ] Hacer clic en botón "Editar" (ícono de lápiz)

4. [ ] En el modal de edición, buscar sección de imagen

5. [ ] Hacer clic en "Seleccionar imagen" o "Subir imagen"

6. [ ] Seleccionar archivo de imagen de prueba (JPG o PNG, <5MB)
   - ✅ **Esperado**:
     - Preview de imagen aparece
     - Mensaje: "Imagen cargada" o similar

7. [ ] Hacer clic en "Guardar" para actualizar producto
   - ✅ **Esperado**:
     - Mensaje de éxito
     - Modal se cierra

8. [ ] Verificar en tabla de inventario
   - ✅ **Esperado**:
     - Miniatura de imagen aparece en la columna de imagen
     - Imagen NO muestra error 404

9. [ ] Refrescar página (F5)
   - ✅ **Esperado**:
     - Imagen persiste (no se pierde al refrescar)

10. [ ] Ir a Punto de Venta (F1)

11. [ ] Buscar producto "Coca Cola"
    - ✅ **Esperado**:
      - Imagen también aparece en el grid de productos del POS

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-106: Validación de Tamaño de Imagen

**Objetivo**: Verificar que el sistema rechaza imágenes muy grandes

**Pre-requisitos**: Tener una imagen >5MB o crear una modificando

**Pasos**:

1. [ ] Ir a Inventario → Editar un producto

2. [ ] Intentar subir imagen de más de 5MB
   - ✅ **Esperado**:
     - Mensaje de error: "Imagen muy grande, máximo 5MB"
     - No permite subir
     - Imagen anterior (si existía) se mantiene

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-107: Editar Producto Existente

**Objetivo**: Modificar información de un producto

**Pasos**:

1. [ ] Ir a Inventario (F2)

2. [ ] Buscar producto "Coca Cola 400ml - Prueba"

3. [ ] Hacer clic en "Editar"

4. [ ] Cambiar precio base de `3500` a `4000`

5. [ ] Cambiar stock de `50` a `60`

6. [ ] Guardar cambios
   - ✅ **Esperado**:
     - Mensaje de éxito
     - Precio actualizado a $4.000
     - Stock actualizado a 60

7. [ ] Verificar en tabla que cambios se aplicaron

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-108: Eliminar Producto

**Objetivo**: Eliminar un producto del sistema

**Pasos**:

1. [ ] Ir a Inventario (F2)

2. [ ] Buscar producto creado para prueba

3. [ ] Hacer clic en botón "Eliminar" (ícono de basura)
   - ✅ **Esperado**:
     - Modal de confirmación aparece
     - Pregunta: "¿Está seguro de eliminar este producto?"

4. [ ] Hacer clic en "Cancelar"
   - ✅ **Esperado**:
     - Modal se cierra
     - Producto NO se elimina

5. [ ] Hacer clic nuevamente en "Eliminar"

6. [ ] Confirmar eliminación
   - ✅ **Esperado**:
     - Mensaje de éxito
     - Producto desaparece de la tabla
     - No muestra errores

7. [ ] Buscar producto eliminado
   - ✅ **Esperado**: No aparece en resultados

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 3️⃣ MÓDULO: INVENTARIO

### TC-201: Ajustar Stock - Agregar Unidades

**Objetivo**: Incrementar stock de un producto

**Pasos**:

1. [ ] Ir a Inventario (F2)

2. [ ] Identificar producto con stock actual (ej: "Coca Cola" con 60 unidades)

3. [ ] Hacer clic en botón "Ajustar Stock" o ícono de ajuste

4. [ ] Seleccionar tipo de ajuste: **"Agregar"**

5. [ ] Ingresar cantidad: `20`

6. [ ] Ingresar razón: `Compra nueva - Prueba`

7. [ ] Guardar ajuste
   - ✅ **Esperado**:
     - Mensaje de éxito
     - Stock actualizado: 60 + 20 = 80 unidades
     - Tabla muestra nuevo stock

8. [ ] Verificar historial de movimientos (si existe vista)
   - ✅ **Esperado**: Aparece registro del ajuste con fecha, cantidad y razón

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-202: Ajustar Stock - Restar Unidades

**Objetivo**: Decrementar stock de un producto

**Pasos**:

1. [ ] Ir a Inventario (F2)

2. [ ] Buscar producto con stock (ej: "Coca Cola" ahora con 80 unidades)

3. [ ] Hacer clic en "Ajustar Stock"

4. [ ] Seleccionar tipo: **"Restar"**

5. [ ] Ingresar cantidad: `15`

6. [ ] Razón: `Producto dañado - Prueba`

7. [ ] Guardar
   - ✅ **Esperado**:
     - Stock actualizado: 80 - 15 = 65 unidades
     - Mensaje de éxito

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-203: Validación Stock Negativo

**Objetivo**: Verificar que no permite stock negativo

**Pasos**:

1. [ ] Buscar producto con stock bajo (ej: 10 unidades)

2. [ ] Intentar ajustar: Restar 20 unidades
   - ✅ **Esperado**:
     - Mensaje de error
     - No permite stock negativo
     - Stock se mantiene en 10

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-204: Filtrar por Stock Bajo

**Objetivo**: Ver productos con stock bajo el umbral

**Pasos**:

1. [ ] Ir a Inventario (F2)

2. [ ] Buscar filtro o pestaña "Stock Bajo"

3. [ ] Aplicar filtro
   - ✅ **Esperado**:
     - Muestra solo productos con stock < 10 (o umbral configurado)
     - Productos marcados con indicador visual (ej: badge amarillo)

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-205: Filtrar Sin Stock

**Objetivo**: Ver productos agotados

**Pasos**:

1. [ ] Ir a Inventario (F2)

2. [ ] Aplicar filtro "Sin Stock" o "Stock = 0"
   - ✅ **Esperado**:
     - Muestra solo productos con stock = 0
     - Indicador visual claro (ej: badge rojo)

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 4️⃣ MÓDULO: PUNTO DE VENTA (POS)

### TC-301: Venta Simple - Efectivo

**Objetivo**: Realizar venta de un solo producto pagando en efectivo

**Pre-requisitos**:
- Caja debe estar abierta
- Debe existir producto con stock

**Pasos**:

1. [ ] Presionar **F1** para ir al Punto de Venta
   - ✅ **Esperado**: Vista de POS carga con grid de productos

2. [ ] Verificar que muestra productos disponibles

3. [ ] Hacer clic en producto "Coca Cola 400ml" (2 veces para cantidad = 2)
   - ✅ **Esperado**:
     - Producto aparece en carrito
     - Cantidad: 2
     - Precio unitario: $4.000
     - Subtotal: $8.000

4. [ ] Verificar área de totales
   - ✅ **Esperado**:
     - Subtotal: $8.000
     - IVA: (si aplica)
     - Total: $8.000 (o con IVA)

5. [ ] Hacer clic en botón "Cobrar" o "Pagar"
   - ✅ **Esperado**: Modal de pago aparece

6. [ ] Verificar que método de pago "Efectivo" está seleccionado

7. [ ] Ingresar monto recibido: `10000`
   - ✅ **Esperado**:
     - Muestra cambio: $2.000
     - Botón "Completar Venta" habilitado

8. [ ] Hacer clic en "Completar Venta"
   - ✅ **Esperado**:
     - Mensaje de éxito: "Venta registrada"
     - Modal de recibo aparece (opcional)
     - Carrito se limpia
     - Vuelve a vista vacía del POS

9. [ ] Verificar stock en Inventario (F2)
   - ✅ **Esperado**:
     - Stock de "Coca Cola" disminuyó en 2 unidades
     - Si tenía 65, ahora tiene 63

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-302: Venta Múltiples Productos

**Objetivo**: Vender varios productos en una transacción

**Pasos**:

1. [ ] Ir a POS (F1)

2. [ ] Agregar 3 productos diferentes al carrito:
   - "Coca Cola" × 2 = $8.000
   - "Plátano" × 500g = $2.500 (5 × 500)
   - "Camiseta M" × 1 = $25.000

3. [ ] Verificar total
   - ✅ **Esperado**: Total = $35.500

4. [ ] Proceder a cobrar con efectivo: $40.000

5. [ ] Completar venta
   - ✅ **Esperado**:
     - Venta exitosa
     - Cambio: $4.500
     - Stock de los 3 productos actualizado

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-303: Venta con Descuento Porcentual

**Objetivo**: Aplicar descuento del 10% a una venta

**Pasos**:

1. [ ] Agregar productos al carrito (Total: $10.000)

2. [ ] Buscar opción "Descuento" o "Aplicar Descuento"

3. [ ] Seleccionar tipo: **"Porcentaje"**

4. [ ] Ingresar: `10` (10%)

5. [ ] Aplicar descuento
   - ✅ **Esperado**:
     - Descuento aplicado: -$1.000
     - Nuevo total: $9.000
     - Muestra descuento en resumen

6. [ ] Completar venta
   - ✅ **Esperado**: Venta se registra con descuento aplicado

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-304: Venta con Descuento en Pesos

**Objetivo**: Aplicar descuento fijo en pesos

**Pasos**:

1. [ ] Agregar productos (Total: $20.000)

2. [ ] Aplicar descuento tipo: **"Pesos"**

3. [ ] Ingresar: `3000`
   - ✅ **Esperado**:
     - Descuento: -$3.000
     - Total final: $17.000

4. [ ] Completar venta

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-305: Venta con Tarjeta

**Objetivo**: Procesar pago con tarjeta de crédito/débito

**Pasos**:

1. [ ] Agregar productos al carrito (Total: $15.000)

2. [ ] Ir a pago

3. [ ] Seleccionar método de pago: **"Tarjeta"**

4. [ ] Verificar que monto a pagar es exacto (no pide efectivo recibido)

5. [ ] Completar venta
   - ✅ **Esperado**:
     - Venta registrada
     - Método de pago: CARD
     - No calcula cambio

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-306: Venta con Pago Digital (Nequi)

**Objetivo**: Procesar pago con método digital

**Pasos**:

1. [ ] Agregar productos (Total: $12.000)

2. [ ] Seleccionar método: **"Nequi"** o **"Daviplata"**

3. [ ] Completar venta
   - ✅ **Esperado**:
     - Venta exitosa
     - Método: DIGITAL

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-307: Búsqueda de Producto por Nombre

**Objetivo**: Buscar producto usando el campo de búsqueda

**Pasos**:

1. [ ] Ir a POS (F1)

2. [ ] Ubicar campo de búsqueda

3. [ ] Escribir: `Coca`
   - ✅ **Esperado**:
     - Grid filtra y muestra solo productos con "Coca" en el nombre
     - "Coca Cola 400ml" visible

4. [ ] Limpiar búsqueda
   - ✅ **Esperado**: Muestra todos los productos nuevamente

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-308: Búsqueda por Código de Barras

**Objetivo**: Agregar producto escaneando o ingresando código de barras

**Pasos**:

1. [ ] En campo de búsqueda/código de barras, ingresar: `7700000000001`

2. [ ] Presionar Enter
   - ✅ **Esperado**:
     - Producto "Coca Cola" se agrega automáticamente al carrito
     - Cantidad: 1
     - Foco vuelve a campo de búsqueda para siguiente producto

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-309: Filtrar por Categoría

**Objetivo**: Mostrar solo productos de una categoría

**Pasos**:

1. [ ] Buscar selector de categorías en POS

2. [ ] Seleccionar categoría: **"Bebidas"**
   - ✅ **Esperado**:
     - Muestra solo productos de categoría Bebidas
     - Otros productos ocultos

3. [ ] Seleccionar "Todas" o limpiar filtro
   - ✅ **Esperado**: Muestra todos los productos

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-310: Validación Carrito Vacío

**Objetivo**: No permitir procesar venta sin productos

**Pasos**:

1. [ ] Ir a POS con carrito vacío

2. [ ] Intentar hacer clic en "Cobrar"
   - ✅ **Esperado**:
     - Botón deshabilitado O
     - Mensaje: "Agregue productos al carrito"

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-311: Validación Producto Sin Stock

**Objetivo**: No permitir vender producto agotado

**Pre-requisitos**: Tener producto con stock = 0

**Pasos**:

1. [ ] Buscar producto sin stock

2. [ ] Intentar agregarlo al carrito
   - ✅ **Esperado**:
     - Mensaje de advertencia: "Producto sin stock"
     - No se agrega al carrito O
     - Badge "Sin Stock" visible en tarjeta del producto

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-312: Editar Cantidad en Carrito

**Objetivo**: Cambiar cantidad de producto ya agregado

**Pasos**:

1. [ ] Agregar producto al carrito (cantidad inicial: 2)

2. [ ] Buscar control de cantidad en el carrito

3. [ ] Incrementar cantidad a 5
   - ✅ **Esperado**:
     - Cantidad actualiza a 5
     - Subtotal se recalcula
     - Total se actualiza

4. [ ] Decrementar a 1
   - ✅ **Esperado**: Cantidad y totales actualizan

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-313: Remover Producto del Carrito

**Objetivo**: Eliminar producto del carrito antes de pagar

**Pasos**:

1. [ ] Agregar 2 productos al carrito

2. [ ] Hacer clic en botón "Eliminar" o ícono X en uno de ellos
   - ✅ **Esperado**:
     - Producto se elimina del carrito
     - Total se recalcula
     - Otro producto permanece

3. [ ] Eliminar último producto
   - ✅ **Esperado**: Carrito queda vacío

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-314: Venta de Producto por Peso

**Objetivo**: Vender producto ingresando peso específico

**Pre-requisitos**: Producto "Plátano" configurado por peso

**Pasos**:

1. [ ] Agregar "Plátano Hartón" al carrito

2. [ ] Sistema debe pedir peso
   - ✅ **Esperado**: Modal o campo para ingresar peso aparece

3. [ ] Ingresar peso: `750` (gramos)

4. [ ] Confirmar
   - ✅ **Esperado**:
     - Producto en carrito muestra: "750g"
     - Precio calculado: 750 × $5 = $3.750
     - Total actualizado

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-315: Venta de Variante Específica

**Objetivo**: Vender variante particular de un producto

**Pre-requisitos**: Producto "Camiseta" con variantes S, M, L, XL

**Pasos**:

1. [ ] Hacer clic en producto "Camiseta Basic"

2. [ ] Sistema debe mostrar selector de variantes
   - ✅ **Esperado**: Modal con opciones: S, M, L, XL

3. [ ] Seleccionar: **"Talla L"**

4. [ ] Confirmar
   - ✅ **Esperado**:
     - Carrito muestra "Camiseta Basic - Talla L"
     - Precio: $27.000 (precio base + delta)

5. [ ] Completar venta

6. [ ] Verificar en inventario
   - ✅ **Esperado**:
     - Stock de variante L disminuyó en 1
     - Stock de otras variantes sin cambios

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 5️⃣ MÓDULO: CAJA REGISTRADORA

### TC-401: Apertura de Caja

**Objetivo**: Abrir caja al inicio del turno

**Pre-requisitos**: No debe haber caja abierta

**Pasos**:

1. [ ] Presionar **F4** para ir a Caja

2. [ ] Hacer clic en botón "Abrir Caja" o similar
   - ✅ **Esperado**: Modal de apertura aparece

3. [ ] Ingresar datos:
   - **Monto inicial**: `100000` ($100.000 en efectivo)
   - **Notas** (opcional): `Apertura turno mañana - Prueba`

4. [ ] Hacer clic en "Abrir Caja"
   - ✅ **Esperado**:
     - Mensaje de éxito: "Caja abierta"
     - Vista de caja muestra:
       - Estado: ABIERTA
       - Monto inicial: $100.000
       - Fecha/hora de apertura
       - Ventas del día: $0

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-402: Validación Caja Ya Abierta

**Objetivo**: No permitir abrir segunda caja si ya existe una abierta

**Pre-requisitos**: Caja ya abierta del TC-401

**Pasos**:

1. [ ] Ir a Caja (F4)

2. [ ] Intentar hacer clic en "Abrir Caja"
   - ✅ **Esperado**:
     - Botón deshabilitado O
     - Mensaje: "Ya existe una caja abierta"

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-403: Registrar Gasto

**Objetivo**: Registrar un gasto durante el turno

**Pre-requisitos**: Caja abierta

**Pasos**:

1. [ ] En vista de Caja, buscar opción "Registrar Gasto"

2. [ ] Hacer clic en "Registrar Gasto"
   - ✅ **Esperado**: Modal de gasto aparece

3. [ ] Llenar formulario:
   - **Concepto**: `Compra de insumos - Prueba`
   - **Monto**: `15000`
   - **Categoría**: Seleccionar (ej: "Insumos")
   - **Notas**: `Papel higiénico y jabón`

4. [ ] Guardar gasto
   - ✅ **Esperado**:
     - Mensaje de éxito
     - Gasto aparece en lista de gastos del día
     - Balance de caja afectado: -$15.000

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-404: Realizar Ventas con Caja Abierta

**Objetivo**: Verificar que ventas se registran en caja actual

**Pre-requisitos**: Caja abierta

**Pasos**:

1. [ ] Ir a POS (F1) y realizar venta de $10.000 en efectivo

2. [ ] Volver a Caja (F4)
   - ✅ **Esperado**:
     - Total ventas incrementó: +$10.000
     - Ventas en efectivo: +$10.000
     - Número de transacciones: +1

3. [ ] Realizar otra venta de $5.000 con tarjeta

4. [ ] Volver a Caja
   - ✅ **Esperado**:
     - Total ventas: $15.000
     - Ventas efectivo: $10.000
     - Ventas tarjeta: $5.000
     - Transacciones: 2

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-405: Cierre de Caja - Cuadre Exacto

**Objetivo**: Cerrar caja cuando efectivo cuadra exactamente

**Pre-requisitos**:
- Caja abierta
- Ventas realizadas

**Datos de ejemplo**:
- Apertura: $100.000
- Ventas efectivo: $10.000
- Gastos: $15.000
- **Efectivo esperado**: $95.000

**Pasos**:

1. [ ] Ir a Caja (F4)

2. [ ] Hacer clic en "Cerrar Caja" o "Arqueo"
   - ✅ **Esperado**: Modal de cierre aparece

3. [ ] Verificar cálculos automáticos:
   - **Monto inicial**: $100.000
   - **+ Ventas efectivo**: $10.000
   - **- Gastos**: $15.000
   - **= Efectivo esperado**: $95.000

4. [ ] Contar efectivo físico en caja y ingresar: `95000`

5. [ ] Verificar diferencia calculada
   - ✅ **Esperado**: Diferencia = $0 (cuadre perfecto)

6. [ ] Ingresar notas de cierre (opcional): `Cierre turno - Sin novedades`

7. [ ] Hacer clic en "Cerrar Caja"
   - ✅ **Esperado**:
     - Mensaje de éxito: "Caja cerrada exitosamente"
     - Estado cambia a: CERRADA
     - Muestra resumen del turno
     - Permite imprimir/descargar reporte

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-406: Cierre de Caja - Con Faltante

**Objetivo**: Cerrar caja cuando falta efectivo

**Pre-requisitos**: Caja abierta (abrir nueva para esta prueba)

**Escenario**:
- Apertura: $100.000
- Ventas efectivo: $20.000
- Esperado: $120.000
- Contado real: $119.000 (falta $1.000)

**Pasos**:

1. [ ] Ir a cierre de caja

2. [ ] Ingresar efectivo contado: `119000`

3. [ ] Verificar diferencia
   - ✅ **Esperado**:
     - Diferencia: -$1.000 (negativo = faltante)
     - Indicador visual de alerta (ej: rojo)

4. [ ] Sistema debe pedir razón de discrepancia
   - ✅ **Esperado**: Campo obligatorio de razón aparece

5. [ ] Ingresar razón: `Faltante - Posible error en vuelto`

6. [ ] Cerrar caja
   - ✅ **Esperado**:
     - Cierre se completa con discrepancia registrada
     - Reporte muestra faltante de $1.000

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-407: Cierre de Caja - Con Sobrante

**Objetivo**: Cerrar caja cuando sobra efectivo

**Escenario**:
- Esperado: $120.000
- Contado: $121.500 (sobra $1.500)

**Pasos**:

1. [ ] Ingresar efectivo contado: `121500`

2. [ ] Verificar diferencia
   - ✅ **Esperado**:
     - Diferencia: +$1.500 (positivo = sobrante)
     - Indicador visual (ej: amarillo/azul)

3. [ ] Ingresar razón: `Sobrante - Cliente no recibió vuelto`

4. [ ] Cerrar caja
   - ✅ **Esperado**: Cierre exitoso con sobrante registrado

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-408: Ver Historial de Cajas

**Objetivo**: Consultar cierres de caja anteriores

**Pasos**:

1. [ ] En vista de Caja, buscar sección "Historial" o "Cierres Anteriores"

2. [ ] Verificar lista de cierres
   - ✅ **Esperado**:
     - Muestra cajas cerradas
     - Fecha y hora
     - Usuario que cerró
     - Monto esperado vs contado
     - Diferencia (si hubo)

3. [ ] Hacer clic en un cierre para ver detalle
   - ✅ **Esperado**:
     - Muestra resumen completo
     - Ventas del período
     - Gastos
     - Discrepancias

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 6️⃣ MÓDULO: CRÉDITO (FIADO)

### TC-501: Crear Cliente

**Objetivo**: Registrar nuevo cliente para ventas a crédito

**Pasos**:

1. [ ] Presionar **F3** para ir a módulo de Fiado/Crédito

2. [ ] Hacer clic en "Agregar Cliente" o ícono +
   - ✅ **Esperado**: Modal de creación de cliente aparece

3. [ ] Llenar formulario:
   - **Nombre**: `Juan Pérez - Prueba`
   - **Documento**: `1234567890`
   - **Teléfono**: `3001234567`
   - **Dirección**: `Calle 123 #45-67`
   - **Límite de crédito**: `100000` ($100.000)
   - **Email** (opcional): `juan.prueba@test.com`

4. [ ] Guardar cliente
   - ✅ **Esperado**:
     - Mensaje de éxito
     - Cliente aparece en lista
     - Saldo actual: $0
     - Límite disponible: $100.000

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-502: Venta a Crédito

**Objetivo**: Realizar venta fiada a un cliente

**Pre-requisitos**: Cliente "Juan Pérez" creado

**Pasos**:

1. [ ] Ir a POS (F1)

2. [ ] Agregar productos al carrito (Total: $20.000)

3. [ ] Proceder a pago

4. [ ] Seleccionar método de pago: **"Fiado"** o **"Crédito"**

5. [ ] Seleccionar cliente: **"Juan Pérez"**
   - ✅ **Esperado**:
     - Muestra límite disponible: $100.000
     - Permite proceder

6. [ ] Completar venta
   - ✅ **Esperado**:
     - Venta registrada como crédito
     - Mensaje de éxito

7. [ ] Ir a módulo de Fiado (F3)

8. [ ] Buscar cliente "Juan Pérez"
   - ✅ **Esperado**:
     - Saldo pendiente: $20.000
     - Límite disponible: $80.000 ($100k - $20k)
     - Estado: PENDIENTE o CON DEUDA

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-503: Validación Límite de Crédito

**Objetivo**: No permitir venta que exceda límite

**Pre-requisitos**: Cliente "Juan Pérez" con deuda $20.000 y límite $100.000

**Pasos**:

1. [ ] Intentar venta a crédito por $85.000
   - Deuda actual: $20.000
   - Nueva venta: $85.000
   - Total deuda sería: $105.000
   - Límite: $100.000

2. [ ] Seleccionar método crédito y cliente "Juan Pérez"
   - ✅ **Esperado**:
     - Mensaje de error: "Excede límite de crédito"
     - Muestra disponible: $80.000
     - No permite completar venta

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-504: Registrar Abono Parcial

**Objetivo**: Cliente paga parte de su deuda

**Pre-requisitos**: Cliente "Juan Pérez" con deuda $20.000

**Pasos**:

1. [ ] Ir a módulo de Fiado (F3)

2. [ ] Buscar cliente "Juan Pérez"

3. [ ] Hacer clic en "Registrar Abono" o "Pagar"
   - ✅ **Esperado**: Modal de abono aparece

4. [ ] Verificar información:
   - Deuda actual: $20.000

5. [ ] Ingresar monto de abono: `8000` ($8.000)

6. [ ] Seleccionar método de pago: Efectivo

7. [ ] Notas (opcional): `Abono parcial - Prueba`

8. [ ] Confirmar abono
   - ✅ **Esperado**:
     - Mensaje de éxito
     - Saldo actualizado: $12.000 ($20k - $8k)
     - Límite disponible: $88.000
     - Abono registrado en historial

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-505: Liquidar Deuda Completa

**Objetivo**: Cliente paga toda su deuda

**Pre-requisitos**: Cliente con deuda $12.000

**Pasos**:

1. [ ] Registrar abono de: `12000` (monto total de deuda)

2. [ ] Confirmar
   - ✅ **Esperado**:
     - Saldo: $0
     - Estado: PAGADO o SIN DEUDA
     - Límite disponible: $100.000 (completo)

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-506: Ver Historial de Abonos

**Objetivo**: Consultar historial de pagos de un cliente

**Pasos**:

1. [ ] Seleccionar cliente "Juan Pérez"

2. [ ] Hacer clic en "Ver Historial" o "Detalle"
   - ✅ **Esperado**:
     - Lista de todas las ventas a crédito
     - Lista de todos los abonos
     - Fechas de cada transacción
     - Montos
     - Métodos de pago

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-507: Filtrar Clientes con Deuda

**Objetivo**: Ver solo clientes que deben

**Pasos**:

1. [ ] En módulo de Fiado, buscar filtro "Con Deuda" o "Pendiente"

2. [ ] Aplicar filtro
   - ✅ **Esperado**:
     - Muestra solo clientes con saldo > $0
     - Oculta clientes con saldo = $0

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 7️⃣ MÓDULO: REPORTES

### TC-601: Reporte de Ventas del Día

**Objetivo**: Ver ventas realizadas hoy

**Pre-requisitos**: Haber realizado al menos 2 ventas hoy

**Pasos**:

1. [ ] Presionar **F5** o ir a Dashboard/Reportes

2. [ ] Buscar sección "Ventas del Día" o "Ventas Hoy"
   - ✅ **Esperado**:
     - Muestra total de ventas de hoy
     - Número de transacciones
     - Desglose por método de pago:
       - Efectivo
       - Tarjeta
       - Digital
       - Crédito

3. [ ] Verificar que datos coinciden con ventas realizadas

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-602: Reporte por Rango de Fechas

**Objetivo**: Generar reporte de ventas entre dos fechas

**Pasos**:

1. [ ] Buscar selector de fechas o "Reporte Personalizado"

2. [ ] Seleccionar:
   - **Fecha inicio**: Hace 7 días
   - **Fecha fin**: Hoy

3. [ ] Hacer clic en "Generar Reporte" o "Consultar"
   - ✅ **Esperado**:
     - Muestra todas las ventas del período
     - Total general
     - Desglose por día
     - Gráfica de tendencia (si existe)

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-603: Productos Más Vendidos

**Objetivo**: Ver ranking de productos con más ventas

**Pasos**:

1. [ ] Buscar sección "Top Productos" o "Más Vendidos"
   - ✅ **Esperado**:
     - Lista de productos ordenados por cantidad vendida
     - Muestra cantidad de cada uno
     - Muestra ingresos generados por cada producto

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-604: Indicadores (KPIs) del Dashboard

**Objetivo**: Verificar métricas principales

**Pasos**:

1. [ ] Ir a Dashboard principal

2. [ ] Verificar que muestra KPIs:
   - ✅ **Ventas Totales del Día/Mes**
   - ✅ **Número de Transacciones**
   - ✅ **Ticket Promedio** (Venta promedio)
   - ✅ **Productos con Stock Bajo**
   - ✅ **Clientes con Deuda Activa**

3. [ ] Verificar que valores son coherentes

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 8️⃣ FLUJOS COMPLETOS END-TO-END

### TC-701: Flujo Completo - Día de Operación

**Objetivo**: Simular un día completo de operación

**Escenario**: Turno completo desde apertura hasta cierre

**Pasos**:

1. [ ] **INICIO DEL DÍA**

   a. [ ] Abrir caja con $100.000

2. [ ] **VENTAS MATUTINAS**

   a. [ ] Venta 1: 2 Coca Colas + 1 kg Plátano = $10.500 (efectivo)

   b. [ ] Venta 2: 1 Camiseta M = $25.000 (tarjeta)

   c. [ ] Venta 3: Venta a crédito a "Juan Pérez" = $15.000

3. [ ] **GESTIÓN DE INVENTARIO**

   a. [ ] Ajustar stock: +30 unidades Coca Cola (compra nueva)

   b. [ ] Ajustar stock: -2 unidades producto dañado

4. [ ] **GASTOS**

   a. [ ] Registrar gasto: $10.000 (insumos de limpieza)

5. [ ] **VENTAS VESPERTINAS**

   a. [ ] Venta 4: $8.000 (Nequi)

   b. [ ] Venta 5: $12.000 con 10% descuento = $10.800 (efectivo)

6. [ ] **ABONO DE CLIENTE**

   a. [ ] Cliente "Juan Pérez" abona $5.000

7. [ ] **CIERRE DEL DÍA**

   a. [ ] Cerrar caja y hacer arqueo

   b. [ ] Verificar totales:
      - Ventas totales
      - Efectivo en caja
      - Gastos
      - Créditos pendientes

8. [ ] **REPORTES**

   a. [ ] Ver reporte del día

   b. [ ] Verificar productos más vendidos

**Verificaciones finales**:
- ✅ Todos los procesos completados sin errores
- ✅ Stock actualizado correctamente
- ✅ Caja cuadrada
- ✅ Reportes coherentes

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-702: Flujo de Recuperación de Stock

**Objetivo**: Proceso completo de reabastecimiento

**Pasos**:

1. [ ] Identificar producto con stock bajo (< 10 unidades)

2. [ ] Crear nota de compra (si aplica)

3. [ ] Ajustar stock: Agregar unidades compradas

4. [ ] Registrar gasto de compra en caja

5. [ ] Verificar:
   - ✅ Stock actualizado
   - ✅ Gasto registrado
   - ✅ Producto ya no aparece en "Stock Bajo"

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 9️⃣ PRUEBAS DE USABILIDAD

### TC-801: Navegación con Teclado

**Objetivo**: Verificar que atajos funcionan

**Pasos**:

1. [ ] Presionar F1 → ✅ Va a POS
2. [ ] Presionar F2 → ✅ Va a Inventario
3. [ ] Presionar F3 → ✅ Va a Fiado
4. [ ] Presionar F4 → ✅ Va a Caja
5. [ ] Presionar F5 → ✅ Va a Reportes
6. [ ] Presionar F6 → ✅ Va a Configuración (si existe)

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-802: Responsive - Tablet

**Objetivo**: Verificar que funciona en tablet

**Pre-requisitos**: Dispositivo tablet o emulador

**Pasos**:

1. [ ] Abrir sistema en tablet o cambiar vista a tablet (DevTools)

2. [ ] Navegar por todos los módulos
   - ✅ **Esperado**:
     - Elementos se ajustan al tamaño
     - No hay desbordamiento horizontal
     - Botones son táctiles (tamaño adecuado)

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-803: Rendimiento - Listados Grandes

**Objetivo**: Sistema responde bien con muchos datos

**Pasos**:

1. [ ] Ir a Inventario con 50+ productos
   - ✅ **Esperado**: Carga en < 2 segundos

2. [ ] Usar búsqueda con 100+ resultados
   - ✅ **Esperado**: Filtrado instantáneo (< 500ms)

3. [ ] Generar reporte de mes completo
   - ✅ **Esperado**: Genera en < 5 segundos

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 🔟 PRUEBAS DE SEGURIDAD (UI)

### TC-901: Acceso Sin Autenticación

**Objetivo**: Verificar que rutas están protegidas

**Pasos**:

1. [ ] Hacer logout del sistema

2. [ ] Intentar navegar directamente a:
   - `https://nexopos.cloution.cloud/pos`
   - `https://nexopos.cloution.cloud/inventory`
   - `https://nexopos.cloution.cloud/cash-register`

3. [ ] Para cada ruta:
   - ✅ **Esperado**: Redirige automáticamente a login

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

### TC-902: Expiración de Sesión

**Objetivo**: Sesión expira después de inactividad

**Pasos**:

1. [ ] Iniciar sesión

2. [ ] Dejar sistema inactivo por 30+ minutos

3. [ ] Intentar hacer una acción (agregar producto, etc.)
   - ✅ **Esperado**:
     - Mensaje: "Sesión expirada"
     - Redirige a login

**Resultado**: ☐ PASS  ☐ FAIL
**Notas**: ___________________________________________

---

## 📊 RESUMEN DE EJECUCIÓN

### Resultados Generales:

| Módulo | Total Casos | Pasados | Fallados | % Éxito |
|--------|-------------|---------|----------|---------|
| Autenticación | 4 | ___ | ___ | ___% |
| Productos | 8 | ___ | ___ | ___% |
| Inventario | 5 | ___ | ___ | ___% |
| POS | 15 | ___ | ___ | ___% |
| Caja | 8 | ___ | ___ | ___% |
| Crédito | 7 | ___ | ___ | ___% |
| Reportes | 4 | ___ | ___ | ___% |
| E2E | 2 | ___ | ___ | ___% |
| Usabilidad | 3 | ___ | ___ | ___% |
| Seguridad | 2 | ___ | ___ | ___% |
| **TOTAL** | **58** | **___** | **___** | **___%** |

---

## 🐛 DEFECTOS ENCONTRADOS

### Formato de Reporte de Defectos:

**ID**: DEF-001
**Módulo**: _____________
**Caso de Prueba**: TC-___
**Severidad**: ☐ Crítica  ☐ Alta  ☐ Media  ☐ Baja
**Descripción**: _______________________________________
**Pasos para Reproducir**:
1. _____________
2. _____________
3. _____________

**Resultado Esperado**: _____________
**Resultado Actual**: _____________
**Screenshot**: (adjuntar si es posible)
**Navegador/Dispositivo**: _____________

---

**ID**: DEF-002
**Módulo**: _____________
**Caso de Prueba**: TC-___
**Severidad**: ☐ Crítica  ☐ Alta  ☐ Media  ☐ Baja
**Descripción**: _______________________________________

---

(Agregar más según sea necesario)

---

## ✅ CRITERIOS DE ACEPTACIÓN

El sistema está listo para producción si:

- [ ] ≥ 95% de casos críticos pasan (Autenticación, POS, Caja)
- [ ] ≥ 90% de casos totales pasan
- [ ] 0 defectos de severidad crítica sin resolver
- [ ] ≤ 2 defectos de severidad alta sin resolver
- [ ] Flujo E2E completo funciona sin errores
- [ ] Rendimiento aceptable en todas las operaciones

---

## 📝 OBSERVACIONES GENERALES

_Espacio para notas generales sobre la ejecución de pruebas:_

___________________________________________
___________________________________________
___________________________________________

---

## 📅 FIRMA Y APROBACIÓN

**Ejecutado por**: ________________
**Fecha**: ________________
**Firma**: ________________

**Revisado por**: ________________
**Fecha**: ________________
**Firma**: ________________

**Estado Final**: ☐ APROBADO  ☐ RECHAZADO  ☐ REQUIERE CORRECCIONES

---

**Fin del Plan de Pruebas UI**
