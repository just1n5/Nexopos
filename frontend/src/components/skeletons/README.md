# Skeleton Loading Components

Componentes de skeleton loading para mejorar la experiencia de usuario mientras se cargan datos.

## Componentes Disponibles

### 1. Skeleton (Base)
Componente base para crear skeletons personalizados.

```tsx
import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-4 w-full" />
<Skeleton className="h-8 w-32 rounded-full" />
```

### 2. TableSkeleton
Skeleton para tablas de datos.

```tsx
import TableSkeleton from '@/components/skeletons/TableSkeleton'

// Con valores por defecto (5 rows, 5 columns)
<TableSkeleton />

// Personalizado
<TableSkeleton rows={8} columns={7} />
```

**Ejemplo de uso en InventoryView:**
```tsx
{isLoading ? (
  <TableSkeleton rows={8} columns={7} />
) : (
  <table>...</table>
)}
```

### 3. ProductCardSkeleton
Skeleton para tarjetas de productos.

```tsx
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton'

<div className="grid grid-cols-3 gap-4">
  {Array.from({ length: 6 }).map((_, i) => (
    <ProductCardSkeleton key={i} />
  ))}
</div>
```

**Ejemplo de uso en POSView:**
```tsx
{isLoading ? (
  <div className="grid grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
) : (
  products.map(product => <ProductCard {...product} />)
)}
```

### 4. CardSkeleton
Skeleton genérico para tarjetas.

```tsx
import CardSkeleton from '@/components/skeletons/CardSkeleton'

<div className="grid grid-cols-2 gap-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <CardSkeleton key={i} />
  ))}
</div>
```

**Ejemplo de uso en CreditView:**
```tsx
{isLoading ? (
  <div className="grid grid-cols-2 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
) : (
  credits.map(credit => <CreditCard {...credit} />)
)}
```

### 5. DashboardSkeleton
Skeleton completo para el dashboard.

```tsx
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

{isLoading ? (
  <DashboardSkeleton />
) : (
  <DashboardContent />
)}
```

## Crear Skeletons Personalizados

Puedes crear tus propios skeletons usando el componente base:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function CustomSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Content */}
      <Skeleton className="h-32 w-full" />

      {/* Footer */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  )
}
```

## Mejores Prácticas

1. **Usar siempre skeletons cuando hay loading:**
   ```tsx
   {isLoading ? <Skeleton /> : <ActualContent />}
   ```

2. **Match the layout:** El skeleton debe tener el mismo tamaño y forma del contenido real.

3. **Usar la cantidad correcta de items:**
   ```tsx
   {isLoading ? (
     Array.from({ length: expectedCount }).map((_, i) => <Skeleton key={i} />)
   ) : (
     items.map(item => <Item {...item} />)
   )}
   ```

4. **Combinar con animaciones de Framer Motion para transiciones suaves:**
   ```tsx
   <AnimatePresence mode="wait">
     {isLoading ? (
       <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
         <Skeleton />
       </motion.div>
     ) : (
       <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
         <Content />
       </motion.div>
     )}
   </AnimatePresence>
   ```

## Personalización de Colores

El skeleton usa colores de Tailwind que se adaptan al dark mode:

```tsx
// Light mode: bg-gray-200
// Dark mode: bg-gray-700

// Personalizar:
<Skeleton className="bg-blue-200 dark:bg-blue-700" />
```

## Animación

La animación pulse está incluida por defecto. Para desactivarla:

```tsx
<div className="rounded-md bg-gray-200">
  {/* Sin animate-pulse */}
</div>
```
