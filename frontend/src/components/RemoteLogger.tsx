import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Terminal, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LogEntry {
  id: number
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: Date
  args: any[]
}

export default function RemoteLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const logIdRef = useRef(0)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Interceptar console.log, console.warn, console.error, console.info
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    const originalInfo = console.info

    const addLog = (type: LogEntry['type'], args: any[]) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')

      setLogs(prev => {
        const newLogs = [...prev, {
          id: logIdRef.current++,
          type,
          message,
          timestamp: new Date(),
          args
        }]
        // Mantener solo los últimos 100 logs
        return newLogs.slice(-100)
      })
    }

    console.log = (...args: any[]) => {
      originalLog(...args)
      addLog('log', args)
    }

    console.warn = (...args: any[]) => {
      originalWarn(...args)
      addLog('warn', args)
    }

    console.error = (...args: any[]) => {
      originalError(...args)
      addLog('error', args)
    }

    console.info = (...args: any[]) => {
      originalInfo(...args)
      addLog('info', args)
    }

    // Restaurar al desmontar
    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      console.info = originalInfo
    }
  }, [])

  // Auto-scroll al último log
  useEffect(() => {
    if (!isMinimized && isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isMinimized, isOpen])

  const clearLogs = () => {
    setLogs([])
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warn':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return '❌'
      case 'warn':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📝'
    }
  }

  // Botón flotante para abrir el logger
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[999] bg-gray-900 text-white p-4 rounded-full shadow-2xl hover:bg-gray-800 transition-colors"
        title="Abrir Console Logs"
      >
        <Terminal className="w-6 h-6" />
        {logs.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {logs.length > 99 ? '99+' : logs.length}
          </span>
        )}
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-[999] bg-white rounded-xl shadow-2xl border-2 border-gray-300 overflow-hidden"
        style={{
          width: isMinimized ? '350px' : '90vw',
          maxWidth: isMinimized ? '350px' : '600px',
          height: isMinimized ? 'auto' : '70vh',
          maxHeight: isMinimized ? 'auto' : '500px'
        }}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            <span className="font-bold">Console Logs ({logs.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 text-white hover:bg-gray-700"
              title={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearLogs}
              className="h-8 w-8 text-white hover:bg-gray-700"
              title="Limpiar logs"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:bg-gray-700"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Logs */}
        {!isMinimized && (
          <div className="overflow-y-auto p-3 space-y-2 h-full bg-gray-50">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay logs aún</p>
              </div>
            ) : (
              <>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border text-sm font-mono ${getLogColor(log.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">{getLogIcon(log.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs opacity-70 mb-1">
                          {log.timestamp.toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
                        </div>
                        <pre className="whitespace-pre-wrap break-words text-xs overflow-x-auto">
                          {log.message}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
