import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserRole, type User, type CreateUserDto, type UpdateUserDto } from '@/types'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>
  user?: User | null
  currentUserRole: UserRole
  users?: User[]
}

const roleDescriptions = {
  [UserRole.ADMIN]: 'Control total del sistema. Puede gestionar usuarios, configuración y todos los módulos.',
  [UserRole.MANAGER]: 'Gestión operativa. Puede crear cajeros y gestionar inventario, reportes y operaciones.',
  [UserRole.CASHIER]: 'Operaciones de venta. Solo puede procesar ventas y manejar su caja registradora.'
}

export default function UserFormModal({ isOpen, onClose, onSubmit, user, currentUserRole, users = [] }: UserFormModalProps) {
  const [formData, setFormData] = useState<CreateUserDto | UpdateUserDto>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: UserRole.CASHIER
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      })
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: UserRole.CASHIER
      })
    }
    setErrors({})
  }, [user, isOpen])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'El nombre es requerido'
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'El apellido es requerido'
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!user && (!formData.password || formData.password.length < 8)) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    if (user && formData.password && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      // Si estamos editando y no se cambió la contraseña, no la enviamos
      const submitData = { ...formData }
      if (user && !submitData.password) {
        delete submitData.password
      }

      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Error al guardar usuario:', error)
    } finally {
      setLoading(false)
    }
  }

  // Determinar qué roles puede crear el usuario actual
  const availableRoles = currentUserRole === UserRole.ADMIN
    ? [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]
    : [UserRole.CASHIER]

  // Contar usuarios existentes por rol (excluyendo el usuario que se está editando)
  const getUserCountByRole = (role: UserRole): number => {
    return users.filter(u => u.role === role && u.id !== user?.id).length
  }

  const managersCount = getUserCountByRole(UserRole.MANAGER)
  const cashiersCount = getUserCountByRole(UserRole.CASHIER)

  // Determinar si un rol está disponible
  const isRoleAvailable = (role: UserRole): boolean => {
    if (user && user.role === role) return true // Si está editando y el rol actual es este, permitir
    if (role === UserRole.MANAGER && managersCount >= 1) return false
    if (role === UserRole.CASHIER && cashiersCount >= 2) return false
    return true
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {user ? '✏️ Editar Usuario' : '✨ Nuevo Usuario'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información Personal */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Información Personal</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Juan"
                  maxLength={60}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apellido *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Pérez"
                  maxLength={60}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Credenciales de Acceso */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Credenciales de Acceso</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan.perez@mitienda.com"
                  maxLength={120}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Contraseña {user && '(dejar vacío para no cambiar)'}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={user ? 'Nueva contraseña (opcional)' : 'Mínimo 8 caracteres'}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                )}
                {!user && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Mínimo 8 caracteres
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rol del Sistema */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Rol del Sistema</h3>
            <div className="space-y-2">
              {availableRoles.map((role) => {
                const available = isRoleAvailable(role)
                const isCurrentRole = user && user.role === role

                return (
                  <label
                    key={role}
                    className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                      !available && !isCurrentRole
                        ? 'opacity-50 cursor-not-allowed bg-gray-50'
                        : formData.role === role
                        ? 'border-primary bg-primary/5 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      disabled={!available && !isCurrentRole}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {role === UserRole.ADMIN && '🔴 Administrador'}
                        {role === UserRole.MANAGER && (
                          <>
                            🟡 Manager
                            <span className="text-xs font-normal text-gray-500">
                              ({managersCount}/1)
                            </span>
                          </>
                        )}
                        {role === UserRole.CASHIER && (
                          <>
                            🟢 Cajero
                            <span className="text-xs font-normal text-gray-500">
                              ({cashiersCount}/2)
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {roleDescriptions[role]}
                      </p>
                      {!available && !isCurrentRole && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Límite alcanzado
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>

            {currentUserRole === UserRole.MANAGER && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Como Manager, solo puedes crear usuarios con rol de Cajero.
                </p>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : user ? '💾 Actualizar' : '💾 Crear Usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
