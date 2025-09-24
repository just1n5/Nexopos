import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  Play,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
  ShoppingCart,
  Package,
  CreditCard,
  Calculator,
  BarChart3,
  Settings,
  Smartphone,
  Monitor,
  Zap,
  Gift
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  action?: () => void
  tips?: string[]
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a NexoPOS!',
    description: 'Te ayudaremos a configurar tu negocio y empezar a vender en minutos. Este tutorial te guiará por las funciones principales del sistema.',
    icon: Gift,
    tips: [
      'Puedes pausar el tutorial en cualquier momento',
      'El sistema funciona en celular, tablet y computador',
      'Todos tus datos se guardan automáticamente'
    ]
  },
  {
    id: 'pos',
    title: 'Punto de Venta',
    description: 'Aquí es donde registrarás tus ventas diarias. Solo toca un producto para agregarlo al carrito y luego procesa el pago.',
    icon: ShoppingCart,
    tips: [
      'Usa el buscador para encontrar productos rápidamente',
      'Puedes escanear códigos de barras con la cámara',
      'Las teclas rápidas te ayudan a vender más rápido'
    ]
  },
  {
    id: 'inventory',
    title: 'Control de Inventario',
    description: 'Mantén el control de tu mercancía. Agrega productos, actualiza precios y recibe alertas cuando algo se esté agotando.',
    icon: Package,
    tips: [
      'El inventario se actualiza automáticamente con cada venta',
      'Puedes agregar productos con variaciones (talla, color)',
      'Recibe alertas cuando el stock esté bajo'
    ]
  },
  {
    id: 'credit',
    title: 'Control del Fiado',
    description: '¿Tus clientes te piden fiado? No hay problema. Registra las ventas a crédito y haz seguimiento de los pagos.',
    icon: CreditCard,
    tips: [
      'Asigna límites de crédito a cada cliente',
      'Envía recordatorios por WhatsApp',
      'Registra abonos parciales fácilmente'
    ]
  },
  {
    id: 'cash',
    title: 'Cierre de Caja',
    description: 'Al final del día, cierra tu caja y obtén un resumen completo de las ventas, gastos y ganancias.',
    icon: Calculator,
    tips: [
      'Registra gastos del día',
      'Calcula automáticamente el efectivo esperado',
      'Genera reportes para tu contador'
    ]
  },
  {
    id: 'reports',
    title: 'Reportes y Análisis',
    description: 'Toma mejores decisiones con datos reales. Ve qué productos se venden más, tus mejores clientes y las horas pico.',
    icon: BarChart3,
    tips: [
      'Compara ventas por períodos',
      'Identifica tus productos estrella',
      'Exporta reportes en Excel o PDF'
    ]
  },
  {
    id: 'mobile',
    title: 'Vende desde tu Celular',
    description: 'NexoPOS funciona perfectamente en tu celular. Puedes hacer ventas, consultar inventario y ver reportes desde cualquier lugar.',
    icon: Smartphone,
    tips: [
      'Agrega un acceso directo en tu pantalla de inicio',
      'Funciona sin conexión a internet',
      'Sincroniza automáticamente cuando te conectes'
    ]
  },
  {
    id: 'complete',
    title: '¡Listo para Vender!',
    description: '¡Felicitaciones! Ya conoces las funciones principales de NexoPOS. Estás listo para empezar a gestionar tu negocio de forma profesional.',
    icon: CheckCircle,
    tips: [
      'Recuerda configurar tus datos fiscales en Configuración',
      'Agrega tus productos más vendidos como teclas rápidas',
      'El soporte está disponible 24/7 si necesitas ayuda'
    ]
  }
]

interface OnboardingProps {
  onComplete?: () => void
  autoStart?: boolean
}

export default function Onboarding({ onComplete, autoStart = false }: OnboardingProps) {
  const [isOpen, setIsOpen] = useState(autoStart)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  
  // Verificar si el usuario ya vio el tutorial
  useEffect(() => {
    const seen = localStorage.getItem('nexopos_tutorial_completed')
    setHasSeenTutorial(!!seen)
    
    // Auto-abrir para nuevos usuarios
    if (!seen && autoStart) {
      setIsOpen(true)
    }
  }, [autoStart])
  
  const currentTutorial = tutorialSteps[currentStep]
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100
  
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleComplete = () => {
    localStorage.setItem('nexopos_tutorial_completed', 'true')
    setHasSeenTutorial(true)
    setIsOpen(false)
    setCurrentStep(0)
    if (onComplete) {
      onComplete()
    }
  }
  
  const handleSkip = () => {
    localStorage.setItem('nexopos_tutorial_completed', 'skipped')
    setHasSeenTutorial(true)
    setIsOpen(false)
    setCurrentStep(0)
  }
  
  return (
    <>
      {/* Botón de ayuda flotante */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="relative">
          {!hasSeenTutorial && (
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </motion.div>
          )}
          <Button
            variant="default"
            size="icon"
            className="rounded-full shadow-lg h-14 w-14"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Menú de ayuda */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 left-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 space-y-3"
            >
              <h3 className="font-medium text-sm">Centro de Ayuda</h3>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setIsOpen(true)
                  setShowHelp(false)
                  setCurrentStep(0)
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                {hasSeenTutorial ? 'Ver Tutorial Nuevamente' : 'Iniciar Tutorial'}
              </Button>
              
              <div className="space-y-2">
                <a 
                  href="#" 
                  className="block text-sm text-gray-600 hover:text-primary dark:text-gray-400"
                >
                  📖 Manual de Usuario
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-gray-600 hover:text-primary dark:text-gray-400"
                >
                  📹 Video Tutoriales
                </a>
                <a 
                  href="https://wa.me/573001234567" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-600 hover:text-primary dark:text-gray-400"
                >
                  💬 Soporte por WhatsApp
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-gray-600 hover:text-primary dark:text-gray-400"
                >
                  🔧 Reportar un Problema
                </a>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Soporte 24/7 disponible
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Modal del tutorial */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleSkip()
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <Card className="border-0 overflow-hidden">
                {/* Progress bar */}
                <div className="h-2 bg-gray-200">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <currentTutorial.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{currentTutorial.title}</CardTitle>
                        <p className="text-sm text-gray-500">
                          Paso {currentStep + 1} de {tutorialSteps.length}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSkip}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                    {currentTutorial.description}
                  </p>
                  
                  {/* Tips */}
                  {currentTutorial.tips && currentTutorial.tips.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        💡 Tips Útiles:
                      </h4>
                      <ul className="space-y-1">
                        {currentTutorial.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {tip}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Imagen o demo */}
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center">
                    <currentTutorial.icon className="w-24 h-24 text-gray-300 dark:text-gray-600" />
                  </div>
                  
                  {/* Acciones especiales para el último paso */}
                  {currentStep === tutorialSteps.length - 1 && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ¡Excelente! Has completado el tutorial. Ahora puedes empezar a usar NexoPOS.
                        Recuerda que siempre puedes volver a ver este tutorial desde el botón de ayuda.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Navegación */}
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    
                    <div className="flex gap-1">
                      {tutorialSteps.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentStep 
                              ? 'w-6 bg-primary' 
                              : index < currentStep
                              ? 'bg-primary/50'
                              : 'bg-gray-300'
                          }`}
                          onClick={() => setCurrentStep(index)}
                        />
                      ))}
                    </div>
                    
                    <Button onClick={handleNext}>
                      {currentStep === tutorialSteps.length - 1 ? (
                        <>
                          Empezar
                          <CheckCircle className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Siguiente
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
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
