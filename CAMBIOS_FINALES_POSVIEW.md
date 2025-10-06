# Cambios Finales para POSView - Soporte de Venta por Peso

## Ya completado ✅
- Importación de WeightInput agregada
- Estados showWeightModal y selectedWeightProduct agregados

## Falta agregar estas 2 funciones

Busca en el archivo `POSView.tsx` después de la función `handleBarcodeScan` y ANTES del `return (` statement, agrega estas dos funciones:

```typescript
  // Manejar click en producto (agregar soporte para venta por peso)
  const handleProductClick = (product: any) => {
    // Si el producto se vende por peso, mostrar modal especial
    if (product.saleType === 'WEIGHT' && product.pricePerGram) {
      setSelectedWeightProduct(product)
      setShowWeightModal(true)
      return
    }

    // Para productos normales (por unidad)
    addToCart(product)
    toast({
      title: "Producto agregado",
      description: `${product.name} agregado al carrito`,
      variant: "default"
    })
  }

  // Confirmar venta por peso
  const handleWeightConfirm = (weightInGrams: number, total: number) => {
    if (!selectedWeightProduct) return

    // Para productos por peso, la cantidad es el peso en gramos
    // El precio ya viene calculado (peso × precio por gramo)
    addToCart({
      ...selectedWeightProduct,
      quantity: weightInGrams,
      price: total,
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

## Busca en el JSX donde se renderizan los productos

Busca un código similar a este (probablemente alrededor de la línea 400-600):

```tsx
{filteredProducts.map((product) => (
  <Card
    key={product.id}
    onClick={() => addToCart(product)}  // <-- ESTA LÍNEA CAMBIAR
    className="cursor-pointer hover:shadow-lg transition-shadow"
  >
```

Cambia SOLO el `onClick` por:

```tsx
onClick={() => handleProductClick(product)}
```

## Agrega el modal al final

Busca el final del componente, después del modal de `{showReceipt && lastSale && ...}` y ANTES del último `</div>`, agrega:

```tsx
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

## Verificación

Después de hacer estos cambios:
1. Guarda el archivo
2. El frontend debería recompilar automáticamente
3. Ve al POS en tu navegador
4. Busca "Tomate" o cualquier fruta/verdura
5. Haz click en el producto
6. Deberías ver el modal de peso

¡Listo! El sistema estará completo.
