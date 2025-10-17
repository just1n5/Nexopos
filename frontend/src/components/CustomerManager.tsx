import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  Search,
  MapPin,
  Mail,
  X,
  Check,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { customersService, type CreateCustomerDto } from '@/services'
import type { Customer } from '@/types'
import { useAuthStore } from '@/stores/authStore'

interface CustomerManagerProps {
  onSelectCustomer?: (customer: Customer) => void
  selectedCustomer?: Customer | null
  showCreditInfo?: boolean
  alwaysOpen?: boolean
}

type CustomerFormState = {
  name: string
  document: string
  phone: string
  email: string
  address: string
  creditEnabled: boolean
  creditLimit: string
}

const INITIAL_FORM: CustomerFormState = {
  name: '',
  document: '',
  phone: '',
  email: '',
  address: '',
  creditEnabled: false,
  creditLimit: ''
}

const splitName = (fullName: string): { firstName: string; lastName?: string } => {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) {
    return { firstName: 'Cliente' }
  }
  if (parts.length === 1) {
    return { firstName: parts[0] }
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' ')
  }
}

export default function CustomerManager({
  onSelectCustomer,
  selectedCustomer,
  showCreditInfo = true,
  alwaysOpen = false
}: CustomerManagerProps) {
  const { token } = useAuthStore()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [newCustomer, setNewCustomer] = useState<CustomerFormState>(INITIAL_FORM)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editForm, setEditForm] = useState<CustomerFormState>(INITIAL_FORM)
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [customerCreditSales, setCustomerCreditSales] = useState<any[]>([])
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [selectedCreditSale, setSelectedCreditSale] = useState<any>(null)

  useEffect(() => {
    if (!token) return

    const loadCustomers = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await customersService.getCustomers(token)
        setCustomers(data)
      } catch (err) {
        console.error('Error cargando clientes:', err)
        setError(err instanceof Error ? err.message : 'No fue posible cargar los clientes')
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [token])

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers
    const query = searchQuery.toLowerCase()
    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.document?.toLowerCase().includes(query) ||
        customer.phone?.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''))
      )
    })
  }, [customers, searchQuery])

  const handleCreateCustomer = async () => {
    if (!token) {
      toast({
        title: 'Sesión requerida',
        description: 'Inicia sesión para crear clientes nuevos.',
        variant: 'destructive'
      })
      return
    }

    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast({
        title: 'Faltan datos',
        description: 'El nombre y el teléfono son obligatorios.',
        variant: 'destructive'
      })
      return
    }

    if (!newCustomer.document.trim()) {
      toast({
        title: 'Documento requerido',
        description: 'Ingresa un documento para registrar al cliente.',
        variant: 'destructive'
      })
      return
    }

    const { firstName, lastName } = splitName(newCustomer.name)

    const creditLimitValue = newCustomer.creditLimit ? Number(newCustomer.creditLimit) : 0

    const payload: CreateCustomerDto = {
      type: 'individual',
      documentType: 'CC',
      documentNumber: newCustomer.document.trim(),
      firstName,
      lastName,
      email: newCustomer.email.trim() || undefined,
      mobile: newCustomer.phone.trim(),
      address: newCustomer.address.trim() || undefined,
      creditEnabled: newCustomer.creditEnabled,
      creditLimit: creditLimitValue > 0 ? creditLimitValue : undefined
    }

    try {
      const created = await customersService.createCustomer(payload, token)
      setCustomers((prev) => [...prev, created])
      setNewCustomer(INITIAL_FORM)
      setIsCreating(false)
      setIsOpen(false)

      if (onSelectCustomer) {
        onSelectCustomer(created)
      }

      toast({
        title: 'Cliente creado',
        description: `${created.name} se agregó correctamente`,
        variant: 'success' as any
      })
    } catch (err) {
      console.error('Error creando cliente:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No fue posible crear el cliente',
        variant: 'destructive'
      })
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    if (alwaysOpen) {
      // En modo alwaysOpen, abrir para editar
      handleEditCustomer(customer)
    } else {
      // En modo normal, seleccionar cliente
      if (onSelectCustomer) {
        onSelectCustomer(customer)
      }
      setIsOpen(false)

      toast({
        title: 'Cliente seleccionado',
        description: customer.name,
        variant: 'success' as any
      })
    }
  }

  const handleEditCustomer = async (customer: Customer) => {
    setEditingCustomer(customer)
    setEditForm({
      name: customer.name,
      document: customer.document || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      creditEnabled: customer.creditEnabled || false,
      creditLimit: customer.creditLimit?.toString() || ''
    })
    setShowPaymentSection(false)
    setPaymentAmount('')
    setSelectedCreditSale(null)

    // Cargar ventas a crédito del cliente si tiene deuda
    if (customer.currentDebt && customer.currentDebt > 0 && token) {
      setLoadingCredits(true)
      try {
        const { creditService } = await import('@/services/creditService')
        const credits = await creditService.getCreditSales(token, {
          customerId: customer.id,
          status: 'pending'
        })
        setCustomerCreditSales(credits.filter((c: any) => c.remainingBalance > 0))
      } catch (err) {
        console.error('Error cargando créditos del cliente:', err)
        setCustomerCreditSales([])
      } finally {
        setLoadingCredits(false)
      }
    } else {
      setCustomerCreditSales([])
    }
  }

  const handleUpdateCustomer = async () => {
    if (!token || !editingCustomer) return

    if (!editForm.name.trim() || !editForm.phone.trim()) {
      toast({
        title: 'Faltan datos',
        description: 'El nombre y el teléfono son obligatorios.',
        variant: 'destructive'
      })
      return
    }

    if (!editForm.document.trim()) {
      toast({
        title: 'Documento requerido',
        description: 'Ingresa un documento para el cliente.',
        variant: 'destructive'
      })
      return
    }

    const { firstName, lastName } = splitName(editForm.name)

    const creditLimitValue = editForm.creditLimit ? Number(editForm.creditLimit) : 0

    const payload: any = {
      type: 'individual',
      documentType: 'CC',
      documentNumber: editForm.document.trim(),
      firstName,
      lastName,
      email: editForm.email.trim() || undefined,
      mobile: editForm.phone.trim(),
      address: editForm.address.trim() || undefined,
      creditEnabled: editForm.creditEnabled,
      creditLimit: creditLimitValue > 0 ? creditLimitValue : undefined
    }

    console.log('[CustomerManager] Updating customer:', {
      id: editingCustomer.id,
      creditEnabled: editForm.creditEnabled,
      payload
    })

    try {
      const updated = await customersService.updateCustomer(editingCustomer.id, payload, token)
      console.log('[CustomerManager] Customer updated:', {
        id: updated.id,
        creditEnabled: updated.creditEnabled
      })
      setCustomers((prev) => prev.map(c => c.id === updated.id ? updated : c))
      setEditingCustomer(null)
      setEditForm(INITIAL_FORM)

      toast({
        title: 'Cliente actualizado',
        description: `${updated.name} se actualizó correctamente`,
        variant: 'success' as any
      })
    } catch (err) {
      console.error('Error actualizando cliente:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No fue posible actualizar el cliente',
        variant: 'destructive'
      })
    }
  }

  const handleRecordPayment = async () => {
    if (!token || !editingCustomer || !selectedCreditSale) return

    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) {
      toast({
        title: 'Monto inválido',
        description: 'Ingresa un monto válido para el abono',
        variant: 'destructive'
      })
      return
    }

    if (amount > selectedCreditSale.remainingBalance) {
      toast({
        title: 'Monto excedido',
        description: 'El monto del abono no puede ser mayor al saldo pendiente de esta venta',
        variant: 'destructive'
      })
      return
    }

    try {
      const { creditService } = await import('@/services/creditService')
      await creditService.addPayment(selectedCreditSale.id, {
        amount,
        paymentMethod: 'cash',
        notes: 'Abono registrado desde gestión de clientes'
      }, token)

      // Recargar clientes para actualizar la deuda
      const data = await customersService.getCustomers(token)
      setCustomers(data)

      // Actualizar el cliente en edición y recargar sus créditos
      const updatedCustomer = data.find(c => c.id === editingCustomer.id)
      if (updatedCustomer) {
        await handleEditCustomer(updatedCustomer)
      }

      setPaymentAmount('')
      setSelectedCreditSale(null)
      setShowPaymentSection(false)

      toast({
        title: 'Abono registrado',
        description: `Se ha registrado un abono de ${formatCurrency(amount)}`,
        variant: 'success' as any
      })
    } catch (err) {
      console.error('Error registrando pago:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No fue posible registrar el abono',
        variant: 'destructive'
      })
    }
  }

  const getAvailableCredit = (customer: Customer) => {
    const limit = customer.creditLimit ?? 0
    const debt = customer.currentDebt ?? 0
    return limit - debt
  }

  // Renderizado para modo alwaysOpen (sin modales)
  if (alwaysOpen) {
    return (
      <>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4 px-0">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, documento o teléfono..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <Button onClick={() => setIsCreating(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Nuevo cliente
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0 pb-6 px-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="py-12 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="mt-4 text-sm text-muted-foreground">Cargando clientes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-[60vh] overflow-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg dark:border-gray-700 dark:text-gray-400">
                    {searchQuery ? 'No encontramos clientes que coincidan con la búsqueda.' : 'Aún no hay clientes registrados.'}
                  </div>
                ) : (
                  filteredCustomers.map((customer) => {
                    const availableCredit = getAvailableCredit(customer)
                    return (
                      <Card
                        key={customer.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg dark:text-white">{customer.name}</h3>
                                {showCreditInfo && customer.creditLimit && customer.creditLimit > 0 && (
                                  <Badge variant={availableCredit > 0 ? 'success' : 'destructive'}>
                                    Crédito
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {customer.document && `CC: ${customer.document} · `}
                                {customer.phone}
                              </p>
                            </div>
                            <Check className={`w-5 h-5 ${selectedCustomer?.id === customer.id ? 'text-primary' : 'text-transparent'}`} />
                          </div>

                          {(customer.email || customer.address) && (
                            <div className="text-sm text-muted-foreground space-y-1">
                              {customer.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  <span>{customer.email}</span>
                                </div>
                              )}
                              {customer.address && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span>{customer.address}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {showCreditInfo && customer.creditLimit && customer.creditLimit > 0 && (
                            <div className="grid grid-cols-3 gap-2 text-sm bg-muted dark:bg-gray-700/50 rounded-lg p-3">
                              <div>
                                <p className="text-muted-foreground">Límite</p>
                                <p className="font-medium dark:text-gray-200">{formatCurrency(customer.creditLimit)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Deuda</p>
                                <p className="font-medium dark:text-gray-200">{formatCurrency(customer.currentDebt ?? 0)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Disponible</p>
                                <p className={`font-medium ${availableCredit > 0 ? 'text-success' : 'text-destructive'}`}>
                                  {formatCurrency(availableCredit)}
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            )}

            <Separator className="my-4" />

            <div className="text-sm text-muted-foreground">
              {filteredCustomers.length} cliente{filteredCustomers.length === 1 ? '' : 's'} encontrado{filteredCustomers.length === 1 ? '' : 's'}
            </div>
          </CardContent>
        </Card>

        {/* Modal de crear cliente */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
              >
                <Card className="border-0 shadow-none">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl dark:text-white">Nuevo cliente</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Registra un cliente para asociarlo a ventas o habilitar crédito.
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">Nombre completo</label>
                      <Input
                        placeholder="Ej. Juan Pérez"
                        value={newCustomer.name}
                        onChange={(event) => setNewCustomer((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground dark:text-gray-300">Documento</label>
                        <Input
                          placeholder="Número de identificación"
                          value={newCustomer.document}
                          onChange={(event) => setNewCustomer((prev) => ({ ...prev, document: event.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground dark:text-gray-300">Teléfono</label>
                        <Input
                          placeholder="Celular o fijo"
                          value={newCustomer.phone}
                          onChange={(event) => setNewCustomer((prev) => ({ ...prev, phone: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground dark:text-gray-300">Correo electrónico</label>
                        <Input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={newCustomer.email}
                          onChange={(event) => setNewCustomer((prev) => ({ ...prev, email: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="new-credit-enabled"
                            checked={newCustomer.creditEnabled}
                            onCheckedChange={(checked: boolean) => setNewCustomer((prev) => ({ ...prev, creditEnabled: checked === true }))}
                          />
                          <label
                            htmlFor="new-credit-enabled"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                          >
                            Habilitar Crédito
                          </label>
                        </div>
                        {newCustomer.creditEnabled && (
                          <div>
                            <label className="text-sm font-medium text-foreground dark:text-gray-300">Límite de Crédito</label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={newCustomer.creditLimit}
                              onChange={(event) => setNewCustomer((prev) => ({ ...prev, creditLimit: event.target.value }))}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">Dirección</label>
                      <Input
                        placeholder="Dirección de contacto"
                        value={newCustomer.address}
                        onChange={(event) => setNewCustomer((prev) => ({ ...prev, address: event.target.value }))}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsCreating(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateCustomer}>Guardar cliente</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de editar cliente */}
        <AnimatePresence>
          {editingCustomer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
              >
                <Card className="border-0 shadow-none">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl dark:text-white">Editar cliente</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setEditingCustomer(null)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Actualiza la información del cliente
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">Nombre completo</label>
                      <Input
                        placeholder="Ej. Juan Pérez"
                        value={editForm.name}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground dark:text-gray-300">Documento</label>
                        <Input
                          placeholder="Número de identificación"
                          value={editForm.document}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, document: event.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground dark:text-gray-300">Teléfono</label>
                        <Input
                          placeholder="Celular o fijo"
                          value={editForm.phone}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground dark:text-gray-300">Correo electrónico</label>
                        <Input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={editForm.email}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="edit-credit-enabled"
                            checked={editForm.creditEnabled}
                            onCheckedChange={(checked: boolean) => setEditForm((prev) => ({ ...prev, creditEnabled: checked === true }))}
                          />
                          <label
                            htmlFor="edit-credit-enabled"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                          >
                            Habilitar Crédito
                          </label>
                        </div>
                        {editForm.creditEnabled && (
                          <div>
                            <label className="text-sm font-medium text-foreground dark:text-gray-300">Límite de Crédito</label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={editForm.creditLimit}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, creditLimit: event.target.value }))}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">Dirección</label>
                      <Input
                        placeholder="Dirección de contacto"
                        value={editForm.address}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
                      />
                    </div>

                    {editingCustomer.currentDebt && editingCustomer.currentDebt > 0 && (
                      <>
                        <Alert>
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>
                            Este cliente tiene una deuda pendiente de {formatCurrency(editingCustomer.currentDebt)}
                          </AlertDescription>
                        </Alert>

                        {!showPaymentSection ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowPaymentSection(true)}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Registrar Abono
                          </Button>
                        ) : (
                          <Card className="border-2 border-accent bg-accent">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-accent-foreground">Registrar Abono</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setShowPaymentSection(false)
                                    setPaymentAmount('')
                                    setSelectedCreditSale(null)
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              {loadingCredits ? (
                                <div className="py-4 text-center">
                                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">Cargando ventas a crédito...</p>
                                </div>
                              ) : customerCreditSales.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No hay ventas a crédito pendientes
                                </p>
                              ) : (
                                <>
                                  <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block dark:text-gray-300">
                                      Selecciona la venta a abonar
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-auto">
                                      {customerCreditSales.map((credit) => (
                                        <Card
                                          key={credit.id}
                                          className={`cursor-pointer transition-all bg-card dark:border-gray-700 ${
                                            selectedCreditSale?.id === credit.id
                                              ? 'border-2 border-accent bg-accent'
                                              : 'hover:border-accent'
                                          }`}
                                          onClick={() => setSelectedCreditSale(credit)}
                                        >
                                          <CardContent className="p-3">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <p className="text-sm font-medium dark:text-white">
                                                  Venta {new Date(credit.createdAt).toLocaleDateString('es-CO')}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  Total: {formatCurrency(credit.totalAmount)}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-sm font-semibold text-destructive">
                                                  {formatCurrency(credit.remainingBalance)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Pendiente</p>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>

                                  {selectedCreditSale && (
                                    <div>
                                      <label className="text-sm font-medium text-foreground dark:text-gray-300">
                                        Monto del Abono
                                      </label>
                                      <div className="relative mt-1">
                                        <DollarSign className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          value={paymentAmount}
                                          onChange={(e) => setPaymentAmount(e.target.value)}
                                          className="pl-10"
                                          min="0"
                                          max={selectedCreditSale.remainingBalance}
                                        />
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Máximo: {formatCurrency(selectedCreditSale.remainingBalance)}
                                      </p>
                                    </div>
                                  )}

                                  <Button
                                    className="w-full"
                                    onClick={handleRecordPayment}
                                    disabled={!selectedCreditSale || !paymentAmount || parseFloat(paymentAmount) <= 0}
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirmar Abono
                                  </Button>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}

                    <Separator className="my-4" />

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setEditingCustomer(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleUpdateCustomer}>Actualizar cliente</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Renderizado normal con modales
  return (
    <>
      {selectedCustomer ? (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow bg-card dark:border-gray-700"
          onClick={() => setIsOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium dark:text-white">{selectedCustomer.name}</p>
                  {showCreditInfo && selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && (
                    <Badge variant={getAvailableCredit(selectedCustomer) > 0 ? 'success' : 'destructive'}>
                      Crédito
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedCustomer.document && `CC: ${selectedCustomer.document} · `}
                  {selectedCustomer.phone}
                </p>
                {showCreditInfo && selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Crédito disponible:</span>
                      <span
                        className={`font-medium ${getAvailableCredit(selectedCustomer) > 0 ? 'text-success' : 'text-destructive'}`}
                      >
                        {formatCurrency(getAvailableCredit(selectedCustomer))}
                      </span>
                    </div>
                    {selectedCustomer.currentDebt && selectedCustomer.currentDebt > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Deuda actual:</span>
                        <span>{formatCurrency(selectedCustomer.currentDebt)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => onSelectCustomer?.(null as any)}>
                Cambiar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start text-left h-auto py-3"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Seleccionar cliente</p>
              <p className="text-sm text-muted-foreground">Opcional, requerido para ventas a crédito</p>
            </div>
          </div>
        </Button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl dark:text-white">Clientes</CardTitle>
                      <p className="text-sm text-muted-foreground">Gestiona los clientes asociados a ventas y créditos</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar por nombre, documento o teléfono..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                      />
                    </div>
                    <Button onClick={() => setIsCreating(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Nuevo cliente
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-6">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {isLoading ? (
                    <div className="py-12 flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="mt-4 text-sm text-muted-foreground">Cargando clientes...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {filteredCustomers.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg dark:border-gray-700 dark:text-gray-400">
                          {searchQuery ? 'No encontramos clientes que coincidan con la búsqueda.' : 'Aún no hay clientes registrados.'}
                        </div>
                      ) : (
                        filteredCustomers.map((customer) => {
                          const availableCredit = getAvailableCredit(customer)
                          return (
                            <Card
                              key={customer.id}
                              className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-lg dark:text-white">{customer.name}</h3>
                                      {showCreditInfo && customer.creditLimit && customer.creditLimit > 0 && (
                                        <Badge variant={availableCredit > 0 ? 'success' : 'destructive'}>
                                          Crédito
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {customer.document && `CC: ${customer.document} · `}
                                      {customer.phone}
                                    </p>
                                  </div>
                                  <Check className={`w-5 h-5 ${selectedCustomer?.id === customer.id ? 'text-primary' : 'text-transparent'}`} />
                                </div>

                                {(customer.email || customer.address) && (
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    {customer.email && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <span>{customer.email}</span>
                                      </div>
                                    )}
                                    {customer.address && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span>{customer.address}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {showCreditInfo && customer.creditLimit && customer.creditLimit > 0 && (
                                  <div className="grid grid-cols-3 gap-2 text-sm bg-muted dark:bg-gray-700/50 rounded-lg p-3">
                                    <div>
                                      <p className="text-muted-foreground">Límite</p>
                                      <p className="font-medium dark:text-gray-200">{formatCurrency(customer.creditLimit)}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Deuda</p>
                                      <p className="font-medium dark:text-gray-200">{formatCurrency(customer.currentDebt ?? 0)}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Disponible</p>
                                      <p className={`font-medium ${availableCredit > 0 ? 'text-success' : 'text-destructive'}`}>
                                        {formatCurrency(availableCredit)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {filteredCustomers.length} cliente{filteredCustomers.length === 1 ? '' : 's'} encontrados
                    </div>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cerrar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl shadow-2xl w-full max-w-xl"
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl dark:text-white">Nuevo cliente</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Registra un cliente para asociarlo a ventas o habilitar crédito.
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground dark:text-gray-300">Nombre completo</label>
                    <Input
                      placeholder="Ej. Juan Pérez"
                      value={newCustomer.name}
                      onChange={(event) => setNewCustomer((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">Documento</label>
                      <Input
                        placeholder="Número de identificación"
                        value={newCustomer.document}
                        onChange={(event) => setNewCustomer((prev) => ({ ...prev, document: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">Teléfono</label>
                      <Input
                        placeholder="Celular o fijo"
                        value={newCustomer.phone}
                        onChange={(event) => setNewCustomer((prev) => ({ ...prev, phone: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">Correo electrónico</label>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={newCustomer.email}
                        onChange={(event) => setNewCustomer((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">Crédito máximo</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newCustomer.creditLimit}
                        onChange={(event) => setNewCustomer((prev) => ({ ...prev, creditLimit: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground dark:text-gray-300">Dirección</label>
                    <Input
                      placeholder="Dirección de contacto"
                      value={newCustomer.address}
                      onChange={(event) => setNewCustomer((prev) => ({ ...prev, address: event.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateCustomer}>Guardar cliente</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}