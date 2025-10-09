import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Keyboard, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/useToast'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual')
  const [manualCode, setManualCode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [scanSuccess, setScanSuccess] = useState(false)
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null)
  const scannerDivId = 'barcode-scanner-reader'
  const { toast } = useToast()

  // Verificar si hay cámara disponible
  useEffect(() => {
    if ('mediaDevices' in navigator && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const hasVideo = devices.some(device => device.kind === 'videoinput')
          setHasCamera(hasVideo)
        })
        .catch((err) => {
          console.error('Error al enumerar dispositivos:', err)
          setHasCamera(false)
        })
    }
  }, [])

  // Iniciar escáner de códigos de barras
  const startScanner = useCallback(async () => {
    if (!hasCamera) {
      setCameraError('No se detectó ninguna cámara en este dispositivo')
      setMode('manual')
      return
    }

    try {
      setCameraError(null)

      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(scannerDivId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false
        })
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        // Evitar escaneos duplicados
        if (decodedText === lastScannedCode) {
          return
        }

        setLastScannedCode(decodedText)
        setScanSuccess(true)

        // Vibrar si está disponible
        if ('vibrate' in navigator) {
          navigator.vibrate(200)
        }

        // Mostrar éxito visual
        toast({
          title: "✓ Código detectado",
          description: `${decodedText}`,
          variant: "default" as any
        })

        // Detener escáner y enviar código
        setTimeout(async () => {
          await stopScanner()
          onScan(decodedText)
          onClose()
        }, 500)
      }

      await html5QrcodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 16/9
        },
        qrCodeSuccessCallback,
        undefined
      )

      setIsScanning(true)
    } catch (error: any) {
      console.error('Error al iniciar el escáner:', error)
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos.')
      setMode('manual')

      toast({
        title: "Error al acceder a la cámara",
        description: "Por favor, verifica los permisos de la cámara en tu navegador",
        variant: "destructive"
      })
    }
  }, [hasCamera, lastScannedCode, onScan, onClose, toast])

  // Detener escáner
  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current && isScanning) {
      try {
        await html5QrcodeRef.current.stop()
        setIsScanning(false)
      } catch (error) {
        console.error('Error al detener el escáner:', error)
      }
    }
  }, [isScanning])

  // Cambiar modo
  useEffect(() => {
    if (mode === 'camera') {
      startScanner()
    } else {
      stopScanner()
    }

    return () => {
      if (mode === 'camera') {
        stopScanner()
      }
    }
  }, [mode, startScanner, stopScanner])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop()
          .catch((err) => console.error('Error al limpiar escáner:', err))
      }
    }
  }, [])

  // Manejar escaneo manual
  const handleManualScan = () => {
    if (manualCode.trim()) {
      // Vibrar si está disponible
      if ('vibrate' in navigator) {
        navigator.vibrate(200)
      }

      onScan(manualCode.trim())
      setManualCode('')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-2 shadow-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <span>Escanear Código</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Selector de modo */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={mode === 'manual' ? 'default' : 'outline'}
                  className="flex-1 h-12"
                  onClick={() => setMode('manual')}
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Manual
                </Button>
                <Button
                  variant={mode === 'camera' ? 'default' : 'outline'}
                  className="flex-1 h-12"
                  onClick={() => setMode('camera')}
                  disabled={!hasCamera}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {hasCamera ? 'Cámara' : 'Sin Cámara'}
                </Button>
              </div>

              {/* Modo manual */}
              {mode === 'manual' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Código de Barras
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: 7702004008886"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                      className="h-12 text-base font-mono"
                      autoFocus
                    />
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Ingresa el código manualmente o usa un lector USB
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full h-12 text-base font-medium"
                    onClick={handleManualScan}
                    disabled={!manualCode.trim()}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Buscar Producto
                  </Button>
                </motion.div>
              )}

              {/* Modo cámara */}
              {mode === 'camera' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Escáner */}
                  <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-gray-200">
                    <div
                      id={scannerDivId}
                      className="w-full aspect-video"
                    />

                    {/* Indicador de cámara activa */}
                    {isScanning && !scanSuccess && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-4 right-4 z-10"
                      >
                        <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full shadow-lg">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                          <span className="text-xs font-medium">Cámara Activa</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Overlay de éxito */}
                    {scanSuccess && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-10"
                      >
                        <div className="bg-white rounded-full p-4 shadow-2xl">
                          <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                      </motion.div>
                    )}

                    {/* Guía de escaneo animada */}
                    {isScanning && !scanSuccess && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                        >
                          {/* Marco de guía */}
                          <div className="relative w-64 h-32">
                            {/* Esquinas del marco */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

                            {/* Línea de escaneo animada */}
                            <motion.div
                              animate={{ y: [0, 120, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="absolute left-0 right-0 h-0.5 bg-primary shadow-lg"
                              style={{ top: 0 }}
                            />
                          </div>
                        </motion.div>

                        {/* Mensaje de instrucción */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-4 left-0 right-0 px-4 z-10"
                        >
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg mx-auto max-w-xs">
                            <p className="text-sm font-medium text-center text-gray-800">
                              📷 Coloca el código dentro del marco
                            </p>
                            <p className="text-xs text-center text-gray-600 mt-1">
                              Asegúrate de tener buena iluminación
                            </p>
                          </div>
                        </motion.div>
                      </>
                    )}

                    {/* Error de cámara */}
                    {cameraError && (
                      <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-6 z-10">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                          <p className="text-white text-sm">{cameraError}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Alert className="border-amber-200 bg-amber-50">
                    <Camera className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Consejo:</strong> Mantén el código estable y bien iluminado para mejor lectura
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
