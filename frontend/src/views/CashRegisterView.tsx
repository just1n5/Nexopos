import React, { useState } from 'react'
import { Calculator, DollarSign, CreditCard, Smartphone, Receipt, Lock, Unlock, AlertTriangle, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'

export default function CashRegisterView() {
  const [actualCash, setActualCash] = useState('')
  const isRegisterOpen = true // Simulado

  // Datos de ejemplo
  const cashRegisterData = {
    openingAmount: 100000,
    sales: {
      cash: 485000,
      card: 325000,
      nequi: 125000,
      daviplata: 45000,
      credit: 85000
    },
    expenses: 35000,
    expectedCash: 550000, // opening + cash sales - expenses
    totalSales: 1065000,
    transactionCount: 47
  }

  const calculateDifference = () => {
    const actual = parseFloat(actualCash) || 0
    return actual - cashRegisterData.expectedCash
  }

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">GestiÃ³n de Caja</h1>
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
            {isRegisterOpen 
              ? 'Caja abierta desde las 8:00 AM â€¢ 9 horas trabajadas'
              : 'La caja estÃ¡ cerrada. Abre la caja para comenzar a vender.'
            }
          </p>
        </div>

        {isRegisterOpen ? (
          <>
            {/* Resumen de ventas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ventas del DÃ­a</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(cashRegisterData.totalSales)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {cashRegisterData.transactionCount} transacciones
                      </p>
                    </div>
                    <Receipt className="w-10 h-10 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Efectivo Esperado</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(cashRegisterData.expectedCash)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Base + Ventas - Gastos
                      </p>
                    </div>
                    <Calculator className="w-10 h-10 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Gastos del DÃ­a</p>
                      <p className="text-3xl font-bold text-red-600">
                        {formatCurrency(cashRegisterData.expenses)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        3 gastos registrados
                      </p>
                    </div>
                    <DollarSign className="w-10 h-10 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desglose por mÃ©todo de pago */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Desglose por MÃ©todo de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Banknote className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Efectivo</span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(cashRegisterData.sales.cash)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Tarjetas</span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(cashRegisterData.sales.card)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Nequi</span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(cashRegisterData.sales.nequi)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">Daviplata</span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(cashRegisterData.sales.daviplata)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium">Fiado</span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(cashRegisterData.sales.credit)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cierre de caja */}
            <Card>
              <CardHeader>
                <CardTitle>Cerrar Caja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Base de caja inicial
                  </label>
                  <div className="text-2xl font-bold">{formatCurrency(cashRegisterData.openingAmount)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Efectivo esperado en caja
                  </label>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(cashRegisterData.expectedCash)}
                  </div>
                </div>

                <div>
                  <label htmlFor="actual-cash" className="block text-sm font-medium mb-2">
                    Efectivo real contado
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="actual-cash"
                      type="number"
                      placeholder="0"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="pl-8 text-lg font-medium h-12"
                    />
                  </div>
                </div>

                {actualCash && (
                  <div className={`p-4 rounded-lg ${
                    calculateDifference() === 0 
                      ? 'bg-green-50 border-green-200' 
                      : calculateDifference() > 0 
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-red-50 border-red-200'
                  } border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {calculateDifference() === 0 
                            ? 'âœ… Caja cuadrada perfectamente'
                            : calculateDifference() > 0
                              ? 'ðŸ“ˆ Sobrante en caja'
                              : 'âš ï¸ Faltante en caja'
                          }
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {formatCurrency(Math.abs(calculateDifference()))}
                        </p>
                      </div>
                      {calculateDifference() !== 0 && (
                        <AlertTriangle className={`w-8 h-8 ${
                          calculateDifference() > 0 ? 'text-blue-600' : 'text-red-600'
                        }`} />
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1">
                    Imprimir Reporte
                  </Button>
                  <Button 
                    className="flex-1"
                    disabled={!actualCash}
                  >
                    Cerrar Caja del DÃ­a
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Estado de caja cerrada */
          <Card>
            <CardContent className="p-12 text-center">
              <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Caja Cerrada</h2>
              <p className="text-gray-600 mb-6">
                Debes abrir la caja para comenzar a registrar ventas
              </p>
              <div className="max-w-sm mx-auto space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Base de caja inicial
                  </label>
                  <Input
                    type="number"
                    placeholder="100000"
                    className="text-center"
                  />
                </div>
                <Button className="w-full">
                  <Unlock className="w-5 h-5 mr-2" />
                  Abrir Caja
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
