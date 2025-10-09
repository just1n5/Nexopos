import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Camera, Keyboard, Package, DollarSign, Hash, Barcode, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

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
    pricePerGram: ''
  })

  const [identifierType, setIdentifierType] = useState<IdentifierType>('both')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null)
  const scannerDivId = 'product-barcode-scanner'
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

    if (formData.saleType === 'weight' && (!formData.pricePerGram || parseFloat(formData.pricePerGram) <= 0)) {
      return false
    }

    return true
  }

  // Iniciar escáner
  const startBarcodeScanner = async () => {
    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(scannerDivId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: false
        })
      }

      const onScanSuccess = (decodedText: string) => {
        updateField('barcode', decodedText)

        if ('vibrate' in navigator) {
          navigator.vibrate(200)
        }

        toast({
          title: "✓ Código escaneado",
          description: decodedText,
          variant: "default" as any
        })

        stopBarcodeScanner()
        setShowBarcodeScanner(false)
      }

      await html5QrcodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 }
        },
        onScanSuccess,
        undefined
      )

      setIsScanning(true)
    } catch (error) {
      console.error('Error al iniciar escáner:', error)
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara",
        variant: "destructive"
      })
      setShowBarcodeScanner(false)
    }
  }

  // Detener escáner
  const stopBarcodeScanner = async () => {
    if (html5QrcodeRef.current && isScanning) {
      try {
        await html5QrcodeRef.current.stop()
        setIsScanning(false)
      } catch (error) {
        console.error('Error al detener escáner:', error)
      }
    }
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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-3xl my-8"
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

      {/* Modal de Escáner de Código de Barras */}
      {showBarcodeScanner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => {
            stopBarcodeScanner()
            setShowBarcodeScanner(false)
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Barcode className="w-5 h-5" />
                    Escanear Código de Barras
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      stopBarcodeScanner()
                      setShowBarcodeScanner(false)
                    }}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Scanner view */}
                  {!isScanning && (
                    <div className="flex flex-col items-center gap-4">
                      <div id={scannerDivId} className="w-full aspect-video bg-black rounded-lg" />
                      <Button onClick={startBarcodeScanner} className="w-full">
                        <Camera className="w-4 h-4 mr-2" />
                        Activar Cámara
                      </Button>
                    </div>
                  )}

                  {isScanning && (
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <div id={scannerDivId} className="w-full aspect-video" />
                      <div className="absolute bottom-4 left-0 right-0 px-4">
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg mx-auto max-w-xs">
                          <p className="text-sm font-medium text-center text-gray-800">
                            📷 Enfoca el código de barras
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual input option */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">O ingrésalo manualmente:</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Ej: 7702004008886"
                        value={formData.barcode}
                        onChange={(e) => updateField('barcode', e.target.value)}
                        className="font-mono"
                      />
                      <Button
                        onClick={() => {
                          if (formData.barcode) {
                            stopBarcodeScanner()
                            setShowBarcodeScanner(false)
                          }
                        }}
                        disabled={!formData.barcode}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
