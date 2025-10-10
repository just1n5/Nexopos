import { useRef, useState, useEffect } from 'react'
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

interface CameraDevice {
  deviceId: string
  label: string
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual')
  const [manualCode, setManualCode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null)
  const scannerDivId = 'barcode-scanner-reader'
  const { toast } = useToast()
  const processingRef = useRef(false)

  // Verificar cámaras disponibles y listarlas
  useEffect(() => {
    if ('mediaDevices' in navigator && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      // Primero solicitar permisos para obtener labels
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          // Detener el stream inmediatamente
          stream.getTracks().forEach(track => track.stop())

          // Ahora enumerar dispositivos con labels
          return navigator.mediaDevices.enumerateDevices()
        })
        .then((devices) => {
          const videoDevices = devices.filter(device => device.kind === 'videoinput')
          setHasCamera(videoDevices.length > 0)

          const cameraList: CameraDevice[] = videoDevices.map((device, index) => {
            // Crear label amigable
            let label = device.label || `Cámara ${index + 1}`

            // Detectar si es trasera o frontal
            const labelLower = label.toLowerCase()
            if (labelLower.includes('back') || labelLower.includes('rear') ||
                labelLower.includes('trasera') || labelLower.includes('environment')) {
              label = `📷 ${label} (Trasera)`
            } else if (labelLower.includes('front') || labelLower.includes('user') ||
                       labelLower.includes('frontal')) {
              label = `🤳 ${label} (Frontal)`
            }

            return {
              deviceId: device.deviceId,
              label
            }
          })

          setCameras(cameraList)
          console.log('Cámaras disponibles:', cameraList)

          // Seleccionar automáticamente la primera cámara trasera si existe
          const rearCamera = cameraList.find(cam =>
            cam.label.toLowerCase().includes('back') ||
            cam.label.toLowerCase().includes('rear') ||
            cam.label.toLowerCase().includes('trasera')
          )

          if (rearCamera) {
            setSelectedCameraId(rearCamera.deviceId)
            console.log('Cámara trasera preseleccionada:', rearCamera.label)
          } else if (cameraList.length > 0) {
            // Si no hay trasera, seleccionar la primera disponible
            setSelectedCameraId(cameraList[0].deviceId)
            console.log('Primera cámara seleccionada:', cameraList[0].label)
          }
        })
        .catch((err) => {
          console.error('Error al enumerar dispositivos:', err)
          setHasCamera(false)
        })
    }
  }, [])

  // Iniciar escáner de códigos de barras
  const startScanner = async () => {
    // Evitar múltiples inicializaciones simultáneas
    if (isInitializing || isScanning) {
      console.log('Scanner ya está inicializando o escaneando, saltando...')
      return
    }

    if (!hasCamera) {
      setCameraError('No se detectó ninguna cámara en este dispositivo')
      setMode('manual')
      return
    }

    if (!selectedCameraId) {
      setCameraError('Por favor selecciona una cámara')
      return
    }

    setIsInitializing(true)

    try {
      // Resetear estado de procesamiento
      processingRef.current = false
      setCameraError(null)

      console.log('Usando cámara seleccionada:', selectedCameraId)

      if (!html5QrcodeRef.current) {
        console.log('Creando instancia de Html5Qrcode...')
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
          verbose: true // Activar verbose para debugging
        })
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        console.log('Código detectado:', decodedText)

        // Evitar procesar si ya estamos procesando un código
        if (processingRef.current) {
          console.log('Ya procesando un código, ignorando...')
          return
        }

        // Evitar escaneos duplicados del mismo código
        if (decodedText === lastScannedCode) {
          console.log('Código ya procesado anteriormente, ignorando')
          return
        }

        // Marcar como procesando
        processingRef.current = true
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
          try {
            if (html5QrcodeRef.current) {
              const state = html5QrcodeRef.current.getState()
              console.log('Estado del scanner antes de detener:', state)
              if (state === 2) { // 2 = SCANNING
                console.log('Deteniendo scanner después de detección...')
                await html5QrcodeRef.current.stop()
                console.log('Scanner detenido después de detección')
              }
            }
            setIsScanning(false)
            setIsInitializing(false)
          } catch (err) {
            console.log('Error al detener (esperado si ya se detuvo):', err)
            setIsScanning(false)
            setIsInitializing(false)
          } finally {
            // Siempre enviar el código y cerrar
            onScan(decodedText)
            onClose()
          }
        }, 300)
      }

      console.log('Iniciando scanner con deviceId:', selectedCameraId)

      // Usar directamente el deviceId seleccionado por el usuario
      await html5QrcodeRef.current.start(
        { deviceId: { exact: selectedCameraId } },
        {
          fps: 10, // FPS reducido para dar más tiempo de procesamiento
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Área más grande para detectar desde más lejos
            const minEdgePercentage = 0.85 // 85% del área
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
            return {
              width: qrboxSize,
              height: Math.floor(qrboxSize * 0.5) // Mantener proporción para códigos de barras
            }
          },
          aspectRatio: 1.777778, // 16:9
          disableFlip: false,
          videoConstraints: {
            width: { ideal: 1920 },  // Resolución más alta
            height: { ideal: 1080 }
          }
        },
        qrCodeSuccessCallback,
        () => {
          // Error callback - no hacer nada, errores normales durante escaneo
        }
      )

      console.log('Scanner iniciado exitosamente')
      setIsScanning(true)
      setIsInitializing(false)

      // Intentar configurar autoenfoque después de iniciar
      try {
        // Esperar un momento para que el video se inicialice
        await new Promise(resolve => setTimeout(resolve, 500))

        const videoElement = document.querySelector(`#${scannerDivId} video`) as HTMLVideoElement
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream
          const videoTrack = stream.getVideoTracks()[0]

          // Verificar capacidades
          const capabilities = videoTrack.getCapabilities() as any
          console.log('Capacidades de la cámara:', capabilities)

          // Configurar constraints optimizadas para códigos cercanos
          const constraints: any = {
            advanced: []
          }

          // Autoenfoque continuo
          if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            constraints.advanced.push({ focusMode: 'continuous' })
            console.log('✓ Autoenfoque continuo habilitado')
          }

          // Distancia de enfoque para objetos cercanos (10-30cm)
          if (capabilities.focusDistance) {
            constraints.advanced.push({ focusDistance: 0.15 }) // ~15cm
            console.log('✓ Distancia de enfoque configurada: 15cm')
          }

          // Aplicar constraints si hay alguna
          if (constraints.advanced.length > 0) {
            await videoTrack.applyConstraints(constraints)
            console.log('✅ Autoenfoque optimizado para códigos cercanos')
          }
        }
      } catch (focusError) {
        console.log('⚠️ No se pudo configurar autoenfoque avanzado:', focusError)
        console.log('El escáner seguirá funcionando con configuración básica')
      }
    } catch (error: any) {
      console.error('Error al iniciar el escáner:', error)
      console.error('Error detallado:', error.message, error.name, error.stack)

      setIsInitializing(false)
      setIsScanning(false)

      let errorMessage = 'No se pudo acceder a la cámara.'

      if (error.message?.includes('Permission denied') || error.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso en tu navegador.'
      } else if (error.message?.includes('NotFoundError') || error.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en este dispositivo.'
      } else if (error.message?.includes('NotReadableError') || error.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación.'
      } else if (error.message?.includes('Cannot clear while scan is ongoing')) {
        errorMessage = 'El escáner ya está en uso. Cierra el modal y vuelve a intentar.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }

      setCameraError(errorMessage)
      setMode('manual')

      toast({
        title: "Error al acceder a la cámara",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Detener escáner
  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        const state = html5QrcodeRef.current.getState()
        if (state === 2) { // 2 = SCANNING
          console.log('Deteniendo scanner...')
          // Pequeño delay para evitar transición mientras ya está en transición
          await new Promise(resolve => setTimeout(resolve, 100))
          await html5QrcodeRef.current.stop()
          console.log('Scanner detenido exitosamente')
        } else {
          console.log('Scanner no está escaneando, estado:', state)
        }
        setIsScanning(false)
        setIsInitializing(false)
      } catch (error: any) {
        // Si el error es por transición, esperar y reintentar
        if (error.message?.includes('transition')) {
          console.log('Scanner en transición, esperando...')
          await new Promise(resolve => setTimeout(resolve, 300))
          try {
            const state = html5QrcodeRef.current.getState()
            if (state === 2) {
              await html5QrcodeRef.current.stop()
            }
          } catch (retryError) {
            console.error('Error en reintento al detener el escáner:', retryError)
          }
        } else {
          console.error('Error al detener el escáner:', error)
        }
        setIsScanning(false)
        setIsInitializing(false)
      }
    }
  }

  // Cambiar modo o cámara seleccionada
  useEffect(() => {
    if (mode === 'camera' && selectedCameraId) {
      // Detener scanner actual si existe
      if (html5QrcodeRef.current && isScanning) {
        stopScanner().then(() => {
          // Iniciar con la nueva cámara
          startScanner()
        })
      } else {
        // Iniciar scanner cuando se cambia a modo cámara
        startScanner()
      }
    }

    return () => {
      // Limpiar solo si el modo era camera
      if (mode === 'camera' && html5QrcodeRef.current) {
        const state = html5QrcodeRef.current.getState()
        if (state === 2) { // Solo si está SCANNING
          stopScanner()
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedCameraId])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        try {
          const state = html5QrcodeRef.current.getState()
          if (state === 2) { // Solo si está SCANNING
            html5QrcodeRef.current.stop()
              .catch((err) => console.log('Error al limpiar escáner (esperado):', err))
          }
        } catch (err) {
          console.log('Error al verificar estado en cleanup:', err)
        }
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
                  {/* Selector de cámara */}
                  {cameras.length > 1 && !isScanning && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">
                        Seleccionar Cámara
                      </label>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                        className="w-full h-12 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {cameras.map((camera) => (
                          <option key={camera.deviceId} value={camera.deviceId}>
                            {camera.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Botón para cambiar cámara mientras escanea */}
                  {cameras.length > 1 && isScanning && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        await stopScanner()
                        // El useEffect reiniciará con la nueva cámara
                      }}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Cambiar Cámara
                    </Button>
                  )}

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
                              📏 Distancia: 10-20cm • 💡 Luz fuerte
                            </p>
                            <p className="text-xs text-center text-blue-600 mt-1 font-medium">
                              Mantén el código quieto 2-3 segundos
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
                      <strong>Tips importantes:</strong> Mantén el código a 10-20cm de la cámara.
                      Usa iluminación FUERTE y directa. Mantén el código QUIETO 2-3 segundos.
                      El área de detección es grande, no necesitas acercarlo mucho.
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
