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
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import { reportsService } from '@/services/reportsService'
import type { ProductReport, SalesReport, CustomerReport, InventoryReport } from '@/services/reportsService'

export default function ReportsView() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('today')
  const [loading, setLoading] = useState(true)
  
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [productReports, setProductReports] = useState<ProductReport[]>([])
  const [customerReports, setCustomerReports] = useState<CustomerReport[]>([])
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null)
  
  useEffect(() => {
    if (token) {
      loadReports()
    }
  }, [token, dateRange])
  
  const loadReports = async () => {
    try {
      setLoading(true)
      
      // Calcular fechas según el rango seleccionado
      const endDate = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }
      
      const filters = { startDate, endDate }
      
      // Cargar todos los reportes en paralelo
      const [sales, products, customers, inventory] = await Promise.all([
        reportsService.getSalesReport(token!, filters),
        reportsService.getProductsReport(token!, filters),
        reportsService.getCustomersReport(token!, filters),
        reportsService.getInventoryReport(token!)
      ])
      
      setSalesReport(sales)
      setProductReports(products)
      setCustomerReports(customers)
      setInventoryReport(inventory)
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
  
  const handleDownloadReport = async (reportType: 'sales' | 'products' | 'customers' | 'inventory') => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }
      
      const blob = await reportsService.downloadReport(
        token!,
        reportType,
        'csv',
        { startDate, endDate }
      )
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-${reportType}-${dateRange}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Reporte Descargado',
        description: 'El reporte se ha descargado exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el reporte',
        variant: 'destructive'
      })
    }
  }
  
  
  
  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
              <p className="text-gray-600">Analiza el rendimiento de tu negocio</p>
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
                    <span className="text-sm text-gray-600">Ventas Totales</span>
                    <ShoppingCart className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold">{salesReport.totalSales}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.5%</span>
                    <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
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
                    <span className="text-sm text-gray-600">Ingresos</span>
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(salesReport.totalRevenue)}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+8.3%</span>
                    <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
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
                    <span className="text-sm text-gray-600">Ticket Promedio</span>
                    <CreditCard className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(salesReport.averageTicket)}</div>
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
                    <span className="text-sm text-gray-600">Créditos Pendientes</span>
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(salesReport.creditPending)}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">-15.2%</span>
                    <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
        
        {/* Tabs de Contenido */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="bg-white">
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
          </TabsList>
          
          {/* Tab de Ventas */}
          <TabsContent value="sales" className="space-y-4">
            {salesReport && (
              <>
                {/* Ventas por Método de Pago */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Ventas por Método de Pago</CardTitle>
                    <Button size="sm" onClick={() => handleDownloadReport('sales')}>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(salesReport.salesByPaymentMethod).map(([method, amount]) => {
                        const methodLabels: Record<string, string> = {
                          cash: 'Efectivo',
                          card: 'Tarjeta',
                          nequi: 'Nequi',
                          daviplata: 'Daviplata',
                          credit: 'Crédito'
                        }
                        
                        return (
                          <div key={method} className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">
                              {methodLabels[method] || method}
                            </p>
                            <p className="text-xl font-bold">
                              {formatCurrency(amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {salesReport.totalRevenue > 0 
                                ? `${Math.round((amount / salesReport.totalRevenue) * 100)}%`
                                : '0%'
                              } del total
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Gráfico de Ventas por Hora */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Ventas por Hora</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between gap-2">
                      {Object.entries(salesReport.salesByHour).map(([hour, count]) => {
                        const maxCount = Math.max(...Object.values(salesReport.salesByHour))
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                        
                        return (
                          <div key={hour} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-blue-500 rounded-t"
                              style={{ height: `${height}%` }}
                              title={`${count} ventas`}
                            />
                            <span className="text-xs text-gray-500 mt-1">
                              {hour}h
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          {/* Tab de Productos */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Productos Más Vendidos</CardTitle>
                <Button size="sm" onClick={() => handleDownloadReport('products')}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </CardHeader>
              <CardContent>
                {productReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay datos de productos para mostrar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productReports.slice(0, 10).map((report, index) => (
                      <div key={report.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{report.product.name}</p>
                            <p className="text-sm text-gray-500">SKU: {report.product.sku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(report.revenue)}</p>
                          <p className="text-sm text-gray-500">{report.quantity} unidades</p>
                          {report.profitMargin !== undefined && (
                            <p className="text-xs text-green-600">
                              Margen: {report.profitMargin.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Alertas de Inventario */}
            {inventoryReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventoryReport.lowStockProducts.length > 0 && (
                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          <span className="font-medium">Stock Bajo:</span> {inventoryReport.lowStockProducts.length} productos necesitan reabastecimiento
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {inventoryReport.outOfStockProducts.length > 0 && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <span className="font-medium">Sin Stock:</span> {inventoryReport.outOfStockProducts.length} productos están agotados
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Productos</p>
                        <p className="text-2xl font-bold">{inventoryReport.totalProducts}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Valor Total</p>
                        <p className="text-2xl font-bold">{formatCurrency(inventoryReport.totalValue)}</p>
                      </div>
                    </div>
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
                <Button size="sm" onClick={() => handleDownloadReport('customers')}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
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
                      <div key={report.customerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{report.customerName}</p>
                            <p className="text-sm text-gray-500">
                              {report.totalPurchases} compras
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(report.totalSpent)}</p>
                          <p className="text-sm text-gray-500">
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
          <TabsContent value="inventory" className="space-y-4">
            {inventoryReport && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Estado del Inventario</CardTitle>
                    <Button size="sm" onClick={() => handleDownloadReport('inventory')}>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Productos</p>
                        <p className="text-2xl font-bold">{inventoryReport.totalProducts}</p>
                        <p className="text-xs text-gray-500 mt-1">En inventario</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Valor Total</p>
                        <p className="text-2xl font-bold">{formatCurrency(inventoryReport.totalValue)}</p>
                        <p className="text-xs text-gray-500 mt-1">Valor del inventario</p>
                      </div>
                      
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600">Productos Críticos</p>
                        <p className="text-2xl font-bold">
                          {inventoryReport.lowStockProducts.length + inventoryReport.outOfStockProducts.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
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
        </Tabs>
      </div>
    </div>
  )
}


