import { useState } from 'react'
import { User as UserIcon, Lock, Eye, EyeOff, Check, AlertCircle, Shield, UserCog, Crown, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { usersService } from '@/services/usersService'
import { UserRole } from '@/types'

interface PasswordStrength {
  score: number // 0-4
  label: string
  color: string
}

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return <Badge className="bg-purple-600 text-white hover:bg-purple-700 flex items-center"><Crown className="w-3 h-3 mr-1" />Super Admin</Badge>
    case UserRole.ADMIN:
      return <Badge className="bg-red-600 text-white hover:bg-red-700 flex items-center"><Shield className="w-3 h-3 mr-1" />Administrador</Badge>
    case UserRole.MANAGER:
      return <Badge className="bg-yellow-600 text-white hover:bg-yellow-700 flex items-center"><UserCog className="w-3 h-3 mr-1" />Manager</Badge>
    case UserRole.CASHIER:
      return <Badge className="bg-green-600 text-white hover:bg-green-700 flex items-center"><UserIcon className="w-3 h-3 mr-1" />Cajero</Badge>
    default:
      return <Badge className="bg-gray-600 text-white">Desconocido</Badge>
  }
}

const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Muy débil', color: 'bg-red-500' }
  if (score === 2) return { score, label: 'Débil', color: 'bg-orange-500' }
  if (score === 3) return { score, label: 'Aceptable', color: 'bg-yellow-500' }
  if (score === 4) return { score, label: 'Fuerte', color: 'bg-green-500' }
  return { score, label: 'Muy fuerte', color: 'bg-green-600' }
}

export default function MyProfile() {
  const { user, token } = useAuthStore()
  const { toast } = useToast()

  // Estado para cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!user) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-600">No hay usuario autenticado</p>
        </CardContent>
      </Card>
    )
  }

  const passwordStrength = passwordData.newPassword
    ? checkPasswordStrength(passwordData.newPassword)
    : null

  const validatePasswordChange = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida'
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Debe tener al menos 8 caracteres'
    } else if (passwordStrength && passwordStrength.score < 2) {
      newErrors.newPassword = 'La contraseña es muy débil. Usa mayúsculas, números y símbolos.'
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar la nueva contraseña'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswordChange() || !token) return

    setLoading(true)
    try {
      await usersService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, token)

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña se ha cambiado correctamente',
        variant: 'success'
      })

      // Limpiar formulario
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowChangePassword(false)
      setErrors({})
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al cambiar contraseña',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tarjeta de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Mi Perfil
          </CardTitle>
          <CardDescription>
            Información de tu cuenta en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar y datos básicos */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-semibold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {getRoleBadge(user.role)}
                {user.isActive ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-700 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" />Activo</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 flex items-center"><XCircle className="w-3 h-3 mr-1" />Inactivo</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de la cuenta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <Input value={user.firstName} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido
              </label>
              <Input value={user.lastName} disabled />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <Input value={user.email} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rol
              </label>
              <Input value={getRoleBadge(user.role).props.children.join('')} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Miembro desde
              </label>
              <Input
                value={new Date(user.createdAt).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                disabled
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <p className="font-medium">Información de solo lectura</p>
              <p className="mt-1">
                Para modificar tus datos personales, contacta con un administrador del sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tarjeta de Seguridad */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Gestiona la seguridad de tu cuenta
              </CardDescription>
            </div>
            {!showChangePassword && (
              <Button onClick={() => setShowChangePassword(true)}>
                Cambiar Contraseña
              </Button>
            )}
          </div>
        </CardHeader>

        {showChangePassword && (
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Contraseña actual */}
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value
                    })}
                    className={errors.currentPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current
                    })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-red-600 mt-1">{errors.currentPassword}</p>
                )}
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value
                    })}
                    className={errors.newPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new
                    })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
                )}

                {/* Indicador de fortaleza */}
                {passwordData.newPassword && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Fortaleza:</span>
                      <span className={`font-medium ${
                        passwordStrength.score <= 1 ? 'text-red-600' :
                        passwordStrength.score === 2 ? 'text-orange-600' :
                        passwordStrength.score === 3 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <p className="flex items-center gap-1">
                        {passwordData.newPassword.length >= 8 ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        )}
                        Mínimo 8 caracteres
                      </p>
                      <p className="flex items-center gap-1">
                        {/[a-z]/.test(passwordData.newPassword) && /[A-Z]/.test(passwordData.newPassword) ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        )}
                        Mayúsculas y minúsculas
                      </p>
                      <p className="flex items-center gap-1">
                        {/\d/.test(passwordData.newPassword) ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        )}
                        Al menos un número
                      </p>
                      <p className="flex items-center gap-1">
                        {/[^a-zA-Z0-9]/.test(passwordData.newPassword) ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        )}
                        Al menos un símbolo (!@#$%...)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value
                    })}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm
                    })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
                {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Las contraseñas coinciden
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowChangePassword(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                    setErrors({})
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cambiando...
                    </>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  )
}