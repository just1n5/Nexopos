import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  X,
  Check,
  History,
  CreditCard,
  Clock,
  User,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { creditService, type CreditSale } from '@/services/creditService'
import CustomerManager from '@/components/CustomerManager'

export default function CreditManager() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [creditSales, setCreditSales] = useState<CreditSale[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; totalDebt: number } | null>(null)
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<CreditSale | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('pending')
  const [loading, setLoading] = useState(true)
  const [showCustomerManager, setShowCustomerManager] = useState(false)
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

  // Filtrar ventas por búsqueda
  const filteredSales = creditSales.filter(sale => {
    const matchesSearch = sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sale.customer?.phone?.includes(searchQuery)
    return matchesSearch
  })

  // Función para formatear fechas
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Sin fecha'
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Agrupar ventas por cliente
  const groupedByCustomer = filteredSales.reduce((acc, sale) => {
    const customerId = sale.customerId
    const customerName = sale.customer?.name || 'Cliente Sin Nombre'

    if (!acc[customerId]) {
      acc[customerId] = {
        customerId,
        customerName,
        customerPhone: sale.customer?.phone,
        totalDebt: 0,
        sales: []
      }
    }

    if (sale.status !== 'paid') {
      acc[customerId].totalDebt += Number(sale.remainingBalance || 0)
    }
    acc[customerId].sales.push(sale)

    return acc
  }, {} as Record<string, {
    customerId: string;
    customerName: string;
    customerPhone?: string;
    totalDebt: number;
    sales: CreditSale[]
  }>)

  const customersWithDebt = Object.values(groupedByCustomer)
    .filter(customer => customer.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt)

  const handleAddPayment = async () => {
    if (!selectedCustomer || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingrese un monto válido',
        variant: 'destructive'
      })
      return
    }

    const amount = parseFloat(paymentAmount)

    // Calcular la deuda actual del cliente desde los datos actualizados
    const currentCustomerData = customersWithDebt.find(c => c.customerId === selectedCustomer.id)
    const currentTotalDebt = Number(currentCustomerData?.totalDebt || 0)

    console.log('[CreditManager] Validando pago:', {
      amount,
      currentTotalDebt,
      amountType: typeof amount,
      debtType: typeof currentTotalDebt,
      comparison: amount > currentTotalDebt
    })

    // Si el monto es mayor que la deuda, ajustarlo automáticamente
    // Esto maneja casos donde el usuario redondea hacia arriba (ej: $6804 para pagar $6803.88)
    let finalAmount = amount
    if (amount > currentTotalDebt) {
      const difference = amount - currentTotalDebt
      // Si la diferencia es pequeña (menos de $1), ajustar al monto exacto
      if (difference < 1) {
        finalAmount = currentTotalDebt
        console.log('[CreditManager] Ajustando monto de pago:', {
          original: amount,
          adjusted: finalAmount,
          difference
        })
      } else {
        // Si la diferencia es mayor a $1, es un error real
        toast({
          title: 'Error',
          description: `El monto excede el saldo total pendiente. Deuda actual: $${currentTotalDebt.toFixed(2)}`,
          variant: 'destructive'
        })
        return
      }
    }

    try {
      // Obtener todas las ventas pendientes del cliente ordenadas por fecha (FIFO)
      const customerSales = creditSales
        .filter(sale => sale.customerId === selectedCustomer.id && sale.status !== 'paid')
        .sort((a, b) => new Date(a.saleDate || a.createdAt).getTime() - new Date(b.saleDate || b.createdAt).getTime())

      // Usar el monto final (ya ajustado si es necesario)
      const actualPaymentAmount = finalAmount

      let remainingAmount = actualPaymentAmount

      // Aplicar pagos FIFO (primero la venta más antigua)
      for (const sale of customerSales) {
        if (remainingAmount <= 0) break

        const saleRemainingBalance = Number(sale.remainingBalance || 0)
        const paymentForThisSale = Math.min(remainingAmount, saleRemainingBalance)

        console.log('[CreditManager] Aplicando pago a venta:', {
          saleId: sale.id,
          saleNumber: sale.saleNumber,
          saleRemainingBalance,
          paymentForThisSale,
          remainingAmount
        })

        await creditService.addPayment(
          sale.id,
          {
            amount: paymentForThisSale,
            paymentMethod,
            notes: paymentNotes || `Abono de ${formatCurrency(actualPaymentAmount)} (FIFO)`
          },
          token!
        )

        remainingAmount -= paymentForThisSale
      }

      toast({
        title: 'Pago Registrado',
        description: `Se ha registrado un pago de ${formatCurrency(actualPaymentAmount)} para ${selectedCustomer.name}`,
      })

      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentNotes('')
      setSelectedCustomer(null)

      // Si el pago fue en efectivo, refrescar el resumen de la caja
      if (paymentMethod === 'cash') {
        console.log('[CreditManager] Abono en efectivo detectado, refrescando resumen de caja...');
        useCashRegisterStore.getState().refreshSummary(token!)
      }

      await loadCreditData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el pago',
        variant: 'destructive'
      })
    }
  }

  // const handleSendReminder = async (creditSale: CreditSale) => {
  //   try {
  //     await creditService.sendPaymentReminder(creditSale.id, 'whatsapp', token!)
  //     toast({
  //       title: 'Recordatorio Enviado',
  //       description: 'Se ha enviado un recordatorio por WhatsApp',
  //     })
  //   } catch (error: any) {
  //     toast({
  //       title: 'Error',
  //       description: error.message || 'No se pudo enviar el recordatorio',
  //       variant: 'destructive'
  //     })
  //   }
  // }

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
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Créditos (Fiado)</h1>
            <p className="text-gray-600">Administra las ventas a crédito y registra los pagos</p>
          </div>
          <Button onClick={() => setShowCustomerManager(true)}>
            <Users className="w-4 h-4 mr-2" />
            Gestionar Clientes
          </Button>
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

        {/* Lista de Créditos por Cliente */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Créditos por Cliente {filterStatus !== 'all' && `(${filterStatus === 'pending' ? 'Pendientes' : filterStatus === 'paid' ? 'Pagados' : 'Vencidos'})`}
            </h2>
          </div>

          {customersWithDebt.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay clientes con deuda pendiente</p>
            </div>
          ) : (
            <div className="divide-y">
              {customersWithDebt.map((customerGroup) => (
                <motion.div
                  key={customerGroup.customerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4"
                >
                  {/* Encabezado del Cliente */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{customerGroup.customerName}</h3>
                        {customerGroup.customerPhone && (
                          <p className="text-sm text-gray-500">{customerGroup.customerPhone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Deuda Total</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(customerGroup.totalDebt)}
                        </p>
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedCustomer({
                            id: customerGroup.customerId,
                            name: customerGroup.customerName,
                            totalDebt: customerGroup.totalDebt
                          })
                          setShowPaymentModal(true)
                        }}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Registrar Abono
                      </Button>
                    </div>
                  </div>

                  {/* Lista de Ventas del Cliente */}
                  <div className="ml-16 space-y-3">
                    {customerGroup.sales
                      .sort((a, b) => new Date(a.saleDate || a.createdAt).getTime() - new Date(b.saleDate || b.createdAt).getTime())
                      .map((sale) => {
                        const daysOverdue = getDaysOverdue(sale.dueDate)

                        return (
                          <div
                            key={sale.id}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-700">
                                    {sale.saleNumber ? `Venta #${sale.saleNumber}` : 'Venta sin número'}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {formatDate(sale.saleDate)}
                                  </span>
                                  {getStatusBadge(sale.status)}
                                  {daysOverdue > 0 && (
                                    <Badge className="bg-red-100 text-red-800 text-xs">
                                      {daysOverdue} días vencido
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm">
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
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSaleForDetails(sale)
                                  setShowSaleDetailsModal(true)
                                }}
                              >
                                Ver Detalles
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Pago Simplificado */}
        <AnimatePresence>
          {showPaymentModal && selectedCustomer && (
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
                  className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Registrar Abono</h2>
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
                      <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm text-gray-600 mb-1">Deuda Total</p>
                      <p className="text-3xl font-bold text-red-600">
                        {formatCurrency(customersWithDebt.find(c => c.customerId === selectedCustomer.id)?.totalDebt || 0)}
                      </p>
                    </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm text-blue-800">
                      El pago se aplicará automáticamente a las deudas más antiguas primero (FIFO)
                    </AlertDescription>
                  </Alert>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Monto a Abonar
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0"
                        className="pl-10 text-lg"
                        autoFocus
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
                      placeholder="Ej: Abono quincenal"
                    />
                  </div>

                  {paymentAmount && parseFloat(paymentAmount) === (customersWithDebt.find(c => c.customerId === selectedCustomer.id)?.totalDebt || 0) && (
                    <Alert className="bg-green-50 border-green-200">
                      <Check className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Este pago liquidará completamente todas las deudas
                      </AlertDescription>
                    </Alert>
                  )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        className="flex-1"
                        onClick={handleAddPayment}
                        disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || (customersWithDebt.find(c => c.customerId === selectedCustomer.id)?.totalDebt || 0) === 0}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Registrar Abono
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

        {/* Modal de Detalles de Venta */}
        <AnimatePresence>
          {showSaleDetailsModal && selectedSaleForDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowSaleDetailsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Detalles de Venta</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSaleDetailsModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Información General */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Número de Venta</p>
                      <p className="font-semibold">
                        {selectedSaleForDetails.saleNumber || 'Sin número'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fecha</p>
                      <p className="font-semibold">
                        {formatDate(selectedSaleForDetails.saleDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-semibold">
                        {selectedSaleForDetails.customer?.name || 'Sin nombre'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado</p>
                      <div>{getStatusBadge(selectedSaleForDetails.status)}</div>
                    </div>
                  </div>

                  {/* Montos */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total de la Venta</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(selectedSaleForDetails.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Pagado</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(selectedSaleForDetails.paidAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saldo Pendiente</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(selectedSaleForDetails.remainingBalance)}
                      </p>
                    </div>
                  </div>

                  {/* Productos */}
                  {selectedSaleForDetails.sale?.items && selectedSaleForDetails.sale.items.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Productos
                      </h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium text-gray-600">Producto</th>
                              <th className="text-right p-3 text-sm font-medium text-gray-600">Cant.</th>
                              <th className="text-right p-3 text-sm font-medium text-gray-600">Precio</th>
                              <th className="text-right p-3 text-sm font-medium text-gray-600">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedSaleForDetails.sale.items.map((item: any, index: number) => (
                              <tr key={index}>
                                <td className="p-3 text-sm">{item.productName || 'Producto'}</td>
                                <td className="p-3 text-sm text-right">{item.quantity}</td>
                                <td className="p-3 text-sm text-right">{formatCurrency(item.price)}</td>
                                <td className="p-3 text-sm text-right font-medium">
                                  {formatCurrency(item.quantity * item.price)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Historial de Pagos */}
                  {selectedSaleForDetails.payments && selectedSaleForDetails.payments.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Historial de Pagos
                      </h3>
                      <div className="space-y-2">
                        {selectedSaleForDetails.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                          >
                            <div>
                              <p className="font-medium text-green-800">
                                {formatDate(payment.date)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {payment.paymentMethod === 'cash' ? 'Efectivo' :
                                 payment.paymentMethod === 'transfer' ? 'Transferencia' : 'Tarjeta'}
                                {payment.notes && ` - ${payment.notes}`}
                              </p>
                            </div>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setShowSaleDetailsModal(false)}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Gestión de Clientes */}
        <AnimatePresence>
          {showCustomerManager && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowCustomerManager(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Gestión de Clientes</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCustomerManager(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Aquí puedes ver y gestionar todos los clientes registrados en el sistema.
                    Los clientes con límite de crédito pueden hacer compras a crédito (fiado) desde el punto de venta.
                  </p>
                  <CustomerManager
                    alwaysOpen={true}
                    showCreditInfo={true}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}



