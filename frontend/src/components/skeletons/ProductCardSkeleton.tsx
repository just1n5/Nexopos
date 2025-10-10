import { Skeleton } from '@/components/ui/skeleton'

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Imagen */}
      <Skeleton className="w-full h-32 rounded-md" />

      {/* Nombre */}
      <Skeleton className="h-5 w-3/4" />

      {/* SKU */}
      <Skeleton className="h-4 w-1/2" />

      {/* Precio y Stock */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  )
}
