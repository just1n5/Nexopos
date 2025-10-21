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
import { useCashRegisterStore } from '@/stores/cashRegisterStore'
import { RegisterStatus } from '@/types'

export default function CashRegisterView() {
  const { token } = useAuthStore()
  const { toast } = useToast()

  // Local state for form inputs only
  const [actualCash, setActualCash] = useState('')
  const [openingAmount, setOpeningAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('other')
  const [showInsufficientFundsModal, setShowInsufficientFundsModal] = useState(false)

  // State from the global store
  const {
    summary,
    currentRegister,
    expenses,
    loading,
    error,
    fetchCurrentData,
    openRegister,
    closeRegister,
    addExpense
  } = useCashRegisterStore()

  useEffect(() => {
    if (token) {
      fetchCurrentData(token)
    }
  }, [token, fetchCurrentData])

  // Display errors from the store
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive'
      })
    }
  }, [error, toast])

  const handleOpenRegister = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      toast({ title: 'Error', description: 'Por favor ingrese un monto válido', variant: 'destructive' })
      return
    }
    try {
      await openRegister({ openingAmount: parseFloat(openingAmount), notes }, token!)
      setOpeningAmount('')
      setNotes('')
      toast({ title: 'Caja Abierta', description: 'La caja ha sido abierta exitosamente' })
    } catch (e: any) {
      // Error is already set in the store, but we can show a toast too
      toast({ title: 'Error al Abrir Caja', description: e.message, variant: 'destructive' })
    }
  }

  const handleCloseRegister = async () => {
    if (!actualCash || parseFloat(actualCash) < 0) {
      toast({ title: 'Error', description: 'Por favor ingrese el monto real en caja', variant: 'destructive' })
      return
    }
    try {
      await closeRegister({ actualAmount: parseFloat(actualCash), notes }, token!)
      setActualCash('')
      setNotes('')
      toast({ title: 'Caja Cerrada', description: 'La caja ha sido cerrada exitosamente' })
    } catch (e: any) {
      toast({ title: 'Error al Cerrar Caja', description: e.message, variant: 'destructive' })
    }
  }

  const handleAddExpense = async () => {
    if (!expenseAmount || !expenseDescription) {
      toast({ title: 'Error', description: 'Complete todos los campos del gasto', variant: 'destructive' })
      return
    }
    try {
      await addExpense({ amount: parseFloat(expenseAmount), description: expenseDescription, category: expenseCategory, notes: '' }, token!)
      setExpenseAmount('')
      setExpenseDescription('')
      setExpenseCategory('other')
      setShowExpenseForm(false)
      toast({ title: 'Gasto Registrado', description: 'El gasto ha sido registrado exitosamente' })
    } catch (e: any) {
      if (e.message === 'Insufficient funds in cash register') {
        setShowInsufficientFundsModal(true)
      } else {
        toast({ title: 'Error al Registrar Gasto', description: e.message, variant: 'destructive' })
      }
    }
  }

  const calculateDifference = () => {
    if (!summary || !actualCash) return 0
    const actual = parseFloat(actualCash) || 0
    return actual - (summary.expectedAmount || 0)
  }

  const isRegisterOpen = currentRegister?.status === RegisterStatus.OPEN

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando información de caja...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground select-none">Gestión de Caja</h1>
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
          <p className="text-muted-foreground select-none">
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
              <CardTitle className="flex items-center gap-2 select-none">
                <Unlock className="w-5 h-5" />
                Abrir Caja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 select-none">
                  Monto de Apertura
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Ej: 100000"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="pl-10 text-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 select-none">
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
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Base Inicial</span>
                      <Banknote className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(summary.openingAmount)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Ventas Totales</span>
                      <DollarSign className="w-4 h-4 text-success" />
                    </div>
                    <div className="text-2xl font-bold text-success">
                      {formatCurrency(summary.totalSales)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Gastos</span>
                      <Minus className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="text-2xl font-bold text-destructive">
                      {formatCurrency(summary.totalExpenses || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Efectivo Esperado</span>
                      <Calculator className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(summary.expectedAmount)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Desglose por Método de Pago */}
            {summary && summary.salesByPaymentMethod && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 select-none">
                    <CreditCard className="w-5 h-5" />
                    Ventas por Método de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(summary.salesByPaymentMethod).map(([method, amount]) => (
                      <div key={method} className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1 capitalize">
                          {method === 'cash' ? 'Efectivo' :
                           method === 'card' ? 'Tarjeta' :
                           method === 'nequi' ? 'Nequi' :
                           method === 'daviplata' ? 'Daviplata' :
                           method === 'credit' ? 'Crédito' : method}
                        </div>
                        <div className="text-lg font-bold text-foreground">
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
                <CardTitle className="flex items-center gap-2 select-none">
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
                  <div className="mb-4 p-4 bg-muted rounded-lg space-y-3">
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
                        className="w-full px-3 py-2 border rounded-md bg-card border-border text-foreground"
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
                      <div key={expense.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{expense.description}</p>
                          <p className="text-sm text-muted-foreground capitalize">{expense.category}</p>
                        </div>
                        <div className="text-destructive font-bold">
                          -{formatCurrency(expense.amount)}
                        </div>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-bold">
                      <span>Total Gastos</span>
                      <span className="text-destructive">
                        -{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hay gastos registrados hoy
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cierre de Caja */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 select-none">
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
                    <label className="block text-sm font-medium mb-2 select-none">
                      Efectivo Esperado
                    </label>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(summary?.expectedAmount || 0)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 select-none">
                      Efectivo Real Contado
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
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
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Diferencia</span>
                      <span className={`text-xl font-bold ${
                        Math.abs(calculateDifference()) < 0.01 ? 'text-muted-foreground' :
                        calculateDifference() > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {calculateDifference() > 0 ? '+' : ''}
                        {formatCurrency(calculateDifference())}
                      </span>
                    </div>
                    {Math.abs(calculateDifference()) >= 0.01 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {calculateDifference() > 0
                          ? 'Hay un sobrante en caja'
                          : 'Hay un faltante en caja'}
                      </p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2 select-none">
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

        {showInsufficientFundsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card text-card-foreground rounded-lg max-w-md w-full p-6 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-bold mb-2">Fondos Insuficientes</h2>
              <p className="text-muted-foreground mb-6">
                El efectivo actual en caja es insuficiente para registrar este gasto. Por favor, verifique el monto o ajuste el efectivo en caja.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => setShowInsufficientFundsModal(false)} className="flex-1">
                  Aceptar
                </Button>
                <Button onClick={() => setShowInsufficientFundsModal(false)} variant="destructive" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}