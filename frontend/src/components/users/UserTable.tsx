import { useState, useEffect, useMemo } from 'react'
import { Edit, Trash2, Lock, Unlock, Search, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { UserRole, type User } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleActive: (user: User) => Promise<void>
  currentUserId: string
  currentUserRole: UserRole
}

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return <Badge className="bg-red-600">🔴 Admin</Badge>
    case UserRole.MANAGER:
      return <Badge className="bg-yellow-600">🟡 Manager</Badge>
    case UserRole.CASHIER:
      return <Badge className="bg-green-600">🟢 Cajero</Badge>
  }
}

export default function UserTable({
  users,
  onEdit,
  onDelete,
  onToggleActive,
  currentUserId,
  currentUserRole
}: UserTableProps) {
  // Estado de filtros con persistencia
  const [search, setSearch] = useState(() => sessionStorage.getItem('users-search') || '')
  const [roleFilter, setRoleFilter] = useState<string>(() => sessionStorage.getItem('users-role-filter') || 'all')
  const [statusFilter, setStatusFilter] = useState<string>(() => sessionStorage.getItem('users-status-filter') || 'all')
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  // Estado para confirmación de toggle
  const [confirmToggleUser, setConfirmToggleUser] = useState<User | null>(null)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Persistir filtros
  useEffect(() => {
    sessionStorage.setItem('users-search', search)
  }, [search])

  useEffect(() => {
    sessionStorage.setItem('users-role-filter', roleFilter)
  }, [roleFilter])

  useEffect(() => {
    sessionStorage.setItem('users-status-filter', statusFilter)
  }, [statusFilter])

  // Filtrar usuarios con useMemo para optimización
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.firstName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.lastName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(debouncedSearch.toLowerCase())

      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, debouncedSearch, roleFilter, statusFilter])

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
    sessionStorage.removeItem('users-search')
    sessionStorage.removeItem('users-role-filter')
    sessionStorage.removeItem('users-status-filter')
  }

  const hasActiveFilters = search !== '' || roleFilter !== 'all' || statusFilter !== 'all'

  const handleToggleClick = (user: User) => {
    setConfirmToggleUser(user)
  }

  const handleConfirmToggle = async () => {
    if (!confirmToggleUser) return

    setTogglingUserId(confirmToggleUser.id)
    try {
      await onToggleActive(confirmToggleUser)
    } finally {
      setTogglingUserId(null)
      setConfirmToggleUser(null)
    }
  }

  const canManageUser = (user: User): boolean => {
    // No puede gestionar su propia cuenta
    if (user.id === currentUserId) return false

    // Admin puede gestionar a todos
    if (currentUserRole === UserRole.ADMIN) return true

    // Manager solo puede gestionar cajeros
    if (currentUserRole === UserRole.MANAGER && user.role === UserRole.CASHIER) {
      return true
    }

    return false
  }

  return (
    <div className="space-y-4">
      {/* Filtros mejorados */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {search && search !== debouncedSearch && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background"
        >
          <option value="all">Todos los roles</option>
          <option value={UserRole.ADMIN}>Administrador</option>
          <option value={UserRole.MANAGER}>Manager</option>
          <option value={UserRole.CASHIER}>Cajero</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} size="sm">
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Tabla Desktop */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Usuario</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Email</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Rol</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.id === currentUserId && (
                          <span className="text-xs text-gray-500">(Tú)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <Badge variant="success">✅ Activo</Badge>
                    ) : (
                      <Badge variant="secondary">⚪ Inactivo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {canManageUser(user) && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(user)}
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleClick(user)}
                            disabled={togglingUserId === user.id}
                            title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {togglingUserId === user.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : user.isActive ? (
                              <Lock className="w-4 h-4 text-red-600" />
                            ) : (
                              <Unlock className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(user)}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {!canManageUser(user) && (
                        <span className="text-xs text-gray-400">
                          {user.id === currentUserId ? 'Tu cuenta' : 'Sin permisos'}
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className="border rounded-lg p-4 space-y-3"
            >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getRoleBadge(user.role)}
              {user.isActive ? (
                <Badge variant="success">✅ Activo</Badge>
              ) : (
                <Badge variant="secondary">⚪ Inactivo</Badge>
              )}
            </div>

            {canManageUser(user) && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(user)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleClick(user)}
                  disabled={togglingUserId === user.id}
                >
                  {togglingUserId === user.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : user.isActive ? (
                    <Lock className="w-4 h-4 text-red-600" />
                  ) : (
                    <Unlock className="w-4 h-4 text-green-600" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(user)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            )}
          </motion.div>
        ))}
        </AnimatePresence>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Mostrando {filteredUsers.length} de {users.length} usuarios</span>
        {hasActiveFilters && (
          <span className="text-xs text-gray-500">
            Filtros activos
          </span>
        )}
      </div>

      {/* Diálogo de confirmación para toggle */}
      <Dialog open={!!confirmToggleUser} onOpenChange={() => setConfirmToggleUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              {confirmToggleUser?.isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
            </DialogTitle>
            <DialogDescription className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-900 font-medium">
                      {confirmToggleUser?.isActive
                        ? '¿Desactivar este usuario?'
                        : '¿Activar este usuario?'}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {confirmToggleUser?.isActive
                        ? 'Este usuario no podrá iniciar sesión hasta que sea reactivado.'
                        : 'Este usuario podrá volver a iniciar sesión en el sistema.'}
                    </p>
                  </div>
                </div>

                {confirmToggleUser && (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {confirmToggleUser.firstName[0]}{confirmToggleUser.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {confirmToggleUser.firstName} {confirmToggleUser.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{confirmToggleUser.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmToggleUser(null)}
              disabled={!!togglingUserId}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmToggleUser?.isActive ? 'destructive' : 'default'}
              onClick={handleConfirmToggle}
              disabled={!!togglingUserId}
            >
              {togglingUserId ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : confirmToggleUser?.isActive ? (
                'Sí, Desactivar'
              ) : (
                'Sí, Activar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
