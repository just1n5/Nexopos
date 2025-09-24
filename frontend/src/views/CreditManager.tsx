import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Phone,
  MessageCircle,
  X,
  Check,
  History,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { Customer, Sale } from '@/types'

interface CreditSale extends Sale {
  customer: Customer
  payments: Payment[]
  remainingBalance: number
}

interface Payment {
  id: string
  amount: number
  date: Date
  method: 'cash' | 'transfer'
  notes?: string
}

export default function CreditManager() {
  const [creditSales, setCreditSales] = useState<CreditSale[]>([])
  const [selectedSale, setSelectedSale] = useState<CreditSale | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('pending')
  const { toast } = useToast()
  
  // Cargar ventas a crédito desde localStorage
  useEffect(() => {
    const loadCreditSales = () => {
      const sales = JSON.parse(localStorage.getItem('nexopos_sales') || '[]')
      const customers = JSON.parse(localStorage.getItem('nexopos_customers') || '[]')
      
      const creditSalesData = sales
        .filter((sale: Sale) => sale.paymentMethod === 'credit' && sale.customerId)
        .map((sale: Sale) => {
          const customer = customers.find((c: Customer) => c.id === sale.customerId)
          const payments = JSON.parse(localStorage.getItem(`nexopos_payments_${sale.id}`) || '[]')
          const totalPaid = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
          
          return {
            ...sale,
            customer,
            payments,
            remainingBalance: sale.total - totalPaid
          }
        })
        .filter((sale: CreditSale) => sale.customer)
      
      setCreditSales(creditSalesData)
    }
    
    loadCreditSales()
    
    // Actualizar cada 5 segundos para reflejar cambios
    const interval = setInterval(loadCreditSales, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // Filtrar ventas
  const filteredSales = creditSales.filter(sale => {
    const matchesSearch = searchQuery === '' ||
      sale.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer.phone?.includes(searchQuery) ||
      sale.invoiceNumber?.includes(searchQuery)
    
    let matchesFilter = true
    if (filterStatus === 'pending') {
      matchesFilter = sale.remainingBalance > 0
    } else if (filterStatus === 'paid') {
      matchesFilter = sale.remainingBalance === 0
    }
    
    return matchesSearch && matchesFilter
  })
  
  // Calcular estadísticas
  const totalCredit = creditSales.reduce((sum, sale) => sum + sale.total, 0)
  const totalPending = creditSales.reduce((sum, sale) => sum + sale.remainingBalance, 0)
  const totalCollected = totalCredit - totalPending
  
  // Procesar pago
  const handlePayment = () => {
    if (!selectedSale || !paymentAmount) return
    
    const amount = parseFloat(paymentAmount)
    if (amount <= 0 || amount > selectedSale.remainingBalance) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0 y no exceder la deuda",
        variant: "destructive"
      })
      return
    }
    
    const payment: Payment = {
      id: Date.now().toString(),
      amount,
      date: new Date(),
      method: 'cash',
      notes: paymentNotes
    }
    
    // Guardar pago
    const payments = [...selectedSale.payments, payment]
    localStorage.setItem(`nexopos_payments_${selectedSale.id}`, JSON.stringify(payments))
    
    // Actualizar deuda del cliente
    const customers = JSON.parse(localStorage.getItem('nexopos_customers') || '[]')
    const customerIndex = customers.findIndex((c: Customer) => c.id === selectedSale.customer.id)
    if (customerIndex !== -1) {
      customers[customerIndex].currentDebt = Math.max(0, (customers[customerIndex].currentDebt || 0) - amount)
      localStorage.setItem('nexopos_customers', JSON.stringify(customers))
    }
    
    // Actualizar estado local
    const updatedSales = creditSales.map(sale => 
      sale.id === selectedSale.id
        ? {
            ...sale,
            payments,
            remainingBalance: sale.total - payments.reduce((sum, p) => sum + p.amount, 0)
          }
        : sale
    )
    setCreditSales(updatedSales)
    setSelectedSale(null)
    setShowPaymentModal(false)
    setPaymentAmount('')
    setPaymentNotes('')
    
    toast({
      title: "✓ Pago registrado",
      description: `${formatCurrency(amount)} abonado a la cuenta de ${selectedSale.customer.name}`,
      variant: "success" as any
    })
  }
  
  // Enviar recordatorio por WhatsApp
  const sendWhatsAppReminder = (sale: CreditSale) => {
    const message = `Hola ${sale.customer.name}, te recordamos que tienes una deuda pendiente de ${formatCurrency(sale.remainingBalance)} en nuestra tienda. Factura: ${sale.invoiceNumber}. ¡Gracias!`
    const whatsappUrl = `https://wa.me/${sale.customer.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    
    toast({
      title: "Recordatorio enviado",
      description: "Se abrió WhatsApp con el mensaje",
      variant: "default"
    })
  }
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Fiado</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(totalCredit)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Por Cobrar</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalPending)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cobrado</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCollected)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros y búsqueda */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por cliente, teléfono o factura..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
              >
                Pendientes
                {creditSales.filter(s => s.remainingBalance > 0).length > 0 && (
                  <Badge className="ml-2" variant="destructive">
                    {creditSales.filter(s => s.remainingBalance > 0).length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={filterStatus === 'paid' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('paid')}
              >
                Pagados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de ventas a crédito */}
      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchQuery || filterStatus !== 'all'
                  ? 'No se encontraron resultados'
                  : 'No hay ventas a crédito registradas'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSales.map(sale => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={sale.remainingBalance === 0 ? 'opacity-75' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{sale.customer.name}</p>
                          <p className="text-sm text-gray-500">
                            {sale.customer.phone} • Factura: {sale.invoiceNumber}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">Fecha</p>
                          <p className="text-sm font-medium">
                            {formatDateTime(sale.date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(sale.total)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pagado</p>
                          <p className="text-sm font-medium text-green-600">
                            {formatCurrency(sale.total - sale.remainingBalance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pendiente</p>
                          <p className={`text-sm font-bold ${
                            sale.remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(sale.remainingBalance)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Historial de pagos */}
                      {sale.payments.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-2">Historial de pagos:</p>
                          <div className="space-y-1">
                            {sale.payments.slice(-3).map(payment => (
                              <div key={payment.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">
                                  {formatDateTime(payment.date)}
                                  {payment.notes && ` - ${payment.notes}`}
                                </span>
                                <span className="font-medium text-green-600">
                                  +{formatCurrency(payment.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {sale.remainingBalance > 0 ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSale(sale)
                              setShowPaymentModal(true)
                            }}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Abonar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendWhatsAppReminder(sale)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Recordar
                          </Button>
                        </>
                      ) : (
                        <Badge className="bg-green-100 text-green-700">
                          <Check className="w-3 h-3 mr-1" />
                          Pagado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Modal de pago */}
      <AnimatePresence>
        {showPaymentModal && selectedSale && (
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
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Registrar Abono
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPaymentModal(false)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Cliente</p>
                    <p className="font-medium">{selectedSale.customer.name}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <span className="ml-1 font-medium">
                          {formatCurrency(selectedSale.total)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pendiente:</span>
                        <span className="ml-1 font-bold text-orange-600">
                          {formatCurrency(selectedSale.remainingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Monto a abonar
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="pl-8"
                        max={selectedSale.remainingBalance}
                      />
                    </div>
                  </div>
                  
                  {/* Botones de monto rápido */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount((selectedSale.remainingBalance * 0.25).toString())}
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount((selectedSale.remainingBalance * 0.5).toString())}
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(selectedSale.remainingBalance.toString())}
                    >
                      Total
                    </Button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notas (opcional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: Pago parcial, efectivo"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={handlePayment}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Registrar Abono
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
