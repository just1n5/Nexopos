import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  MessageCircle,
  X,
  Check,
  History,
  CreditCard,
  Clock,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import { creditService, type CreditSale } from '@/services/creditService'

export default function CreditManager() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [creditSales, setCreditSales] = useState<CreditSale[]>([])
  const [selectedSale, setSelectedSale] = useState<CreditSale | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('pending')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalCredits: 0,
    totalPending: 0,
    totalOverdue: 0,
    creditsCount: 0,
    pendingCount: 0,
    overdueCount: 0
  })

  useEffect(() => {
    if (token) {
      loadCreditData()
    }
  }, [token, filterStatus])

  const loadCreditData = async () => {
    try {
      setLoading(true)
      const status = filterStatus === 'all' ? undefined : filterStatus
      const sales = await creditService.getCreditSales(token!, { status })
      setCreditSales(sales)
      
      const summaryData = await creditService.getCreditSummary(token!)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading credit data:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de créditos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async () => {
    if (!selectedSale || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingrese un monto válido',
        variant: 'destructive'
      })
      return
    }

    const amount = parseFloat(paymentAmount)
    if (amount > selectedSale.remainingBalance) {
      toast({
        title: 'Error',
        description: 'El monto excede el saldo pendiente',
        variant: 'destructive'
      })
      return
    }

    try {
      await creditService.addPayment(
        selectedSale.id,
        {
          amount,
          paymentMethod,
          notes: paymentNotes
        },
        token!
      )
      
      toast({
        title: 'Pago Registrado',
        description: `Se ha registrado un pago de ${formatCurrency(amount)}`,
      })
      
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentNotes('')
      setSelectedSale(null)
      await loadCreditData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el pago',
        variant: 'destructive'
      })
    }
  }

  const handleSendReminder = async (creditSale: CreditSale) => {
    try {
      await creditService.sendPaymentReminder(creditSale.id, 'whatsapp', token!)
      toast({
        title: 'Recordatorio Enviado',
        description: 'Se ha enviado un recordatorio por WhatsApp',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar el recordatorio',
        variant: 'destructive'
      })
    }
  }

  const filteredSales = creditSales.filter(sale => {
    const matchesSearch = sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sale.customer?.phone?.includes(searchQuery)
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
    }
  }

  const getDaysOverdue = (dueDate?: Date) => {
    if (!dueDate) return 0
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando información de créditos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Gestión de Créditos (Fiado)</h1>
          <p className="text-gray-600">Administra las ventas a crédito y registra los pagos</p>
        </div>

        {/* Resumen de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total en Créditos</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalCredits)}</p>
                  <p className="text-xs text-gray-500">{summary.creditsCount} créditos</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Por Cobrar</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPending)}</p>
                  <p className="text-xs text-gray-500">{summary.pendingCount} pendientes</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vencidos</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</p>
                  <p className="text-xs text-gray-500">{summary.overdueCount} vencidos</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tasa de Recuperación</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.totalCredits > 0 
                      ? `${Math.round(((summary.totalCredits - summary.totalPending) / summary.totalCredits) * 100)}%`
                      : '0%'
                    }
                  </p>
                  <p className="text-xs text-gray-500">del total cobrado</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por cliente o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="paid">Pagados</option>
              <option value="overdue">Vencidos</option>
            </select>
          </div>
        </div>

        {/* Lista de Créditos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Créditos {filterStatus !== 'all' && `(${filterStatus === 'pending' ? 'Pendientes' : filterStatus === 'paid' ? 'Pagados' : 'Vencidos'})`}
            </h2>
          </div>

          {filteredSales.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay créditos para mostrar</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSales.map((sale) => {
                const daysOverdue = getDaysOverdue(sale.dueDate)
                
                return (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{sale.customer?.name || 'Cliente Sin Nombre'}</h3>
                            <p className="text-sm text-gray-500">{sale.customer?.phone || 'Sin teléfono'}</p>
                          </div>
                          {getStatusBadge(sale.status)}
                          {daysOverdue > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              {daysOverdue} días vencido
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <p className="font-semibold">{formatCurrency(sale.totalAmount)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Pagado:</span>
                            <p className="font-semibold text-green-600">{formatCurrency(sale.paidAmount)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Pendiente:</span>
                            <p className="font-semibold text-red-600">{formatCurrency(sale.remainingBalance)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Fecha:</span>
                            <p>{new Date(sale.createdAt).toLocaleDateString('es-CO')}</p>
                          </div>
                        </div>

                        {/* Historial de Pagos */}
                        {sale.payments && sale.payments.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <History className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Historial de pagos:</span>
                            </div>
                            <div className="space-y-1">
                              {sale.payments.slice(0, 3).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    {new Date(payment.date).toLocaleDateString('es-CO')} - {payment.paymentMethod === 'cash' ? 'Efectivo' : payment.paymentMethod === 'transfer' ? 'Transferencia' : 'Tarjeta'}
                                  </span>
                                  <span className="font-medium text-green-600">
                                    +{formatCurrency(payment.amount)}
                                  </span>
                                </div>
                              ))}
                              {sale.payments.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{sale.payments.length - 3} pagos más...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {sale.status !== 'paid' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSale(sale)
                                setShowPaymentModal(true)
                              }}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Registrar Pago
                            </Button>
                            
                            {sale.customer?.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendReminder(sale)}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal de Pago */}
        <AnimatePresence>
          {showPaymentModal && selectedSale && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowPaymentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Registrar Pago</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-semibold">{selectedSale.customer?.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Saldo Pendiente</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(selectedSale.remainingBalance)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Monto a Pagar
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Método de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="card">Tarjeta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notas (Opcional)
                    </label>
                    <Input
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Ej: Abono parcial"
                    />
                  </div>

                  {paymentAmount && parseFloat(paymentAmount) === selectedSale.remainingBalance && (
                    <Alert>
                      <Check className="w-4 h-4" />
                      <AlertDescription>
                        Este pago liquidará completamente la deuda
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1"
                      onClick={handleAddPayment}
                      disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Registrar Pago
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}



