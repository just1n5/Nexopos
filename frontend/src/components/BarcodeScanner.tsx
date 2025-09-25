import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/useToast'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual')
  const [manualCode, setManualCode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  // Verificar si hay cámara disponible
  useEffect(() => {
    if ('mediaDevices' in navigator && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const hasVideo = devices.some(device => device.kind === 'videoinput')
        setHasCamera(hasVideo)
      })
    }
  }, [])

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    if (!hasCamera) {
      toast({
        title: "Cámara no disponible",
        description: "No se detectó ninguna cámara en este dispositivo",
        variant: "destructive"
      })
      setMode('manual')
      return
    }

    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        throw new Error('getUserMedia no está soportado en este navegador')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: "Error al acceder a la cámara",
        description: "Por favor, verifica los permisos de la cámara",
        variant: "destructive"
      })
      setMode('manual')
    }
  }, [hasCamera, toast])

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setIsScanning(false)
    }
  }, [])

  // Cambiar modo
  useEffect(() => {
    if (mode === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }
  }, [mode, startCamera, stopCamera])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Manejar escaneo manual
  const handleManualScan = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      setManualCode('')
      onClose()
    }
  }

  // Simulación de escaneo con cámara (en producción usar una librería como QuaggaJS o ZXing)
  const simulateCameraScan = () => {
    // Simulamos un escaneo exitoso después de 2 segundos
    setTimeout(() => {
      const mockBarcode = '7702004008886' // Código de barras de ejemplo
      toast({
        title: "Código detectado",
        description: `Código: ${mockBarcode}`,
        variant: "default"
      })
      onScan(mockBarcode)
      onClose()
    }, 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                Escanear Código de Barras
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Selector de modo */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={mode === 'manual' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setMode('manual')}
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Manual
                </Button>
                <Button
                  variant={mode === 'camera' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setMode('camera')}
                  disabled={!hasCamera}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Cámara
                </Button>
              </div>

              {/* Modo manual */}
              {mode === 'manual' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Ingresa el código de barras
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: 7702004008886"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                      className="mt-1"
                      autoFocus
                    />
                  </div>
                  
                  <Alert>
                    <AlertDescription>
                      Ingresa el código de barras manualmente o usa un lector USB conectado
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full"
                    onClick={handleManualScan}
                    disabled={!manualCode.trim()}
                  >
                    Buscar Producto
                  </Button>
                </div>
              )}

              {/* Modo cámara */}
              {mode === 'camera' && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay de escaneo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-white/50 w-64 h-32 relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                        
                        {isScanning && (
                          <motion.div
                            className="absolute top-0 left-0 right-0 h-0.5 bg-red-500"
                            animate={{
                              top: ['0%', '100%', '0%']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Mensaje de escaneo */}
                    {isScanning && (
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded">
                          Coloca el código de barras en el área marcada
                        </p>
                      </div>
                    )}
                  </div>

                  <Alert>
                    <AlertDescription>
                      Nota: En producción, esta función requiere una librería de escaneo de códigos de barras
                    </AlertDescription>
                  </Alert>

                  {/* Botón de simulación (solo para desarrollo) */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={simulateCameraScan}
                  >
                    Simular Escaneo Exitoso (Desarrollo)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}


