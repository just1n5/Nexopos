import { useEffect, useCallback } from 'react'

type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  action: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Ignorar si el foco está en un input
    const activeElement = document.activeElement as HTMLElement
    const isInputActive = activeElement?.tagName === 'INPUT' || 
                         activeElement?.tagName === 'TEXTAREA'
    
    if (isInputActive && !e.ctrlKey && !e.altKey) {
      return
    }
    
    // Buscar atajo coincidente
    const shortcut = shortcuts.find(s => {
      const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()
      const ctrlMatch = s.ctrl ? e.ctrlKey : !e.ctrlKey
      const altMatch = s.alt ? e.altKey : !e.altKey
      const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch
    })
    
    if (shortcut) {
      e.preventDefault()
      shortcut.action()
    }
  }, [shortcuts])
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])
}

// Atajos predefinidos para POS
export const POSShortcuts = {
  OPEN_SEARCH: { key: 'f', ctrl: true, description: 'Buscar producto' },
  CLEAR_CART: { key: 'l', ctrl: true, description: 'Limpiar carrito' },
  PROCESS_PAYMENT: { key: 'p', ctrl: true, description: 'Procesar pago' },
  CASH_PAYMENT: { key: '1', alt: true, description: 'Pago en efectivo' },
  CARD_PAYMENT: { key: '2', alt: true, description: 'Pago con tarjeta' },
  CREDIT_SALE: { key: '3', alt: true, description: 'Venta a crédito (Fiar)' },
  ADD_CUSTOMER: { key: 'c', ctrl: true, description: 'Agregar cliente' },
  PRINT_LAST: { key: 'r', ctrl: true, description: 'Reimprimir último recibo' },
  OPEN_DRAWER: { key: 'd', ctrl: true, description: 'Abrir cajón monedero' },
  APPLY_DISCOUNT: { key: 'd', alt: true, description: 'Aplicar descuento' },
  QUANTITY_FOCUS: { key: 'q', alt: true, description: 'Cambiar cantidad' },
  CANCEL_SALE: { key: 'Escape', description: 'Cancelar venta' },
}

export default useKeyboardShortcuts
