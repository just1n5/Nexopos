import { useState, useRef, useEffect } from 'react'
import {
  Settings,
  Store,
  CreditCard,
  Printer,
  Bell,
  Shield,
  Users as UsersIcon,
  Save,
  Upload,
  FileText,
  Smartphone,
  Wifi,
  HelpCircle,
  ChevronRight,
  Check,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { useBusinessStore } from '@/stores/businessStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { usersService } from '@/services/usersService'
import UserTable from '@/components/users/UserTable'
import UserFormModal from '@/components/users/UserFormModal'
import UserDeleteDialog from '@/components/users/UserDeleteDialog'
import MyProfile from '@/components/users/MyProfile'
import type { User, CreateUserDto, UpdateUserDto } from '@/types'

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const { config, updateConfig, setLogo } = useBusinessStore()
  const { user: currentUser, token } = useAuthStore()

  // Estado para gestión de usuarios
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Estado local para el formulario
  const [formData, setFormData] = useState({
    name: config.name,
    nit: config.nit,
    address: config.address,
    phone: config.phone,
    email: config.email,
    regime: config.regime,
    weightUnit: config.weightUnit
  })

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
    updateConfig(formData)
    setSaved(true)
    toast({
      title: 'Configuración guardada',
      description: 'Los cambios se han guardado correctamente',
      variant: 'success'
    })
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que sea PNG
    if (!file.type.startsWith('image/png')) {
      toast({
        title: 'Error',
        description: 'El logo debe ser una imagen PNG',
        variant: 'destructive'
      })
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'El logo no debe superar 2MB',
        variant: 'destructive'
      })
      return
    }

    // Convertir a base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setLogo(base64String)
      toast({
        title: 'Logo cargado',
        description: 'El logo se ha cargado correctamente',
        variant: 'success'
      })
    }
    reader.readAsDataURL(file)
  }

  // Cargar usuarios cuando se abre la pestaña
  useEffect(() => {
    if (activeTab === 'users' && token) {
      loadUsers()
    }
  }, [activeTab, token])

  const loadUsers = async () => {
    if (!token) return

    setLoadingUsers(true)
    try {
      const data = await usersService.getAll(token)
      setUsers(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive'
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleCreateUser = async (data: CreateUserDto | UpdateUserDto) => {
    if (!token) return

    try {
      if (selectedUser) {
        await usersService.update(selectedUser.id, data as UpdateUserDto, token)
        toast({
          title: 'Usuario actualizado',
          description: 'El usuario se ha actualizado correctamente',
          variant: 'success'
        })
      } else {
        await usersService.create(data as CreateUserDto, token)
        toast({
          title: 'Usuario creado',
          description: 'El usuario se ha creado correctamente',
          variant: 'success'
        })
      }
      await loadUsers()
      setUserFormOpen(false)
      setSelectedUser(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar usuario',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleDeleteUser = async () => {
    if (!token || !userToDelete) return

    try {
      await usersService.delete(userToDelete.id, token)
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario se ha eliminado correctamente',
        variant: 'success'
      })
      await loadUsers()
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar usuario',
        variant: 'destructive'
      })
    }
  }

  const handleToggleActive = async (user: User) => {
    if (!token) return

    try {
      await usersService.toggleActive(user.id, token)
      toast({
        title: user.isActive ? 'Usuario desactivado' : 'Usuario activado',
        description: `El usuario se ha ${user.isActive ? 'desactivado' : 'activado'} correctamente`,
        variant: 'success'
      })
      await loadUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al cambiar estado',
        variant: 'destructive'
      })
    }
  }

  // Filtrar tabs según rol del usuario
  const allTabs = [
    { id: 'profile', label: 'Mi Perfil', icon: UsersIcon, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'business', label: 'Negocio', icon: Store, roles: ['ADMIN', 'MANAGER'] },
    { id: 'dian', label: 'DIAN', icon: FileText, roles: ['ADMIN'] },
    { id: 'hardware', label: 'Hardware', icon: Printer, roles: ['ADMIN', 'MANAGER'] },
    { id: 'payments', label: 'Pagos', icon: CreditCard, roles: ['ADMIN'] },
    { id: 'notifications', label: 'Notificaciones', icon: Bell, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'users', label: 'Usuarios', icon: Shield, roles: ['ADMIN', 'MANAGER'] },
    { id: 'help', label: 'Ayuda', icon: HelpCircle, roles: ['ADMIN', 'MANAGER', 'CASHIER'] }
  ]

  const tabs = allTabs.filter(tab =>
    currentUser && tab.roles.includes(currentUser.role)
  )

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
              {activeTab === 'profile' && (
                <MyProfile />
              )}

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
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Ej: Mi Tienda"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">NIT</label>
                        <Input
                          value={formData.nit}
                          onChange={(e) => setFormData({...formData, nit: e.target.value})}
                          placeholder="900.123.456-7"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Dirección</label>
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          placeholder="Calle 123 #45-67"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Teléfono</label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="(1) 234-5678"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Régimen Tributario</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={formData.regime}
                          onChange={(e) => setFormData({...formData, regime: e.target.value})}
                        >
                          <option>Responsable de IVA</option>
                          <option>No Responsable de IVA</option>
                          <option>Régimen Simple</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Unidad de Peso</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={formData.weightUnit}
                          onChange={(e) => setFormData({...formData, weightUnit: e.target.value as 'grams' | 'pounds'})}
                        >
                          <option value="grams">Gramos (g)</option>
                          <option value="pounds">Libras (lb)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Unidad para mostrar productos vendidos por peso
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Logo del Negocio (PNG)</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {config.logo ? 'Cambiar Logo' : 'Subir Logo'}
                        </Button>
                        {config.logo && (
                          <div className="mt-2 text-center">
                            <img
                              src={config.logo}
                              alt="Logo"
                              className="h-12 mx-auto object-contain"
                            />
                          </div>
                        )}
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

              {activeTab === 'users' && currentUser && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>👥 Gestión de Usuarios</CardTitle>
                        <CardDescription>
                          Administra los usuarios que tienen acceso al sistema
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedUser(null)
                          setUserFormOpen(true)
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Nuevo Usuario
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingUsers ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando usuarios...</p>
                      </div>
                    ) : (
                      <UserTable
                        users={users}
                        onEdit={(user) => {
                          setSelectedUser(user)
                          setUserFormOpen(true)
                        }}
                        onDelete={(user) => {
                          setUserToDelete(user)
                          setDeleteDialogOpen(true)
                        }}
                        onToggleActive={handleToggleActive}
                        currentUserId={currentUser.id}
                        currentUserRole={currentUser.role}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Placeholder para otras pestañas */}
              {['payments', 'notifications', 'help'].includes(activeTab) && (
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

      {/* Modales */}
      {currentUser && (
        <>
          <UserFormModal
            isOpen={userFormOpen}
            onClose={() => {
              setUserFormOpen(false)
              setSelectedUser(null)
            }}
            onSubmit={handleCreateUser}
            user={selectedUser}
            currentUserRole={currentUser.role}
          />

          <UserDeleteDialog
            isOpen={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false)
              setUserToDelete(null)
            }}
            onConfirm={handleDeleteUser}
            user={userToDelete}
          />
        </>
      )}
    </div>
  )
}

