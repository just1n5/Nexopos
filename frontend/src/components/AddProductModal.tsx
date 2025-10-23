import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Camera, Package, DollarSign, Hash, Barcode, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/useToast'
import BarcodeScanner from './BarcodeScanner'

interface AddProductModalProps {
  onClose: () => void
  onSave: (productData: NewProductData) => Promise<void>
}

export interface NewProductData {
  name: string
  description: string
  sku?: string
  barcode?: string
  basePrice: string
  stock: string
  saleType: 'unit' | 'weight'
  pricePerGram?: string
  tax?: string
  unitCost?: string
  costPerGram?: string
  weightUnit?: 'GRAM' | 'KILO' | 'POUND'
}

type IdentifierType = 'sku' | 'barcode' | 'both'

export default function AddProductModal({ onClose, onSave }: AddProductModalProps) {
  const [formData, setFormData] = useState<NewProductData>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    basePrice: '',
    stock: '0',
    saleType: 'unit',
    pricePerGram: '',
    tax: '19',
    unitCost: '',
    costPerGram: '',
    weightUnit: 'KILO'
  })

  const [identifierType, setIdentifierType] = useState<IdentifierType>('both')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const updateField = (field: keyof NewProductData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Validar el formulario
  const isFormValid = () => {
    if (!formData.name.trim()) return false
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) return false

    if (identifierType === 'sku' || identifierType === 'both') {
      if (!formData.sku?.trim()) return false
    }
    if (identifierType === 'barcode' || identifierType === 'both') {
      if (!formData.barcode?.trim()) return false
    }

    if (formData.saleType === 'weight') {
      if (!formData.pricePerGram || parseFloat(formData.pricePerGram) <= 0) return false
      if (!formData.costPerGram || parseFloat(formData.costPerGram) <= 0) return false
    } else {
      if (!formData.unitCost || parseFloat(formData.unitCost) <= 0) return false
    }

    return true
  }

  // Manejar escaneo de código de barras
  const handleBarcodeScanned = (barcode: string) => {
    updateField('barcode', barcode)
    setShowBarcodeScanner(false)
    toast({
      title: "✓ Código escaneado",
      description: barcode,
      variant: "default" as any
    })
  }

  // Manejar guardado
  const handleSave = async () => {
    if (!isFormValid()) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Preparar datos según el tipo de identificador seleccionado
      const dataToSave: NewProductData = { ...formData }

      if (identifierType === 'sku') {
        delete dataToSave.barcode
      } else if (identifierType === 'barcode') {
        delete dataToSave.sku
      }

      await onSave(dataToSave)
      onClose()
    } catch (error) {
      console.error('Error guardando producto:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el producto",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-3xl my-8 mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-2 shadow-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Agregar Nuevo Producto</h2>
                    <p className="text-sm text-muted-foreground font-normal">Completa la información del producto</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 hover:bg-destructive/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Tipo de Identificador */}
              <div>
                <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  Identificadores del Producto *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={identifierType === 'sku' ? 'default' : 'outline'}
                    className="h-12"
                    onClick={() => setIdentifierType('sku')}
                  >
                    <Hash className="w-4 h-4 mr-2" />
                    Solo SKU
                  </Button>
                  <Button
                    type="button"
                    variant={identifierType === 'barcode' ? 'default' : 'outline'}
                    className="h-12"
                    onClick={() => setIdentifierType('barcode')}
                  >
                    <Barcode className="w-4 h-4 mr-2" />
                    Solo Código
                  </Button>
                  <Button
                    type="button"
                    variant={identifierType === 'both' ? 'default' : 'outline'}
                    className="h-12"
                    onClick={() => setIdentifierType('both')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Ambos
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {identifierType === 'sku' && 'Solo se usará SKU para identificar el producto'}
                  {identifierType === 'barcode' && 'Solo se usará código de barras para identificar el producto'}
                  {identifierType === 'both' && 'Se usarán ambos identificadores (recomendado)'}
                </p>
              </div>

              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                  <Package className="w-4 h-4" />
                  Información Básica
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Producto *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Ej: Camiseta Básica Blanca"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Ej: Camiseta de algodón 100%, talla M"
                    className="h-11"
                  />
                </div>
              </div>

              {/* Identificadores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU */}
                {(identifierType === 'sku' || identifierType === 'both') && (
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      SKU (Código Interno) *
                    </label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => updateField('sku', e.target.value.toUpperCase())}
                      placeholder="Ej: CAM-BLA-001"
                      className="h-11 font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Código único para uso interno</p>
                  </div>
                )}

                {/* Código de Barras */}
                {(identifierType === 'barcode' || identifierType === 'both') && (
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-gray-500" />
                      Código de Barras *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.barcode}
                        onChange={(e) => updateField('barcode', e.target.value)}
                        placeholder="Ej: 7702004008886"
                        className="h-11 font-mono flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowBarcodeScanner(true)}
                        className="h-11 px-3"
                        title="Escanear con cámara"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Código de barras del producto</p>
                  </div>
                )}
              </div>

              {/* Tipo de Venta y Precio */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                  <DollarSign className="w-4 h-4" />
                  Precio y Stock
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Venta *</label>
                  <select
                    value={formData.saleType}
                    onChange={(e) => updateField('saleType', e.target.value as 'unit' | 'weight')}
                    className="w-full h-11 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="unit">Por Unidad</option>
                    <option value="weight">Por Peso (gramos)</option>
                  </select>
                </div>

                {/* Precios de Venta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {formData.saleType === 'weight' ? 'Precio por Gramo *' : 'Precio Base *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step={formData.saleType === 'weight' ? '0.01' : '1'}
                        value={formData.saleType === 'weight' ? formData.pricePerGram : formData.basePrice}
                        onChange={(e) => updateField(formData.saleType === 'weight' ? 'pricePerGram' : 'basePrice', e.target.value)}
                        placeholder={formData.saleType === 'weight' ? '15.50' : '25000'}
                        className="h-11 pl-8"
                      />
                    </div>
                    {formData.saleType === 'weight' && (
                      <p className="text-xs text-muted-foreground mt-1">Precio por gramo. Ej: Si 1kg cuesta $15,500, ingrese 15.5</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {formData.saleType === 'weight' ? 'Stock Inicial (gramos)' : 'Stock Inicial'}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step={formData.saleType === 'weight' ? '0.001' : '1'}
                      value={formData.stock}
                      onChange={(e) => updateField('stock', e.target.value)}
                      placeholder={formData.saleType === 'weight' ? '1000' : '50'}
                      className="h-11"
                    />
                    {formData.saleType === 'weight' && (
                      <p className="text-xs text-muted-foreground mt-1">Ingrese el stock en gramos. Ej: 5kg = 5000g</p>
                    )}
                  </div>
                </div>

                {/* IVA */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    IVA (%) *
                  </label>
                  <select
                    value={formData.tax}
                    onChange={(e) => updateField('tax', e.target.value)}
                    className="w-full h-11 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="19">19% - IVA General</option>
                    <option value="5">5% - IVA Reducido</option>
                    <option value="0">0% - Exento</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tarifa de IVA según normativa colombiana
                  </p>
                </div>

                {/* Costos de Compra */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.saleType === 'unit' ? (
                    // Costo Unitario para productos por unidad
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Costo Unitario *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="1"
                          value={formData.unitCost}
                          onChange={(e) => updateField('unitCost', e.target.value)}
                          placeholder="20000"
                          className="h-11 pl-8"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Costo de compra por unidad</p>
                    </div>
                  ) : (
                    // Costo por peso para productos vendidos por peso
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Unidad de Peso para Costo *
                        </label>
                        <select
                          value={formData.weightUnit}
                          onChange={(e) => updateField('weightUnit', e.target.value as 'GRAM' | 'KILO' | 'POUND')}
                          className="w-full h-11 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="GRAM">Gramo</option>
                          <option value="KILO">Kilogramo</option>
                          <option value="POUND">Libra</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">Unidad en la que conoces el costo</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Costo por {formData.weightUnit === 'GRAM' ? 'Gramo' : formData.weightUnit === 'KILO' ? 'Kilogramo' : 'Libra'} *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.costPerGram}
                            onChange={(e) => updateField('costPerGram', e.target.value)}
                            placeholder={formData.weightUnit === 'KILO' ? '12000' : formData.weightUnit === 'POUND' ? '5400' : '12.00'}
                            className="h-11 pl-8"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.weightUnit === 'KILO' && 'Ej: Si compras a $12,000/kg, ingresa 12000'}
                          {formData.weightUnit === 'POUND' && 'Ej: Si compras a $5,400/lb, ingresa 5400'}
                          {formData.weightUnit === 'GRAM' && 'Ej: Si compras a $12/g, ingresa 12'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Resumen */}
              {formData.name && (identifierType === 'sku' ? formData.sku : identifierType === 'barcode' ? formData.barcode : formData.sku && formData.barcode) && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Producto listo:</strong> {formData.name}
                    {formData.sku && ` • SKU: ${formData.sku}`}
                    {formData.barcode && ` • Código: ${formData.barcode}`}
                  </AlertDescription>
                </Alert>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid() || isSaving}
                  className="flex-1 h-12 text-base font-medium"
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Guardar Producto
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSaving}
                  className="h-12"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Scanner de Código de Barras */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </AnimatePresence>
  )
}
