import { useState, useEffect } from 'react'
import { Calculator, DollarSign, CreditCard, Lock, Unlock, AlertTriangle, Banknote, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import { cashRegisterService } from '@/services/cashRegisterService'
import type { CashRegister, Expense } from '@/types'
import { RegisterStatus } from '@/types'

export default function CashRegisterView() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [actualCash, setActualCash] = useState('')
  const [openingAmount, setOpeningAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [registerSummary, setRegisterSummary] = useState<any>(null)
  
  // Estados para gastos
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('other')

  useEffect(() => {
    if (token) {
      loadRegisterData()
    }
  }, [token])

  const loadRegisterData = async () => {
    try {
      setLoading(true)
      const register = await cashRegisterService.getCurrentRegister(token!)
      setCurrentRegister(register)
      
      if (register) {
        const todayExpenses = await cashRegisterService.getTodayExpenses(token!)
        setExpenses(todayExpenses)
        
        const summary = await cashRegisterService.getRegisterSummary(token!)
        setRegisterSummary(summary)
      }
    } catch (error) {
      console.error('Error loading register data:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el estado de la caja',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRegister = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingrese un monto válido',
        variant: 'destructive'
      })
      return
    }

    try {
      const register = await cashRegisterService.openRegister(
        {
          openingAmount: parseFloat(openingAmount),
          notes
        },
        token!
      )
      setCurrentRegister(register)
      setOpeningAmount('')
      setNotes('')
      toast({
        title: 'Caja Abierta',
        description: 'La caja ha sido abierta exitosamente',
      })
      loadRegisterData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo abrir la caja',
        variant: 'destructive'
      })
    }
  }

  const handleCloseRegister = async () => {
    if (!actualCash || parseFloat(actualCash) < 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingrese el monto real en caja',
        variant: 'destructive'
      })
      return
    }

    try {
      await cashRegisterService.closeRegister(
        {
          actualAmount: parseFloat(actualCash),
          notes
        },
        token!
      )
      setCurrentRegister(null)
      setActualCash('')
      setNotes('')
      toast({
        title: 'Caja Cerrada',
        description: 'La caja ha sido cerrada exitosamente',
      })
      loadRegisterData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cerrar la caja',
        variant: 'destructive'
      })
    }
  }

  const handleAddExpense = async () => {
    if (!expenseAmount || !expenseDescription) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos del gasto',
        variant: 'destructive'
      })
      return
    }

    try {
      const expense = await cashRegisterService.addExpense(
        {
          amount: parseFloat(expenseAmount),
          description: expenseDescription,
          category: expenseCategory,
          notes: ''
        },
        token!
      )
      setExpenses([...expenses, expense])
      setExpenseAmount('')
      setExpenseDescription('')
      setExpenseCategory('other')
      setShowExpenseForm(false)
      toast({
        title: 'Gasto Registrado',
        description: 'El gasto ha sido registrado exitosamente',
      })
      loadRegisterData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el gasto',
        variant: 'destructive'
      })
    }
  }

  const calculateDifference = () => {
    if (!registerSummary || !actualCash) return 0
    const actual = parseFloat(actualCash) || 0
    return actual - registerSummary.expectedAmount
  }

  const isRegisterOpen = currentRegister?.status === RegisterStatus.OPEN

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando información de caja...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Gestión de Caja</h1>
            <Badge variant={isRegisterOpen ? 'success' : 'destructive'} className="text-base px-3 py-1">
              {isRegisterOpen ? (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Caja Abierta
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Caja Cerrada
                </>
              )}
            </Badge>
          </div>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('es-CO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {!isRegisterOpen ? (
          // Formulario para abrir caja
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Unlock className="w-5 h-5" />
                Abrir Caja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Monto de Apertura
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="100000"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="pl-10 text-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Notas (Opcional)
                </label>
                <Input
                  placeholder="Ej: Base de caja inicial"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <Button onClick={handleOpenRegister} className="w-full" size="lg">
                <Unlock className="w-5 h-5 mr-2" />
                Abrir Caja
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Resumen de Ventas */}
            {registerSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Base Inicial</span>
                      <Banknote className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(registerSummary.openingAmount)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Ventas Totales</span>
                      <DollarSign className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(registerSummary.totalSales)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Gastos</span>
                      <Minus className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(registerSummary.totalExpenses || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Efectivo Esperado</span>
                      <Calculator className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(registerSummary.expectedAmount)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Desglose por Método de Pago */}
            {registerSummary && registerSummary.salesByPaymentMethod && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Ventas por Método de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(registerSummary.salesByPaymentMethod).map(([method, amount]) => (
                      <div key={method} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1 capitalize">
                          {method === 'cash' ? 'Efectivo' : 
                           method === 'card' ? 'Tarjeta' :
                           method === 'nequi' ? 'Nequi' :
                           method === 'daviplata' ? 'Daviplata' :
                           method === 'credit' ? 'Crédito' : method}
                        </div>
                        <div className="text-lg font-bold">
                          {formatCurrency(amount as number)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gestión de Gastos */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Minus className="w-5 h-5" />
                  Gastos del Día
                </CardTitle>
                <Button onClick={() => setShowExpenseForm(!showExpenseForm)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Gasto
                </Button>
              </CardHeader>
              <CardContent>
                {showExpenseForm && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        type="number"
                        placeholder="Monto"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                      />
                      <Input
                        placeholder="Descripción"
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                      />
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="supplies">Insumos</option>
                        <option value="utilities">Servicios</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="other">Otros</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddExpense} size="sm">
                        Guardar
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowExpenseForm(false)
                          setExpenseAmount('')
                          setExpenseDescription('')
                        }} 
                        variant="outline" 
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                
                {expenses.length > 0 ? (
                  <div className="space-y-2">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-gray-500 capitalize">{expense.category}</p>
                        </div>
                        <div className="text-red-600 font-bold">
                          -{formatCurrency(expense.amount)}
                        </div>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-bold">
                      <span>Total Gastos</span>
                      <span className="text-red-600">
                        -{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay gastos registrados hoy
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cierre de Caja */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Cerrar Caja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Cuenta el efectivo real en caja y compáralo con el esperado.
                    El efectivo esperado incluye la base inicial más las ventas en efectivo menos los gastos.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Efectivo Esperado
                    </label>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(registerSummary?.expectedAmount || 0)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Efectivo Real Contado
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="0"
                        value={actualCash}
                        onChange={(e) => setActualCash(e.target.value)}
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>
                </div>

                {actualCash && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Diferencia</span>
                      <span className={`text-xl font-bold ${
                        calculateDifference() >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {calculateDifference() >= 0 ? '+' : ''}
                        {formatCurrency(calculateDifference())}
                      </span>
                    </div>
                    {calculateDifference() !== 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        {calculateDifference() > 0 
                          ? 'Hay un sobrante en caja'
                          : 'Hay un faltante en caja'}
                      </p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notas de Cierre (Opcional)
                  </label>
                  <Input
                    placeholder="Ej: Todo en orden, sin novedades"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleCloseRegister} 
                  className="w-full" 
                  size="lg"
                  variant="destructive"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Cerrar Caja
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}


