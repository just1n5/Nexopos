import React, { useState, useEffect, useMemo } from 'react'
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
  Filter,
  BarChart3,
  LineChart,
  PieChart,
  ArrowUp,
  ArrowDown,
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
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { usePOSStore } from '@/stores/posStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { PaymentMethod, type Sale, type Product } from '@/types'

interface SalesMetrics {
  totalSales: number
  totalRevenue: number
  averageTicket: number
  topProducts: Array<{ product: Product; quantity: number; revenue: number }>
  salesByPaymentMethod: Record<PaymentMethod, number>
  salesByHour: Record<number, number>
  creditSales: number
  creditPending: number
}

export default function ReportsView() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('today')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'sales' | 'products'>('revenue')
  const [sales, setSales] = useState<Sale[]>([])
  
  const { products } = useInventoryStore()
  const { sessions, currentSession } = useCashRegisterStore()
  
  // Cargar ventas desde localStorage
  useEffect(() => {
    const loadSales = () => {
      const salesData = JSON.parse(localStorage.getItem('nexopos_sales') || '[]')
      setSales(salesData.map((sale: any) => ({
        ...sale,
        date: new Date(sale.date)
      })))
    }
    
    loadSales()
    const interval = setInterval(loadSales, 5000) // Actualizar cada 5 segundos
    return () => clearInterval(interval)
  }, [])
  
  // Filtrar ventas por rango de fecha
  const filteredSales = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.date)
      
      switch (dateRange) {
        case 'today':
          return saleDate >= today
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return saleDate >= weekAgo
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return saleDate >= monthAgo
        case 'year':
          const yearAgo = new Date(today)
          yearAgo.setFullYear(yearAgo.getFullYear() - 1)
          return saleDate >= yearAgo
        default:
          return true
      }
    })
  }, [sales, dateRange])
  
  // Calcular mÃ©tricas
  const metrics = useMemo((): SalesMetrics => {
    const totalSales = filteredSales.length
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
    
    // Productos mÃ¡s vendidos
    const productSales: Record<string, { product: Product; quantity: number; revenue: number }> = {}
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.product.id) || item.product
        if (!productSales[product.id]) {
          productSales[product.id] = {
            product,
            quantity: 0,
            revenue: 0
          }
        }
        productSales[product.id].quantity += item.quantity
        productSales[product.id].revenue += item.total
      })
    })
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    
    // Ventas por mÃ©todo de pago
    const salesByPaymentMethod: Record<string, number> = {}
    filteredSales.forEach(sale => {
      if (!salesByPaymentMethod[sale.paymentMethod]) {
        salesByPaymentMethod[sale.paymentMethod] = 0
      }
      salesByPaymentMethod[sale.paymentMethod] += sale.total
    })
    
    // Ventas por hora
    const salesByHour: Record<number, number> = {}
    for (let i = 0; i < 24; i++) {
      salesByHour[i] = 0
    }
    
    filteredSales.forEach(sale => {
      const hour = new Date(sale.date).getHours()
      salesByHour[hour] += sale.total
    })
    
    // Ventas a crÃ©dito
    const creditSales = filteredSales
      .filter(sale => sale.paymentMethod === PaymentMethod.CREDIT)
      .reduce((sum, sale) => sum + sale.total, 0)
    
    // Calcular crÃ©dito pendiente
    let creditPending = 0
    filteredSales
      .filter(sale => sale.paymentMethod === PaymentMethod.CREDIT)
      .forEach(sale => {
        const payments = JSON.parse(localStorage.getItem(`nexopos_payments_${sale.id}`) || '[]')
        const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0)
        creditPending += sale.total - totalPaid
      })
    
    return {
      totalSales,
      totalRevenue,
      averageTicket,
      topProducts,
      salesByPaymentMethod: salesByPaymentMethod as Record<PaymentMethod, number>,
      salesByHour,
      creditSales,
      creditPending
    }
  }, [filteredSales, products])
  
  // Comparar con perÃ­odo anterior
  const previousPeriodMetrics = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let previousSales: Sale[] = []
    
    switch (dateRange) {
      case 'today':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        previousSales = sales.filter(sale => {
          const saleDate = new Date(sale.date)
          return saleDate >= yesterday && saleDate < today
        })
        break
      case 'week':
        const twoWeeksAgo = new Date(today)
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        previousSales = sales.filter(sale => {
          const saleDate = new Date(sale.date)
          return saleDate >= twoWeeksAgo && saleDate < weekAgo
        })
        break
      case 'month':
        const twoMonthsAgo = new Date(today)
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        previousSales = sales.filter(sale => {
          const saleDate = new Date(sale.date)
          return saleDate >= twoMonthsAgo && saleDate < monthAgo
        })
        break
      case 'year':
        const twoYearsAgo = new Date(today)
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
        const yearAgo = new Date(today)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        previousSales = sales.filter(sale => {
          const saleDate = new Date(sale.date)
          return saleDate >= twoYearsAgo && saleDate < yearAgo
        })
        break
    }
    
    return {
      totalRevenue: previousSales.reduce((sum, sale) => sum + sale.total, 0),
      totalSales: previousSales.length
    }
  }, [sales, dateRange])
  
  // Calcular cambios porcentuales
  const revenueChange = previousPeriodMetrics.totalRevenue > 0
    ? ((metrics.totalRevenue - previousPeriodMetrics.totalRevenue) / previousPeriodMetrics.totalRevenue) * 100
    : 0
  
  const salesChange = previousPeriodMetrics.totalSales > 0
    ? ((metrics.totalSales - previousPeriodMetrics.totalSales) / previousPeriodMetrics.totalSales) * 100
    : 0
  
  // Obtener nombre del mÃ©todo de pago
  const getPaymentMethodName = (method: PaymentMethod) => {
    const names = {
      [PaymentMethod.CASH]: 'Efectivo',
      [PaymentMethod.CARD]: 'Tarjeta',
      [PaymentMethod.NEQUI]: 'Nequi',
      [PaymentMethod.DAVIPLATA]: 'Daviplata',
      [PaymentMethod.CREDIT]: 'CrÃ©dito'
    }
    return names[method] || method
  }
  
  // Exportar reporte
  const exportReport = () => {
    const report = {
      period: dateRange,
      date: new Date().toISOString(),
      metrics: {
        totalRevenue: metrics.totalRevenue,
        totalSales: metrics.totalSales,
        averageTicket: metrics.averageTicket,
        creditPending: metrics.creditPending
      },
      topProducts: metrics.topProducts.map(p => ({
        name: p.product.name,
        quantity: p.quantity,
        revenue: p.revenue
      })),
      paymentMethods: Object.entries(metrics.salesByPaymentMethod).map(([method, amount]) => ({
        method: getPaymentMethodName(method as PaymentMethod),
        amount
      }))
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-${dateRange}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reportes y AnalÃ­ticas</h1>
          <p className="text-gray-600">AnÃ¡lisis detallado de tu negocio</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Ãšltima semana</SelectItem>
              <SelectItem value="month">Ãšltimo mes</SelectItem>
              <SelectItem value="year">Ãšltimo aÃ±o</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* MÃ©tricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(metrics.totalRevenue)}
              </p>
              {revenueChange !== 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {revenueChange > 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    revenueChange > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(revenueChange).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs perÃ­odo anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Ventas Totales</p>
                <ShoppingCart className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold">
                {metrics.totalSales}
              </p>
              {salesChange !== 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {salesChange > 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    salesChange > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(salesChange).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs perÃ­odo anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Ticket Promedio</p>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(metrics.averageTicket)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Por transacciÃ³n
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">CrÃ©dito Pendiente</p>
                <CreditCard className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(metrics.creditPending)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Por cobrar
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Tabs de anÃ¡lisis */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="payments">MÃ©todos de Pago</TabsTrigger>
          <TabsTrigger value="hourly">Por Hora</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Productos MÃ¡s Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No hay datos de productos para mostrar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.topProducts.map((item, index) => (
                    <div key={item.product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} unidades vendidas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {formatCurrency(item.revenue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {((item.revenue / metrics.totalRevenue) * 100).toFixed(1)}% del total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">MÃ©todos de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(metrics.salesByPaymentMethod).length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No hay datos de pagos para mostrar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(metrics.salesByPaymentMethod).map(([method, amount]) => {
                    const percentage = (amount / metrics.totalRevenue) * 100
                    return (
                      <div key={method} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {getPaymentMethodName(method as PaymentMethod)}
                          </span>
                          <span className="text-sm font-bold">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {percentage.toFixed(1)}% del total
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ventas por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(metrics.salesByHour).map(([hour, amount]) => {
                  const maxAmount = Math.max(...Object.values(metrics.salesByHour))
                  const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
                  const hourNum = parseInt(hour)
                  const hourLabel = `${hourNum.toString().padStart(2, '0')}:00`
                  
                  return (
                    <div key={hour} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-12">
                        {hourLabel}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className={`h-6 rounded-full transition-all duration-500 ${
                            amount > 0 ? 'bg-primary' : 'bg-gray-300'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                        {amount > 0 && (
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium">
                            {formatCurrency(amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Alertas y sugerencias */}
      <div className="mt-6 space-y-3">
        {metrics.creditPending > metrics.totalRevenue * 0.3 && (
          <Alert variant="warning" className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Alto crÃ©dito pendiente:</strong> Tienes {formatCurrency(metrics.creditPending)} en crÃ©ditos por cobrar, 
              que representa el {((metrics.creditPending / metrics.totalRevenue) * 100).toFixed(1)}% de tus ingresos totales.
              Considera hacer seguimiento a estos clientes.
            </AlertDescription>
          </Alert>
        )}
        
        {metrics.topProducts.length > 0 && metrics.topProducts[0].quantity > 50 && (
          <Alert className="border-green-200 bg-green-50">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Producto estrella:</strong> {metrics.topProducts[0].product.name} es tu producto mÃ¡s vendido
              con {metrics.topProducts[0].quantity} unidades. AsegÃºrate de mantener suficiente inventario.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
