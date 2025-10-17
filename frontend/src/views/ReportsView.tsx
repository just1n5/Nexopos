import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  Download,
  AlertCircle,
  Clock,
  CreditCard,
  Calculator,
  ArrowUpDown
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/reports/KPICard'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import { reportsService } from '@/services/reportsService'
import type { ProductReport, SalesReport, CustomerReport, InventoryReport, CashRegisterReport, InventoryMovementsReport } from '@/services/reportsService'
import {
  getTodayRangeColombia,
  getWeekRangeColombia,
  getMonthRangeColombia,
  getYearRangeColombia
} from '@/lib/timezone'

export default function ReportsView() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('today')
  const [loading, setLoading] = useState(true)
  
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [productReports, setProductReports] = useState<ProductReport[]>([])
  const [customerReports, setCustomerReports] = useState<CustomerReport[]>([])
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null)
  const [cashRegisterReport, setCashRegisterReport] = useState<CashRegisterReport | null>(null)
  const [movementsReport, setMovementsReport] = useState<InventoryMovementsReport | null>(null)
  
  useEffect(() => {
    if (token) {
      loadReports()
    }
  }, [token, dateRange])

  // Deshabilitar navegación con PageDown/PageUp en tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PageDown' || e.key === 'PageUp') {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  const loadReports = async () => {
    try {
      setLoading(true)

      // Calcular fechas según el rango seleccionado en timezone de Colombia
      let dateRangeFilters: { startDate: Date; endDate: Date }

      switch (dateRange) {
        case 'today':
          dateRangeFilters = getTodayRangeColombia()
          break
        case 'week':
          dateRangeFilters = getWeekRangeColombia()
          break
        case 'month':
          dateRangeFilters = getMonthRangeColombia()
          break
        case 'year':
          dateRangeFilters = getYearRangeColombia()
          break
        default:
          dateRangeFilters = getTodayRangeColombia()
      }

      const filters = dateRangeFilters

      // Cargar todos los reportes en paralelo
      const [sales, products, customers, inventory, cashRegister, movements] = await Promise.all([
        reportsService.getSalesReport(token!, filters),
        reportsService.getProductsReport(token!, filters),
        reportsService.getCustomersReport(token!, filters),
        reportsService.getInventoryReport(token!),
        reportsService.getCashRegisterReport(token!, filters),
        reportsService.getInventoryMovementsReport(token!, filters)
      ])

      setSalesReport(sales)
      setProductReports(products)
      setCustomerReports(customers)
      setInventoryReport(inventory)
      setCashRegisterReport(cashRegister)
      setMovementsReport(movements)
    } catch (error) {
      console.error('Error loading reports:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleDownloadExcel = (reportType: 'sales' | 'products' | 'customers' | 'inventory' | 'movements') => {
    try {
      let data: any[] = []
      let sheetName = 'Reporte'

      switch (reportType) {
        case 'sales':
          if (!salesReport) return
          data = [
            { Métrica: 'Total Ventas', Valor: salesReport.totalSales },
            { Métrica: 'Monto Ventas', Valor: salesReport.totalSalesAmount },
            { Métrica: 'Ingresos', Valor: salesReport.totalIncome },
            { Métrica: 'Ventas a Crédito', Valor: salesReport.totalCreditSales },
            { Métrica: 'Ticket Promedio', Valor: salesReport.averageTicket },
            {},
            { 'Método de Pago': 'Método', 'Monto': 'Monto' },
            ...Object.entries(salesReport.salesByPaymentMethod).map(([method, amount]) => ({
              'Método de Pago': method,
              'Monto': amount
            }))
          ]
          sheetName = 'Ventas'
          break

        case 'products':
          data = productReports.map((report, index) => ({
            '#': index + 1,
            'Producto': report.product.name,
            'SKU': report.product.sku,
            'Cantidad': report.quantity,
            'Ingresos': report.revenue,
            'Margen': report.profitMargin || 0
          }))
          sheetName = 'Productos'
          break

        case 'customers':
          data = customerReports.map((report, index) => ({
            '#': index + 1,
            'Cliente': report.customerName,
            'Total Compras': report.totalPurchases,
            'Total Gastado': report.totalSpent,
            'Compra Promedio': report.averagePurchase,
            'Última Compra': new Date(report.lastPurchase).toLocaleDateString('es-CO')
          }))
          sheetName = 'Clientes'
          break

        case 'inventory':
          if (!inventoryReport) return
          // Incluir resumen general primero
          data = [
            { 'Métrica': 'Total Productos', 'Valor': inventoryReport.totalProducts },
            { 'Métrica': 'Valor Total Inventario', 'Valor': inventoryReport.totalValue },
            { 'Métrica': 'Productos Stock Bajo', 'Valor': inventoryReport.lowStockProducts.length },
            { 'Métrica': 'Productos Agotados', 'Valor': inventoryReport.outOfStockProducts.length },
            {},
            // Productos con alertas
            ...inventoryReport.lowStockProducts.map((product) => ({
              'Producto': product.name,
              'SKU': product.sku,
              'Stock': (product as any).stock || 0,
              'Estado': 'Stock Bajo'
            })),
            ...inventoryReport.outOfStockProducts.map((product) => ({
              'Producto': product.name,
              'SKU': product.sku,
              'Stock': 0,
              'Estado': 'Agotado'
            }))
          ]
          sheetName = 'Inventario'
          break

        case 'movements':
          if (!movementsReport) return
          data = movementsReport.movements.slice(0, 500).map((mov) => ({
            'Fecha': new Date(mov.createdAt).toLocaleString('es-CO'),
            'Tipo': mov.movementType,
            'Producto ID': mov.productId,
            'Cantidad': mov.quantity,
            'Stock Anterior': mov.quantityBefore,
            'Stock Nuevo': mov.quantityAfter,
            'Costo Total': mov.totalCost,
            'Referencia': mov.referenceNumber || mov.referenceType || '-'
          }))
          sheetName = 'Movimientos'
          break
      }

      if (data.length === 0) {
        toast({
          title: 'Sin Datos',
          description: 'No hay datos para exportar',
          variant: 'destructive'
        })
        return
      }

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      XLSX.writeFile(wb, `reporte-${reportType}-${dateRange}.xlsx`)

      toast({
        title: 'Reporte Descargado',
        description: 'El archivo Excel se ha descargado exitosamente',
      })
    } catch (error) {
      console.error('Error downloading Excel:', error)
      toast({
        title: 'Error',
        description: 'No se pudo descargar el reporte',
        variant: 'destructive'
      })
    }
  }
  
  
  
  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="dark:text-white">Cargando reportes...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full bg-background overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold dark:text-gray-100">Reportes y Análisis</h1>
              <p className="text-gray-600 dark:text-gray-400">Analiza el rendimiento de tu negocio</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-40">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mes</SelectItem>
                  <SelectItem value="year">Último Año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Métricas Principales */}
        {salesReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1" title="Total facturado (incluye crédito)">
                      Ventas del Día
                      <AlertCircle className="w-3 h-3 text-gray-400" />
                    </span>
                    <ShoppingCart className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold dark:text-gray-100">{formatCurrency(salesReport.totalSalesAmount)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {salesReport.totalSales} {salesReport.totalSales === 1 ? 'venta' : 'ventas'}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1" title="Lo que entró en caja (excluye crédito)">
                      Ingresos del Día
                      <AlertCircle className="w-3 h-3 text-gray-400" />
                    </span>
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(salesReport.totalIncome)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Efectivo, tarjeta, digital
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ticket Promedio</span>
                    <CreditCard className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold dark:text-gray-100">{formatCurrency(salesReport.averageTicket)}</div>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">-3.2%</span>
                    <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1" title="Saldo a recuperar de ventas a crédito">
                      Créditos Pendientes
                      <AlertCircle className="w-3 h-3 text-gray-400" />
                    </span>
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{formatCurrency(salesReport.creditPending)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {salesReport.creditSalesCount} {salesReport.creditSalesCount === 1 ? 'crédito' : 'créditos'}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Fila adicional con métricas secundarias */}
        {salesReport && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Ventas a Crédito</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(salesReport.totalCreditSales)}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">Ticket Promedio</p>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100">{formatCurrency(salesReport.averageTicket)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Reconciliación</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Ventas = Ingresos + Créditos
                    </p>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                      {formatCurrency(salesReport.totalSalesAmount)} = {formatCurrency(salesReport.totalIncome)} + {formatCurrency(salesReport.totalCreditSales)}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Tabs de Contenido */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="bg-white dark:bg-gray-800">
            <TabsTrigger value="sales">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ventas
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-2" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="w-4 h-4 mr-2" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="cash-register">
              <Calculator className="w-4 h-4 mr-2" />
              Arqueos de Caja
            </TabsTrigger>
            <TabsTrigger value="movements">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Movimientos
            </TabsTrigger>
          </TabsList>
          
          {/* Tab de Ventas */}
          <TabsContent value="sales" className="space-y-4">
            {salesReport && (
              <>
                {/* Ventas por Método de Pago */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Ventas por Método de Pago</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">Suma de pagos recibidos por método (puede diferir del total de ventas por descuentos o redondeos)</p>
                    </div>
                    <Button size="sm" onClick={() => handleDownloadExcel('sales')}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {(() => {
                        const paymentMethods = [
                          {
                            key: 'cash',
                            label: 'Efectivo',
                            bgLight: 'bg-green-50',
                            bgDark: 'dark:bg-green-950',
                            borderLight: 'border-green-200',
                            borderDark: 'dark:border-green-800',
                            textLight: 'text-green-700',
                            textDark: 'dark:text-green-300',
                            icon: '💵'
                          },
                          {
                            key: 'card',
                            label: 'Tarjeta',
                            bgLight: 'bg-blue-50',
                            bgDark: 'dark:bg-blue-950',
                            borderLight: 'border-blue-200',
                            borderDark: 'dark:border-blue-800',
                            textLight: 'text-blue-700',
                            textDark: 'dark:text-blue-300',
                            icon: '💳'
                          },
                          {
                            key: 'nequi',
                            label: 'Nequi',
                            bgLight: 'bg-purple-50',
                            bgDark: 'dark:bg-purple-950',
                            borderLight: 'border-purple-200',
                            borderDark: 'dark:border-purple-800',
                            textLight: 'text-purple-700',
                            textDark: 'dark:text-purple-300',
                            icon: '📱'
                          },
                          {
                            key: 'daviplata',
                            label: 'Daviplata',
                            bgLight: 'bg-red-50',
                            bgDark: 'dark:bg-red-950',
                            borderLight: 'border-red-200',
                            borderDark: 'dark:border-red-800',
                            textLight: 'text-red-700',
                            textDark: 'dark:text-red-300',
                            icon: '💰'
                          },
                          {
                            key: 'credit',
                            label: 'Crédito',
                            bgLight: 'bg-yellow-50',
                            bgDark: 'dark:bg-yellow-950',
                            borderLight: 'border-yellow-200',
                            borderDark: 'dark:border-yellow-800',
                            textLight: 'text-yellow-700',
                            textDark: 'dark:text-yellow-300',
                            icon: '🏦'
                          }
                        ]

                        return paymentMethods.map((method) => {
                          const amount = salesReport.salesByPaymentMethod[method.key] || 0
                          const percentage = salesReport.totalSalesAmount > 0
                            ? Math.round((Number(amount) / salesReport.totalSalesAmount) * 100)
                            : 0

                          return (
                            <div
                              key={method.key}
                              className={`text-center p-4 rounded-lg border ${method.bgLight} ${method.bgDark} ${method.borderLight} ${method.borderDark} transition-all hover:shadow-md`}
                            >
                              <div className="text-2xl mb-2">{method.icon}</div>
                              <p className={`text-sm font-medium mb-2 ${method.textLight} ${method.textDark}`}>
                                {method.label}
                              </p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {formatCurrency(amount)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {percentage}% del total
                              </p>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Desglose de IVA por Tasa */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Desglose de IVA por Tasa
                      <Badge variant="outline" className="text-xs">Colombia - Resolución DIAN</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* IVA 19% */}
                      {salesReport.taxBreakdown.iva19.baseGravable > 0 && (
                        <KPICard
                          title="IVA 19%"
                          mainValue={formatCurrency(salesReport.taxBreakdown.iva19.ivaAmount)}
                          subLabels={[
                            { label: 'Base Gravable', value: formatCurrency(salesReport.taxBreakdown.iva19.baseGravable) }
                          ]}
                        />
                      )}

                      {/* IVA 5% */}
                      {salesReport.taxBreakdown.iva5.baseGravable > 0 && (
                        <KPICard
                          title="IVA 5%"
                          mainValue={formatCurrency(salesReport.taxBreakdown.iva5.ivaAmount)}
                          subLabels={[
                            { label: 'Base Gravable', value: formatCurrency(salesReport.taxBreakdown.iva5.baseGravable) }
                          ]}
                        />
                      )}

                      {/* Exento */}
                      {salesReport.taxBreakdown.iva0.baseGravable > 0 && (
                        <KPICard
                          title="Exento / Sin IVA"
                          mainValue={formatCurrency(0)}
                          subLabels={[
                            { label: 'Base', value: formatCurrency(salesReport.taxBreakdown.iva0.baseGravable) }
                          ]}
                        />
                      )}

                      {/* INC (si aplica) */}
                      {salesReport.taxBreakdown.inc.baseGravable > 0 && (
                        <KPICard
                          title="INC"
                          mainValue={formatCurrency(salesReport.taxBreakdown.inc.incAmount)}
                          subLabels={[
                            { label: 'Base', value: formatCurrency(salesReport.taxBreakdown.inc.baseGravable) }
                          ]}
                        />
                      )}

                      {/* Total */}
                      <KPICard
                        title="Total Impuestos"
                        mainValue={formatCurrency(salesReport.taxBreakdown.totalTax)}
                        variant="totalizador"
                        subLabels={[
                          { label: 'Base Total', value: formatCurrency(salesReport.taxBreakdown.totalBase) }
                        ]}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Gráfico de Ventas por Hora */}
                  <Card className="bg-white dark:bg-[#1F2937]">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Distribución de Ventas por Hora</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={Object.entries(salesReport.salesByHour).map(([hour, amount]) => ({
                            hour: `${hour}:00`,
                            ventas: Number(amount)
                          }))}
                        >
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#A78BFA" stopOpacity={1} />
                              <stop offset="100%" stopColor="#7C3AED" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="#6B7280"
                            strokeWidth={1}
                            opacity={0.5}
                          />
                          <XAxis
                            dataKey="hour"
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#6B7280' }}
                          />
                          <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#6B7280' }}
                          />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                              backgroundColor: 'var(--tooltip-bg)',
                              color: 'var(--tooltip-text)',
                              border: '1px solid var(--tooltip-border)',
                              borderRadius: '4px',
                              padding: '8px'
                            }}
                            labelStyle={{ color: 'var(--tooltip-text)' }}
                            cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
                          />
                          <Bar
                            dataKey="ventas"
                            fill="url(#barGradient)"
                            radius={[4, 4, 0, 0]}
                            animationDuration={800}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Ventas por Método de Pago con Gráfico de Dona */}
                  <Card className="bg-white dark:bg-[#1F2937]">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Ventas por Método de Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Columna Izquierda: Leyenda/Desglose */}
                        <div className="space-y-4">
                          {Object.entries(salesReport.salesByPaymentMethod).map(([method, amount]) => {
                            const methodLabels: Record<string, string> = {
                              cash: 'Efectivo',
                              card: 'Tarjeta',
                              bank_transfer: 'Transferencia',
                              nequi: 'Nequi',
                              daviplata: 'Daviplata',
                              credit: 'Crédito'
                            }

                            const colorMap: Record<string, string> = {
                              cash: '#5A31F4',
                              card: '#3b82f6',
                              bank_transfer: '#f59e0b',
                              nequi: '#ec4899',
                              daviplata: '#8b5cf6',
                              credit: '#ef4444'
                            }

                            const percentage = salesReport.totalSalesAmount > 0
                              ? Math.round((Number(amount) / salesReport.totalSalesAmount) * 100)
                              : 0;

                            return (
                              <div key={method} className="flex items-center gap-4">
                                {/* Círculo de color */}
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: colorMap[method] || '#6B7280' }}
                                />

                                {/* Información del método */}
                                <div className="flex-1">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {methodLabels[method] || method}
                                    </span>
                                    <span className="text-base font-bold text-gray-900 dark:text-white">
                                      {formatCurrency(Number(amount))}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {percentage}% del total
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Columna Derecha: Gráfico de Dona */}
                        <div className="flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={Object.entries(salesReport.salesByPaymentMethod).map(([method, amount]) => {
                                  const methodLabels: Record<string, string> = {
                                    cash: 'Efectivo',
                                    card: 'Tarjeta',
                                    bank_transfer: 'Transferencia',
                                    nequi: 'Nequi',
                                    daviplata: 'Daviplata',
                                    credit: 'Crédito'
                                  }
                                  return {
                                    name: methodLabels[method] || method,
                                    value: Number(amount),
                                    method: method
                                  }
                                })}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                              >
                                {Object.entries(salesReport.salesByPaymentMethod).map(([method], index) => {
                                  const colorMap: Record<string, string> = {
                                    cash: '#5A31F4',
                                    card: '#3b82f6',
                                    bank_transfer: '#f59e0b',
                                    nequi: '#ec4899',
                                    daviplata: '#8b5cf6',
                                    credit: '#ef4444'
                                  }
                                  return (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={colorMap[method] || '#6B7280'}
                                      className="transition-opacity hover:opacity-80 cursor-pointer"
                                    />
                                  )
                                })}
                              </Pie>
                              <Tooltip
                                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                                contentStyle={{
                                  backgroundColor: 'var(--tooltip-bg)',
                                  color: 'var(--tooltip-text)',
                                  border: '1px solid var(--tooltip-border)',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                }}
                                labelStyle={{ color: 'var(--tooltip-text)', fontWeight: 'bold' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>

                          {/* Valor Total en el Centro */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(salesReport.totalSalesAmount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Tab de Productos */}
          <TabsContent value="products" className="space-y-6">
            {/* Header Principal con Botón Exportar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Análisis de Productos Más Vendidos
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Visualización y detalle de rendimiento de productos
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadExcel('products')}
                className="border border-gray-300 dark:border-gray-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </div>

            {/* Gráfico de Barras Horizontales */}
            {productReports.length > 0 && (
              <Card className="bg-white dark:bg-[#1F2937]">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Top 10 Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart
                      data={productReports.slice(0, 10).map((report) => ({
                        name: report.product.name.length > 25
                          ? report.product.name.substring(0, 25) + '...'
                          : report.product.name,
                        ingresos: Number(report.revenue)
                      }))}
                      layout="vertical"
                      margin={{ left: 120, right: 80, top: 5, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="barProductGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#A78BFA" stopOpacity={1} />
                          <stop offset="100%" stopColor="#7C3AED" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="#6B7280"
                        strokeWidth={1}
                        opacity={0.3}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={{ stroke: '#6B7280' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
                        axisLine={{ stroke: '#6B7280' }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'var(--tooltip-bg)',
                          color: 'var(--tooltip-text)',
                          border: '1px solid var(--tooltip-border)',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                        labelStyle={{ color: 'var(--tooltip-text)', fontWeight: 'bold' }}
                        cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
                      />
                      <Bar
                        dataKey="ingresos"
                        fill="url(#barProductGradient)"
                        radius={[0, 8, 8, 0]}
                        barSize={20}
                        label={{
                          position: 'right',
                          formatter: (value: any) => formatCurrency(Number(value)),
                          fill: 'var(--chart-text)',
                          fontSize: 11
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Tabla Detallada de Productos */}
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos - Detalle</CardTitle>
              </CardHeader>
              <CardContent>
                {productReports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No hay datos de productos para mostrar</p>
                    <p className="text-sm text-gray-400 mt-2">Los productos vendidos aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Rango
                          </th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Producto
                          </th>
                          <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Unidades Vendidas
                          </th>
                          <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Ingresos Totales
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {productReports.slice(0, 10).map((report, index) => (
                          <tr
                            key={report.product.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="p-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {report.product.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  SKU: {report.product.sku}
                                </p>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {report.quantity}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                unidades
                              </p>
                            </td>
                            <td className="p-3 text-right">
                              <p className="font-bold text-lg text-gray-900 dark:text-white">
                                {formatCurrency(report.revenue)}
                              </p>
                              {report.profitMargin !== undefined && (
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  Margen: {report.profitMargin.toFixed(1)}%
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alertas de Inventario */}
            {inventoryReport && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Alertas de Inventario</CardTitle>
                    <a
                      href="/inventory"
                      className="text-sm font-medium text-[#5A31F4] hover:text-[#7C5BFF] transition-colors flex items-center gap-1"
                    >
                      Gestionar Inventario
                      <ArrowUpDown className="w-4 h-4 rotate-90" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tarjeta: Productos con Alerta */}
                    <KPICard
                      title="Productos con Alerta"
                      mainValue={String(
                        inventoryReport.lowStockProducts.length +
                        inventoryReport.outOfStockProducts.length
                      )}
                      variant="default"
                      subLabels={[
                        { label: 'Stock bajo', value: String(inventoryReport.lowStockProducts.length) },
                        { label: 'Sin stock', value: String(inventoryReport.outOfStockProducts.length) }
                      ]}
                    />

                    {/* Tarjeta: Valor Total en Alertas */}
                    <KPICard
                      title="Valor Total en Alertas"
                      mainValue={formatCurrency(inventoryReport.totalValue)}
                      variant="default"
                      subLabels={[
                        { label: 'Total productos', value: String(inventoryReport.totalProducts) }
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab de Clientes */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Mejores Clientes</CardTitle>
                <Button size="sm" onClick={() => handleDownloadExcel('customers')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </CardHeader>
              <CardContent>
                {customerReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay datos de clientes para mostrar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerReports.slice(0, 10).map((report, index) => (
                      <div key={report.customerId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-300">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium dark:text-white">{report.customerName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {report.totalPurchases} compras
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold dark:text-white">{formatCurrency(report.totalSpent)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Promedio: {formatCurrency(report.averagePurchase)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Última: {new Date(report.lastPurchase).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab de Inventario */}
          <TabsContent value="inventory" className="space-y-6">
            {inventoryReport && (
              <>
                {/* Header con Botón Exportar */}
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Estado del Inventario</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadExcel('inventory')}
                    className="border border-[#5A31F4] text-[#5A31F4] hover:bg-[#5A31F4] hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Excel
                  </Button>
                </div>

                {/* Tarjetas KPI de Estado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tarjeta: Total de Productos */}
                  <KPICard
                    title="Total de Productos"
                    mainValue={String(inventoryReport.totalProducts)}
                    subLabels={[
                      { label: 'En inventario', value: '' }
                    ]}
                  />

                  {/* Tarjeta: Valor Total del Inventario */}
                  <KPICard
                    title="Valor Total del Inventario"
                    mainValue={formatCurrency(inventoryReport.totalValue)}
                    subLabels={[
                      { label: 'Costo total de productos', value: '' }
                    ]}
                  />

                  {/* Tarjeta: Productos Críticos (Clickeable con Alerta) */}
                  <div
                    onClick={() => window.location.href = '/inventory'}
                    className="cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <div className="rounded-xl p-6 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 border-l-[3px] border-l-red-500 hover:bg-gray-50 dark:hover:bg-[#374151]">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <h3 className="text-base font-medium text-gray-600 dark:text-gray-400">
                          Productos Críticos
                        </h3>
                      </div>
                      <p className="text-[32px] font-bold text-gray-900 dark:text-white leading-none mb-2">
                        {inventoryReport.lowStockProducts.length + inventoryReport.outOfStockProducts.length}
                      </p>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requieren atención
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#5A31F4] font-medium">
                          <span>Click para gestionar</span>
                          <ArrowUpDown className="w-3 h-3 rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Productos con Stock Bajo */}
                {inventoryReport.lowStockProducts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-yellow-600">
                        <AlertCircle className="w-5 h-5 inline mr-2" />
                        Productos con Stock Bajo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {inventoryReport.lowStockProducts.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Stock: {product.stock}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Productos Agotados */}
                {inventoryReport.outOfStockProducts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">
                        <AlertCircle className="w-5 h-5 inline mr-2" />
                        Productos Agotados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {inventoryReport.outOfStockProducts.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                            </div>
                            <Badge className="bg-red-100 text-red-800">
                              Sin Stock
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab de Arqueos de Caja */}
          <TabsContent value="cash-register" className="space-y-4">
            {cashRegisterReport && cashRegisterReport.arqueos.length > 0 ? (
              <>
                {/* Resumen de Arqueos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Sesiones
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold dark:text-white">
                        {cashRegisterReport.summary.totalSessions}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Ventas Totales
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold dark:text-white">
                        {formatCurrency(cashRegisterReport.summary.totalSales)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Gastos Totales
                      </CardTitle>
                      <TrendingDown className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                        {formatCurrency(cashRegisterReport.summary.totalExpenses)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tasa de Discrepancias
                      </CardTitle>
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold dark:text-white">
                        {cashRegisterReport.summary.discrepancyRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {cashRegisterReport.summary.sessionsWithDiscrepancies} de {cashRegisterReport.summary.totalSessions} sesiones
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabla de Arqueos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Arqueos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2 font-medium text-gray-600 dark:text-gray-300">Sesión</th>
                            <th className="text-left p-2 font-medium text-gray-600 dark:text-gray-300">Fecha</th>
                            <th className="text-right p-2 font-medium text-gray-600 dark:text-gray-300">Apertura</th>
                            <th className="text-right p-2 font-medium text-gray-600 dark:text-gray-300">Esperado</th>
                            <th className="text-right p-2 font-medium text-gray-600 dark:text-gray-300">Contado</th>
                            <th className="text-right p-2 font-medium text-gray-600 dark:text-gray-300">Diferencia</th>
                            <th className="text-right p-2 font-medium text-gray-600 dark:text-gray-300">Ventas</th>
                            <th className="text-left p-2 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cashRegisterReport.arqueos.map((arqueo) => (
                            <tr key={arqueo.sessionId} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="p-2">
                                <div className="font-medium dark:text-white">{arqueo.sessionNumber}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {arqueo.totalTransactions} transacciones
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="text-sm dark:text-white">
                                  {new Date(arqueo.closedAt).toLocaleDateString('es-CO', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(arqueo.closedAt).toLocaleTimeString('es-CO', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td className="p-2 text-right dark:text-white">
                                {formatCurrency(arqueo.openingBalance)}
                              </td>
                              <td className="p-2 text-right dark:text-white">
                                {formatCurrency(arqueo.expectedBalance)}
                              </td>
                              <td className="p-2 text-right font-medium dark:text-white">
                                {formatCurrency(arqueo.actualBalance)}
                              </td>
                              <td className={`p-2 text-right font-medium ${
                                Math.abs(arqueo.difference) > 0
                                  ? arqueo.difference > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {arqueo.difference > 0 && '+'}
                                {formatCurrency(arqueo.difference)}
                              </td>
                              <td className="p-2 text-right dark:text-white">
                                {formatCurrency(arqueo.totalSales)}
                              </td>
                              <td className="p-2">
                                <Badge className={
                                  Math.abs(arqueo.difference) > 1000
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }>
                                  {Math.abs(arqueo.difference) > 1000 ? 'Con diferencia' : 'Cuadrado'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay arqueos de caja registrados
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Los arqueos de caja aparecer án aquí cuando se cierren sesiones de caja registradora en el rango de fechas seleccionado
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab de Movimientos de Inventario */}
          <TabsContent value="movements" className="space-y-4">
            {movementsReport && (
              <>
                {/* Resumen de Movimientos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Movimientos
                      </CardTitle>
                      <ArrowUpDown className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {movementsReport.summary.totalMovements}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Entradas
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        +{movementsReport.summary.totalIn.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(movementsReport.summary.totalCostIn)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Salidas
                      </CardTitle>
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        -{movementsReport.summary.totalOut.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(movementsReport.summary.totalCostOut)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Movimiento Neto
                      </CardTitle>
                      <Package className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${
                        movementsReport.summary.netMovement >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movementsReport.summary.netMovement >= 0 && '+'}
                        {movementsReport.summary.netMovement.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabla de Movimientos */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Últimos Movimientos</CardTitle>
                      <p className="text-sm text-gray-500">Máximo 500 movimientos más recientes</p>
                    </div>
                    <Button size="sm" onClick={() => handleDownloadExcel('movements')}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium text-gray-600">Fecha</th>
                            <th className="text-left p-2 font-medium text-gray-600">Tipo</th>
                            <th className="text-left p-2 font-medium text-gray-600">Producto</th>
                            <th className="text-right p-2 font-medium text-gray-600">Cantidad</th>
                            <th className="text-right p-2 font-medium text-gray-600">Stock Anterior</th>
                            <th className="text-right p-2 font-medium text-gray-600">Stock Nuevo</th>
                            <th className="text-right p-2 font-medium text-gray-600">Costo Total</th>
                            <th className="text-left p-2 font-medium text-gray-600">Referencia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movementsReport.movements.slice(0, 100).map((movement) => (
                            <tr key={movement.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="p-2 text-sm">
                                {new Date(movement.createdAt).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="p-2">
                                <Badge className={
                                  movement.quantity > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }>
                                  {movement.movementType}
                                </Badge>
                              </td>
                              <td className="p-2 text-sm">
                                <div className="font-medium">{movement.productId.slice(0, 8)}...</div>
                                {movement.productVariantId && (
                                  <div className="text-xs text-gray-500">
                                    Var: {movement.productVariantId.slice(0, 8)}...
                                  </div>
                                )}
                              </td>
                              <td className={`p-2 text-right font-medium ${
                                movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {movement.quantity > 0 && '+'}
                                {movement.quantity.toFixed(2)}
                              </td>
                              <td className="p-2 text-right text-gray-600">
                                {movement.quantityBefore.toFixed(2)}
                              </td>
                              <td className="p-2 text-right font-medium">
                                {movement.quantityAfter.toFixed(2)}
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(movement.totalCost)}
                              </td>
                              <td className="p-2 text-sm">
                                {movement.referenceNumber || movement.referenceType || '-'}
                                {movement.notes && (
                                  <div className="text-xs text-gray-500">{movement.notes}</div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


