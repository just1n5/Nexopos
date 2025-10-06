# Instrucciones para Actualizar POSView con Soporte de Venta por Peso

## Cambios Necesarios en frontend/src/views/POSView.tsx

### 1. Importar el nuevo componente

Agrega esta importación al principio del archivo, junto con las otras importaciones:

```typescript
import WeightInput from '@/components/WeightInput'
```

### 2. Agregar estados para el modal de peso

Dentro del componente POSView, después de la línea con `const [isProcessingSale, setIsProcessingSale] = useState(false)`, agrega:

```typescript
const [showWeightModal, setShowWeightModal] = useState(false)
const [selectedWeightProduct, setSelectedWeightProduct] = useState<any>(null)
```

### 3. Modificar la función handleProductClick

Busca la función que maneja el click en un producto (probablemente llamada algo como `handleAddProduct` o se encuentra inline en el onClick del producto).

ANTES:
```typescript
const handleProductClick = (product: any) => {
  const existing = cart.find(item => item.product.id === product.id)
  if (existing) {
    updateQuantity(product.id, existing.quantity + 1)
  } else {
    addToCart(product)
  }
}
```

DESPUÉS:
```typescript
const handleProductClick = (product: any) => {
  // Si el producto se vende por peso, mostrar modal especial
  if (product.saleType === 'WEIGHT' && product.pricePerGram) {
    setSelectedWeightProduct(product)
    setShowWeightModal(true)
    return
  }

  // Para productos normales (por unidad)
  const existing = cart.find(item => item.product.id === product.id)
  if (existing) {
    updateQuantity(product.id, existing.quantity + 1)
  } else {
    addToCart(product)
  }
}
```

### 4. Agregar manejador para confirmar peso

Agrega esta nueva función después de `handleProductClick`:

```typescript
const handleWeightConfirm = (weightInGrams: number, total: number) => {
  if (!selectedWeightProduct) return

  // Para productos por peso, la cantidad es el peso en gramos
  // El precio ya viene calculado (peso × precio por gramo)
  addToCart({
    ...selectedWeightProduct,
    quantity: weightInGrams, // Gramos
    price: total, // Total calculado
    unitPrice: selectedWeightProduct.pricePerGram,
    isWeightProduct: true,
  })

  setShowWeightModal(false)
  setSelectedWeightProduct(null)
  
  toast({
    title: "Producto agregado",
    description: `${selectedWeightProduct.name} - ${weightInGrams}g`,
    variant: "success" as any
  })
}
```

### 5. Agregar el modal al renderizado

Al final del componente, justo antes del cierre del último `</div>` y después del modal de Receipt, agrega:

```typescript
{/* Modal de Peso */}
<AnimatePresence>
  {showWeightModal && selectedWeightProduct && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => {
        setShowWeightModal(false)
        setSelectedWeightProduct(null)
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <WeightInput
          productName={selectedWeightProduct.name}
          pricePerGram={selectedWeightProduct.pricePerGram}
          onConfirm={handleWeightConfirm}
          onCancel={() => {
            setShowWeightModal(false)
            setSelectedWeightProduct(null)
          }}
        />
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### 6. Actualizar la visualización del carrito (opcional)

Si quieres mostrar los productos por peso de manera especial en el carrito, busca donde se renderizan los items del carrito y agrega esta lógica:

```typescript
// En la parte donde se muestra cada item del carrito
{cartItem.isWeightProduct ? (
  <span className="text-xs text-gray-500">
    {cartItem.quantity}g × {formatCurrency(cartItem.unitPrice)}/g
  </span>
) : (
  <span className="text-sm">
    {cartItem.quantity} × {formatCurrency(cartItem.unitPrice)}
  </span>
)}
```

## Verificación

Después de hacer estos cambios:

1. Reinicia el servidor de desarrollo si es necesario
2. Ve al POS
3. Busca una fruta o verdura (ej: "Tomate")
4. Click en el producto
5. Deberías ver el modal de peso
6. Ingresa un peso (ej: 500)
7. El sistema debe calcular el total automáticamente
8. Al confirmar, el producto debe agregarse al carrito con el peso y precio correcto

## Notas Importantes

- El cálculo del cambio YA ESTÁ funcionando correctamente en el código actual
- El descuento de inventario YA ESTÁ implementado y funcionando
- Solo necesitas agregar el soporte para productos por peso
- Los productos normales seguirán funcionando exactamente igual

## Ubicación de los Cambios

Todos los cambios se hacen en UN SOLO archivo:
📁 frontend/src/views/POSView.tsx

El nuevo componente ya está creado en:
📁 frontend/src/components/WeightInput.tsx
