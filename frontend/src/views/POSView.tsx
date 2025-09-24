import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Smartphone,
  Banknote,
  UserPlus,
  Percent,
  X,
  Package,
  ArrowLeft,
  Receipt as ReceiptIcon,
  Calculator,
  User,
  ChevronDown,
  ChevronUp,
  History,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePOSStore } from '@/stores/posStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { formatCurrency } from '@/lib/utils'
import { PaymentMethod, Customer } from '@/types'
import BarcodeScanner from '@/components/BarcodeScanner'
import CustomerManager from '@/components/CustomerManager'
import Receipt from '@/components/Receipt'
import { useKeyboardShortcuts, POSShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useToast } from '@/hooks/useToast'

export default function POSView() {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [cashReceived, setCashReceived] = useState<string>('')
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [customerSectionExpanded, setCustomerSectionExpanded] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [discountValue, setDiscountValue] = useState<string>('')
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const { toast } = useToast()
  
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotalTax,
    getTotal,
    processSale,
    selectedCustomer,
    setCustomer,
    discount,
    setGlobalDiscount
  } = usePOSStore()
  
  const {
    products,
    searchQuery,
    selectedCategory,
    searchProducts,
    filterByCategory,
    getFilteredProducts,
    getCategories,
    updateStock
  } = useInventoryStore()
  
  const { addSale } = useCashRegisterStore()
  
  // Obtener productos filtrados
  const filteredProducts = useMemo(() => {
    return getFilteredProducts().filter(p => p.isActive)
  }, [searchQuery, selectedCategory, products])
  
  // Obtener categorÃ­as
  const categories = useMemo(() => {
    return getCategories()
  }, [products])

  // Calcular el cambio
  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0
    const total = getTotal()
    return received - total
  }

  // Aplicar descuento
  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue) || 0
    if (value > 0 && value <= 100) {
      setGlobalDiscount(value)
      setShowDiscountModal(false)
      setDiscountValue('')
      toast({
        title: "Descuento aplicado",
        description: `${value}% de descuento aplicado a la venta`,
        variant: "success" as any
      })
    }
  }

  // Procesar el pago
  const handlePayment = () => {
    if (!selectedPayment) return
    
    // Validar si es venta a crÃ©dito y requiere cliente
    if (selectedPayment === PaymentMethod.CREDIT && !selectedCustomer) {
      toast({
        title: "Cliente requerido",
        description: "Debes seleccionar un cliente para ventas a crÃ©dito",
        variant: "destructive"
      })
      return
    }
    
    // Validar si el cliente tiene crÃ©dito disponible
    if (selectedPayment === PaymentMethod.CREDIT && selectedCustomer) {
      const creditLimit = selectedCustomer.creditLimit || 0
      const currentDebt = selectedCustomer.currentDebt || 0
      const availableCredit = creditLimit - currentDebt
      
      if (getTotal() > availableCredit) {
        toast({
          title: "CrÃ©dito insuficiente",
          description: `El cliente solo tiene ${formatCurrency(availableCredit)} de crÃ©dito disponible`,
          variant: "destructive"
        })
        return
      }
    }
    
    const cashAmount = selectedPayment === PaymentMethod.CASH ? parseFloat(cashReceived) : undefined
    const sale = processSale(selectedPayment, cashAmount)
    
    if (sale) {
      // Actualizar inventario
      sale.items.forEach(item => {
        updateStock(item.product.id, -item.quantity, item.variant?.id)
      })
      
      // Agregar la venta al registro de caja
      addSale(sale)
      
      // Mostrar recibo
      setLastSale(sale)
      setShowReceipt(true)
      
      // Mostrar notificaciÃ³n de Ã©xito
      toast({
        title: "âœ“ Venta completada",
        description: `Total: ${formatCurrency(sale.total)}`,
        variant: "success" as any
      })
      
      // Limpiar y cerrar
      setShowPaymentModal(false)
      setSelectedPayment(null)
      setCashReceived('')
      setIsMobileCartOpen(false)
      setGlobalDiscount(0)
    }
  }

  // Quick amount buttons for cash payment
  const quickAmounts = [5000, 10000, 20000, 50000, 100000]
  
  // Configurar atajos de teclado
  useKeyboardShortcuts([
    {
      ...POSShortcuts.CLEAR_CART,
      action: () => clearCart()
    },
    {
      ...POSShortcuts.PROCESS_PAYMENT,
      action: () => {
        if (cart.length > 0) {
          setSelectedPayment(PaymentMethod.CASH)
          setShowPaymentModal(true)
        }
      }
    },
    {
      ...POSShortcuts.CASH_PAYMENT,
      action: () => {
        if (cart.length > 0) {
          setSelectedPayment(PaymentMethod.CASH)
          setShowPaymentModal(true)
        }
      }
    },
    {
      ...POSShortcuts.CARD_PAYMENT,
      action: () => {
        if (cart.length > 0) {
          setSelectedPayment(PaymentMethod.CARD)
          setShowPaymentModal(true)
        }
      }
    },
    {
      ...POSShortcuts.CREDIT_SALE,
      action: () => {
        if (cart.length > 0) {
          setSelectedPayment(PaymentMethod.CREDIT)
          setShowPaymentModal(true)
        }
      }
    },
    {
      ...POSShortcuts.BARCODE_SCANNER,
      action: () => setShowBarcodeScanner(!showBarcodeScanner)
    },
    {
      key: 'Escape',
      action: () => {
        setShowPaymentModal(false)
        setShowDiscountModal(false)
        setShowReceipt(false)
      }
    }
  ])

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode)
    if (product) {
      addToCart(product)
      toast({
        title: "Producto agregado",
        description: `${product.name} agregado al carrito`,
        variant: "default"
      })
      setShowBarcodeScanner(false)
    } else {
      toast({
        title: "Producto no encontrado",
        description: `No se encontrÃ³ un producto con el cÃ³digo ${barcode}`,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Panel Izquierdo - CatÃ¡logo de Productos */}
      <div className={`flex-1 flex flex-col ${isMobileCartOpen ? 'hidden lg:flex' : ''}`}>
        {/* Header de bÃºsqueda y categorÃ­as */}
        <div className="bg-white border-b p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nombre, cÃ³digo o cÃ³digo de barras..."
                value={searchQuery}
                onChange={(e) => searchProducts(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowBarcodeScanner(true)}
              className="h-12 w-12"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2m-2 0a1 1 0 00-1 1v6a1 1 0 001 1m2-8h14a1 1 0 011 1v6a1 1 0 01-1 1m-18 0h18" />
              </svg>
            </Button>
          </div>
          
          {/* Filtros de categorÃ­a */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => filterByCategory(null)}
            >
              Todos
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => filterByCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {filteredProducts.map(product => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(product.price)}
                        </span>
                        <Badge variant={product.stock < 10 ? 'destructive' : 'default'} className="text-xs">
                          {product.stock}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Carrito de Compras */}
      <div className={`w-full lg:w-[450px] bg-white border-l flex flex-col ${!isMobileCartOpen ? 'hidden lg:flex' : ''}`}>
        {/* Header del carrito */}
        <div className="p-4 border-b bg-primary text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobileCartOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="text-white hover:bg-white/20 lg:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <ShoppingCart className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Venta Actual</h2>
            </div>
            <Badge className="bg-white text-primary">
              {cart.length} items
            </Badge>
          </div>
        </div>

        {/* SecciÃ³n de cliente */}
        {cart.length > 0 && (
          <div className="border-b">
            <Button
              variant="ghost"
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
              onClick={() => setCustomerSectionExpanded(!customerSectionExpanded)}
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">
                  {selectedCustomer ? selectedCustomer.name : 'Seleccionar Cliente (Opcional)'}
                </span>
              </div>
              {customerSectionExpanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
            
            <AnimatePresence>
              {customerSectionExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <CustomerManager
                      selectedCustomer={selectedCustomer}
                      onSelectCustomer={setCustomer}
                      showCreditInfo={true}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Lista de items del carrito */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p className="text-lg">Carrito vacÃ­o</p>
              <p className="text-sm">Agrega productos para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {cart.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.product.name}</h4>
                            <p className="text-xs text-gray-500">{formatCurrency(item.price)} c/u</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-10 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="font-bold text-primary">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Resumen y acciones */}
        <div className="border-t p-4 space-y-4">
          {/* Totales */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento ({discount}%):</span>
                <span>-{formatCurrency(getSubtotal() * discount / 100)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA (19%):</span>
              <span>{formatCurrency(getTotalTax())}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          {/* Botones de pago */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-12"
              onClick={() => {
                setSelectedPayment(PaymentMethod.CREDIT)
                setShowPaymentModal(true)
              }}
              disabled={cart.length === 0}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Fiar
            </Button>
            <Button
              className="h-12"
              onClick={() => {
                setSelectedPayment(PaymentMethod.CASH)
                setShowPaymentModal(true)
              }}
              disabled={cart.length === 0}
            >
              <Banknote className="w-5 h-5 mr-2" />
              Pagar
            </Button>
          </div>
          
          {/* Acciones adicionales */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => clearCart()}
              disabled={cart.length === 0}
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowDiscountModal(true)}
              disabled={cart.length === 0}
            >
              <Percent className="w-4 h-4 mr-1" />
              Descuento
            </Button>
          </div>
        </div>
      </div>

      {/* BotÃ³n flotante para mÃ³vil */}
      <Button
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg lg:hidden z-10"
        size="icon"
        onClick={() => setIsMobileCartOpen(true)}
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </div>
      </Button>

      {/* Modal de Descuento */}
      <AnimatePresence>
        {showDiscountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDiscountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    Aplicar Descuento
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDiscountModal(false)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Porcentaje de descuento
                    </label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="pr-8 h-12 text-lg font-medium"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Botones de descuento rÃ¡pido */}
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map(value => (
                      <Button
                        key={value}
                        variant="outline"
                        size="sm"
                        onClick={() => setDiscountValue(value.toString())}
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleApplyDiscount}
                    disabled={!discountValue || parseFloat(discountValue) <= 0 || parseFloat(discountValue) > 100}
                  >
                    Aplicar Descuento
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Pago */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    Procesar Pago
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPaymentModal(false)}
                      className="h-8 w-8"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Total a pagar */}
                  <div className="bg-primary/10 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(getTotal())}
                      </p>
                    </div>
                  </div>

                  {/* Alerta para venta a crÃ©dito */}
                  {selectedPayment === PaymentMethod.CREDIT && !selectedCustomer && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Debes seleccionar un cliente para ventas a crÃ©dito
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* MÃ©todos de pago */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">MÃ©todo de pago</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedPayment === PaymentMethod.CASH ? 'default' : 'outline'}
                        className="h-16"
                        onClick={() => setSelectedPayment(PaymentMethod.CASH)}
                      >
                        <div className="flex flex-col items-center">
                          <Banknote className="w-6 h-6 mb-1" />
                          <span className="text-xs">Efectivo</span>
                        </div>
                      </Button>
                      <Button
                        variant={selectedPayment === PaymentMethod.CARD ? 'default' : 'outline'}
                        className="h-16"
                        onClick={() => setSelectedPayment(PaymentMethod.CARD)}
                      >
                        <div className="flex flex-col items-center">
                          <CreditCard className="w-6 h-6 mb-1" />
                          <span className="text-xs">Tarjeta</span>
                        </div>
                      </Button>
                      <Button
                        variant={selectedPayment === PaymentMethod.NEQUI ? 'default' : 'outline'}
                        className="h-16"
                        onClick={() => setSelectedPayment(PaymentMethod.NEQUI)}
                      >
                        <div className="flex flex-col items-center">
                          <Smartphone className="w-6 h-6 mb-1" />
                          <span className="text-xs">Nequi</span>
                        </div>
                      </Button>
                      <Button
                        variant={selectedPayment === PaymentMethod.DAVIPLATA ? 'default' : 'outline'}
                        className="h-16"
                        onClick={() => setSelectedPayment(PaymentMethod.DAVIPLATA)}
                      >
                        <div className="flex flex-col items-center">
                          <Smartphone className="w-6 h-6 mb-1" />
                          <span className="text-xs">Daviplata</span>
                        </div>
                      </Button>
                    </div>
                    
                    {/* BotÃ³n para fiado */}
                    <Button
                      variant={selectedPayment === PaymentMethod.CREDIT ? 'default' : 'outline'}
                      className="w-full h-16"
                      onClick={() => setSelectedPayment(PaymentMethod.CREDIT)}
                    >
                      <div className="flex flex-col items-center">
                        <UserPlus className="w-6 h-6 mb-1" />
                        <span className="text-xs">Fiado (CrÃ©dito)</span>
                      </div>
                    </Button>
                  </div>

                  {/* Si es pago en efectivo, mostrar calculadora de cambio */}
                  {selectedPayment === PaymentMethod.CASH && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Dinero recibido
                        </label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="pl-8 h-12 text-lg font-medium"
                          />
                        </div>
                      </div>

                      {/* Botones de cantidad rÃ¡pida */}
                      <div className="grid grid-cols-3 gap-2">
                        {quickAmounts.map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setCashReceived(amount.toString())}
                          >
                            {formatCurrency(amount)}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCashReceived(getTotal().toString())}
                        >
                          Exacto
                        </Button>
                      </div>

                      {/* Mostrar cambio */}
                      {parseFloat(cashReceived) > 0 && (
                        <div className={`p-3 rounded-lg ${calculateChange() >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                          <p className="text-sm text-gray-600">
                            {calculateChange() >= 0 ? 'Cambio:' : 'Falta:'}
                          </p>
                          <p className={`text-2xl font-bold ${calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(calculateChange()))}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BotÃ³n de confirmar */}
                  <Button
                    className="w-full h-12"
                    disabled={
                      !selectedPayment || 
                      (selectedPayment === PaymentMethod.CASH && calculateChange() < 0) ||
                      (selectedPayment === PaymentMethod.CREDIT && !selectedCustomer)
                    }
                    onClick={handlePayment}
                  >
                    <ReceiptIcon className="w-5 h-5 mr-2" />
                    Confirmar Pago
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Recibo */}
      <AnimatePresence>
        {showReceipt && lastSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Receipt
                sale={lastSale}
                onClose={() => setShowReceipt(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  )
}

