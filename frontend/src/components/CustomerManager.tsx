import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserPlus, 
  Search, 
  Phone, 
  CreditCard as CardIcon,
  MapPin,
  Mail,
  DollarSign,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { Customer } from '@/types'

interface CustomerManagerProps {
  onSelectCustomer?: (customer: Customer) => void
  selectedCustomer?: Customer | null
  showCreditInfo?: boolean
}

export default function CustomerManager({ 
  onSelectCustomer, 
  selectedCustomer,
  showCreditInfo = true 
}: CustomerManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  
  // Formulario de nuevo cliente
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: ''
  })
  
  // Mock de clientes para demostración
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'Juan Pérez',
      document: '1234567890',
      phone: '300 123 4567',
      email: 'juan@email.com',
      address: 'Calle 123 #45-67',
      creditLimit: 500000,
      currentDebt: 125000,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'María García',
      document: '9876543210',
      phone: '310 987 6543',
      email: 'maria@email.com',
      address: 'Carrera 45 #12-34',
      creditLimit: 300000,
      currentDebt: 85000,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Carlos Rodríguez',
      document: '5555555555',
      phone: '320 555 5555',
      email: 'carlos@email.com',
      address: 'Avenida 10 #20-30',
      creditLimit: 1000000,
      currentDebt: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
  
  // Filtrar clientes
  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase()
    return customer.name.toLowerCase().includes(query) ||
           customer.document?.includes(query) ||
           customer.phone?.includes(query)
  })
  
  // Crear nuevo cliente
  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: "Error",
        description: "El nombre y teléfono son obligatorios",
        variant: "destructive"
      })
      return
    }
    
    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      document: newCustomer.document,
      phone: newCustomer.phone,
      email: newCustomer.email,
      address: newCustomer.address,
      creditLimit: parseFloat(newCustomer.creditLimit) || 0,
      currentDebt: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setCustomers([...customers, customer])
    setIsCreating(false)
    setNewCustomer({
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: ''
    })
    
    if (onSelectCustomer) {
      onSelectCustomer(customer)
    }
    
    toast({
      title: "Cliente creado",
      description: `${customer.name} ha sido agregado exitosamente`,
      variant: "success" as any
    })
    
    setIsOpen(false)
  }
  
  // Seleccionar cliente
  const handleSelectCustomer = (customer: Customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer)
    }
    setIsOpen(false)
    
    toast({
      title: "Cliente seleccionado",
      description: customer.name,
      variant: "success" as any
    })
  }
  
  // Calcular crédito disponible
  const getAvailableCredit = (customer: Customer) => {
    const creditLimit = customer.creditLimit || 0
    const currentDebt = customer.currentDebt || 0
    return creditLimit - currentDebt
  }

  return (
    <>
      {/* Botón o información del cliente seleccionado */}
      {selectedCustomer ? (
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  {showCreditInfo && selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && (
                    <Badge variant={getAvailableCredit(selectedCustomer) > 0 ? 'success' : 'destructive'}>
                      Crédito
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {selectedCustomer.document && `CC: ${selectedCustomer.document} • `}
                  {selectedCustomer.phone}
                </p>
                {showCreditInfo && selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Crédito disponible:</span>
                      <span className={`font-medium ${
                        getAvailableCredit(selectedCustomer) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(getAvailableCredit(selectedCustomer))}
                      </span>
                    </div>
                    {selectedCustomer.currentDebt && selectedCustomer.currentDebt > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Deuda actual:</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(selectedCustomer.currentDebt)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  if (onSelectCustomer) {
                    onSelectCustomer(null!)
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setIsOpen(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Seleccionar Cliente
        </Button>
      )}
      
      {/* Modal de gestión de clientes */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0 h-full flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Gestión de Clientes</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Barra de búsqueda y botón de crear */}
                  <div className="flex gap-2 mt-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Buscar por nombre, documento o teléfono..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button onClick={() => setIsCreating(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Nuevo
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-auto">
                  {isCreating ? (
                    /* Formulario de nuevo cliente */
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Nuevo Cliente</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Nombre completo *
                          </label>
                          <Input
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                            placeholder="Juan Pérez"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Documento (CC/NIT)
                          </label>
                          <Input
                            value={newCustomer.document}
                            onChange={(e) => setNewCustomer({...newCustomer, document: e.target.value})}
                            placeholder="1234567890"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Teléfono *
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                              placeholder="300 123 4567"
                              className="pl-9"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              type="email"
                              value={newCustomer.email}
                              onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                              placeholder="cliente@email.com"
                              className="pl-9"
                            />
                          </div>
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1">
                            Dirección
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              value={newCustomer.address}
                              onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                              placeholder="Calle 123 #45-67"
                              className="pl-9"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Límite de crédito
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              type="number"
                              value={newCustomer.creditLimit}
                              onChange={(e) => setNewCustomer({...newCustomer, creditLimit: e.target.value})}
                              placeholder="500000"
                              className="pl-9"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsCreating(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleCreateCustomer}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Crear Cliente
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Lista de clientes */
                    <div className="space-y-3">
                      {filteredCustomers.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600">No se encontraron clientes</p>
                        </div>
                      ) : (
                        filteredCustomers.map(customer => (
                          <Card
                            key={customer.id}
                            className="cursor-pointer hover:shadow-md transition-all"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium">{customer.name}</p>
                                    {customer.creditLimit && customer.creditLimit > 0 && (
                                      <Badge 
                                        variant={getAvailableCredit(customer) > 0 ? 'success' : 'destructive'}
                                      >
                                        {getAvailableCredit(customer) > 0 ? 'Crédito disponible' : 'Sin crédito'}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {customer.document && `CC: ${customer.document} • `}
                                    Tel: {customer.phone}
                                  </p>
                                  {customer.creditLimit && customer.creditLimit > 0 && (
                                    <div className="mt-2 flex items-center gap-4 text-sm">
                                      <span className="text-gray-600">
                                        Límite: {formatCurrency(customer.creditLimit)}
                                      </span>
                                      {customer.currentDebt && customer.currentDebt > 0 && (
                                        <span className="text-orange-600">
                                          Deuda: {formatCurrency(customer.currentDebt)}
                                        </span>
                                      )}
                                      <span className={`font-medium ${
                                        getAvailableCredit(customer) > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        Disponible: {formatCurrency(getAvailableCredit(customer))}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                >
                                  Seleccionar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
