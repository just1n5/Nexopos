import { useState } from 'react'
import { 
  Settings, 
  Store, 
  CreditCard, 
  Printer, 
  Bell, 
  Shield, 
  Users,
  Save,
  Upload,
  FileText,
  Smartphone,
  Wifi,
  HelpCircle,
  ChevronRight,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('business')
  const [saved, setSaved] = useState(false)

  // Datos de ejemplo
  const businessData = {
    name: 'Tienda Demo',
    nit: '900.123.456-7',
    address: 'Calle 123 #45-67, Bogotá',
    phone: '(1) 234-5678',
    email: 'tienda@demo.com',
    regime: 'Responsable de IVA'
  }

  const dianData = {
    resolution: '18764567890',
    prefix: 'FE',
    startNumber: 1,
    endNumber: 10000,
    currentNumber: 47,
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    testMode: false
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tabs = [
    { id: 'business', label: 'Negocio', icon: Store },
    { id: 'dian', label: 'DIAN', icon: FileText },
    { id: 'hardware', label: 'Hardware', icon: Printer },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'help', label: 'Ayuda', icon: HelpCircle }
  ]

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-gray-600">Administra la configuración de tu negocio</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                          activeTab === tab.id
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{tab.label}</span>
                        </div>
                        {activeTab === tab.id && <ChevronRight className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Estado del sistema */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estado del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conexión DIAN</span>
                  <Badge variant="success">Activa</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Base de datos</span>
                  <Badge variant="success">OK</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Impresora</span>
                  <Badge variant="warning">Sin configurar</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Internet</span>
                  <Badge variant="success">Conectado</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'business' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Negocio</CardTitle>
                    <CardDescription>
                      Datos básicos de tu empresa que aparecerán en facturas y documentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nombre del Negocio</label>
                        <Input defaultValue={businessData.name} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">NIT</label>
                        <Input defaultValue={businessData.nit} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Dirección</label>
                        <Input defaultValue={businessData.address} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Teléfono</label>
                        <Input defaultValue={businessData.phone} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input type="email" defaultValue={businessData.email} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Régimen Tributario</label>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                          <option>Responsable de IVA</option>
                          <option>No Responsable de IVA</option>
                          <option>Régimen Simple</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Logo del Negocio</label>
                        <Button variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Logo
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end gap-3">
                      <Button variant="outline">Cancelar</Button>
                      <Button onClick={handleSave}>
                        {saved ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Guardado
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'dian' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración DIAN</CardTitle>
                    <CardDescription>
                      Parámetros para la facturación electrónica
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Resolución Activa</p>
                          <p className="text-sm text-green-700">
                            Has utilizado {dianData.currentNumber} de {dianData.endNumber} folios disponibles
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Número de Resolución</label>
                        <Input defaultValue={dianData.resolution} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Prefijo</label>
                        <Input defaultValue={dianData.prefix} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Número Inicial</label>
                        <Input type="number" defaultValue={dianData.startNumber} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Número Final</label>
                        <Input type="number" defaultValue={dianData.endNumber} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
                        <Input type="date" defaultValue={dianData.startDate} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Fecha Fin</label>
                        <Input type="date" defaultValue={dianData.endDate} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Modo de Pruebas</p>
                        <p className="text-sm text-gray-600">
                          Activa esta opción para hacer pruebas sin afectar tu numeración
                        </p>
                      </div>
                      <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        dianData.testMode ? 'bg-primary' : 'bg-gray-200'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dianData.testMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <Separator />

                    <div className="flex justify-end gap-3">
                      <Button variant="outline">Probar Conexión</Button>
                      <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Configuración
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'hardware' && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dispositivos Conectados</CardTitle>
                      <CardDescription>
                        Configura los dispositivos físicos para tu punto de venta
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Impresora */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Printer className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium">Impresora de Recibos</p>
                              <p className="text-sm text-gray-600">No configurada</p>
                            </div>
                          </div>
                          <Button size="sm">Configurar</Button>
                        </div>
                      </div>

                      {/* Lector de código de barras */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium">Lector de Código de Barras</p>
                              <p className="text-sm text-green-600">USB - Conectado</p>
                            </div>
                          </div>
                          <Badge variant="success">Activo</Badge>
                        </div>
                      </div>

                      {/* Cajón monedero */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium">Cajón Monedero</p>
                              <p className="text-sm text-gray-600">No configurado</p>
                            </div>
                          </div>
                          <Button size="sm">Configurar</Button>
                        </div>
                      </div>

                      {/* Terminal de pago */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Wifi className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium">Terminal de Pago</p>
                              <p className="text-sm text-gray-600">Datáfono integrado</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">Configurar</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prueba de Hardware</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" variant="outline">
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir Página de Prueba
                      </Button>
                      <Button className="w-full" variant="outline">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Abrir Cajón Monedero
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Smartphone className="w-4 h-4 mr-2" />
                        Probar Escáner
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Placeholder para otras pestañas */}
              {['payments', 'notifications', 'users', 'security', 'help'].includes(activeTab) && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Sección {tabs.find(t => t.id === activeTab)?.label}
                    </h3>
                    <p className="text-gray-600">
                      Esta sección estará disponible próximamente
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

