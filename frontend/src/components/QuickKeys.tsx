import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Plus,
  Settings,
  X,
  Check,
  Search,
  Star,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { useInventoryStore } from '@/stores/inventoryStore'
import { usePOSStore } from '@/stores/posStore'
import { useToast } from '@/hooks/useToast'
import type { Product } from '@/types'

interface QuickKey {
  id: string
  productId: string
  product: Product
  color: string
  position: number
}

interface QuickKeysProps {
  onProductSelect?: (product: Product) => void
  columns?: number
  rows?: number
}

const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500'
]

export default function QuickKeys({ 
  onProductSelect,
  columns = 4,
  rows = 3
}: QuickKeysProps) {
  const [quickKeys, setQuickKeys] = useState<QuickKey[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { products } = useInventoryStore()
  const { addToCart } = usePOSStore()
  const { toast } = useToast()
  
  const totalSlots = columns * rows
  
  // Cargar teclas rápidas desde localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('nexopos_quickkeys')
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys)
        // Actualizar con productos actuales
        const updatedKeys = parsed.map((key: QuickKey) => ({
          ...key,
          product: products.find(p => p.id === key.productId) || key.product
        })).filter((key: QuickKey) => key.product)
        setQuickKeys(updatedKeys)
      } catch (error) {
        console.error('Error loading quick keys:', error)
      }
    } else {
      // Configurar teclas rápidas por defecto con los productos más populares
      const popularProducts = products
        .filter(p => p.isActive)
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, Math.min(6, totalSlots))
      
      const defaultKeys = popularProducts.map((product, index) => ({
        id: `key-${Date.now()}-${index}`,
        productId: product.id,
        product,
        color: COLORS[index % COLORS.length],
        position: index
      }))
      
      setQuickKeys(defaultKeys)
    }
  }, [products, totalSlots])
  
  // Guardar teclas rápidas en localStorage
  const saveQuickKeys = (keys: QuickKey[]) => {
    setQuickKeys(keys)
    localStorage.setItem('nexopos_quickkeys', JSON.stringify(keys))
  }
  
  // Manejar selección de producto
  const handleProductClick = (quickKey: QuickKey) => {
    if (isEditing) {
      // Si está en modo edición, abrir selector para reemplazar
      setSelectedPosition(quickKey.position)
      setShowProductSelector(true)
    } else {
      // Si no está en modo edición, agregar al carrito
      const product = quickKey.product
      addToCart(product)
      
      if (onProductSelect) {
        onProductSelect(product)
      }
      
      toast({
        title: "Producto agregado",
        description: `${product.name} agregado al carrito`,
        variant: "default"
      })
    }
  }
  
  // Agregar tecla rápida
  const handleAddQuickKey = (position: number) => {
    setSelectedPosition(position)
    setShowProductSelector(true)
  }
  
  // Seleccionar producto para tecla rápida
  const handleSelectProduct = (product: Product) => {
    if (selectedPosition === null) return
    
    const existingKey = quickKeys.find(k => k.position === selectedPosition)
    
    if (existingKey) {
      // Actualizar tecla existente
      const updatedKeys = quickKeys.map(key => 
        key.position === selectedPosition
          ? {
              ...key,
              productId: product.id,
              product,
              color: key.color || COLORS[selectedPosition % COLORS.length]
            }
          : key
      )
      saveQuickKeys(updatedKeys)
    } else {
      // Crear nueva tecla
      const newKey: QuickKey = {
        id: `key-${Date.now()}`,
        productId: product.id,
        product,
        color: COLORS[selectedPosition % COLORS.length],
        position: selectedPosition
      }
      saveQuickKeys([...quickKeys, newKey])
    }
    
    setShowProductSelector(false)
    setSelectedPosition(null)
    
    toast({
      title: "Tecla rápida actualizada",
      description: `${product.name} agregado a posición ${selectedPosition + 1}`,
      variant: "default"
    })
  }
  
  // Eliminar tecla rápida
  const handleRemoveQuickKey = (position: number) => {
    const updatedKeys = quickKeys.filter(key => key.position !== position)
    saveQuickKeys(updatedKeys)
    
    toast({
      title: "Tecla rápida eliminada",
      variant: "default"
    })
  }
  
  // Filtrar productos para el selector
  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase()
    const isAlreadyQuickKey = quickKeys.some(k => k.productId === product.id)
    
    return product.isActive &&
           !isAlreadyQuickKey &&
           (product.name.toLowerCase().includes(query) ||
            product.sku?.toLowerCase().includes(query))
  })
  
  // Obtener productos más vendidos para sugerencias
  const topSellingProducts = products
    .filter(p => p.isActive && !quickKeys.some(k => k.productId === p.id))
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 5)

  return (
    <>
      {/* Panel de teclas rápidas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Teclas Rápidas</CardTitle>
            <Button
              variant={isEditing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Listo
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-1" />
                  Editar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div 
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`
            }}
          >
            {Array.from({ length: totalSlots }).map((_, index) => {
              const quickKey = quickKeys.find(k => k.position === index)
              
              if (quickKey) {
                return (
                  <motion.div
                    key={`slot-${index}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      className={`h-20 w-full p-2 relative overflow-hidden transition-all ${
                        isEditing ? 'ring-2 ring-offset-2 ring-primary/50' : ''
                      }`}
                      onClick={() => handleProductClick(quickKey)}
                    >
                      <div className={`absolute inset-0 ${quickKey.color} opacity-10`} />
                      
                      {isEditing && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 z-10"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveQuickKey(index)
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                      
                      <div className="flex flex-col items-center justify-center text-center">
                        <Package className="w-6 h-6 mb-1 text-gray-600" />
                        <span className="text-xs font-medium line-clamp-2">
                          {quickKey.product.name}
                        </span>
                        <span className="text-xs font-bold text-primary mt-1">
                          {formatCurrency(quickKey.product.price)}
                        </span>
                      </div>
                    </Button>
                  </motion.div>
                )
              }
              
              // Slot vacío
              return (
                <Button
                  key={`empty-${index}`}
                  variant="outline"
                  className={`h-20 w-full border-dashed ${
                    isEditing ? 'border-2 hover:border-primary' : 'opacity-50 cursor-default'
                  }`}
                  onClick={() => isEditing && handleAddQuickKey(index)}
                  disabled={!isEditing}
                >
                  {isEditing && (
                    <Plus className="w-6 h-6 text-gray-400" />
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Modal de selección de producto */}
      <AnimatePresence>
        {showProductSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowProductSelector(false)
              setSelectedPosition(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0 h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Seleccionar Producto</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowProductSelector(false)
                        setSelectedPosition(null)
                      }}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Búsqueda */}
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Buscar producto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-auto">
                  {/* Productos más vendidos */}
                  {searchQuery === '' && topSellingProducts.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Productos más vendidos
                        </span>
                      </div>
                      <div className="space-y-2">
                        {topSellingProducts.map(product => (
                          <Card
                            key={product.id}
                            className="cursor-pointer hover:shadow-md transition-all"
                            onClick={() => handleSelectProduct(product)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {product.sku} • Stock: {product.stock}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary">
                                    {formatCurrency(product.price)}
                                  </p>
                                  {product.salesCount && (
                                    <Badge variant="outline" className="text-xs">
                                      <Star className="w-3 h-3 mr-1" />
                                      {product.salesCount} ventas
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de productos */}
                  <div className="space-y-2">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No se encontraron productos</p>
                      </div>
                    ) : (
                      filteredProducts.map(product => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:shadow-md transition-all"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {product.sku} • Stock: {product.stock}
                                  </p>
                                </div>
                              </div>
                              <p className="font-bold text-primary">
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}



