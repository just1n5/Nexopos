import { useState } from 'react'
import { Edit, Trash2, Lock, Unlock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserRole, type User } from '@/types'

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
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

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
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
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
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
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
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onToggleActive(user)}
                          title={user.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {user.isActive ? (
                            <Lock className="w-4 h-4 text-red-600" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(user)}
                          title="Eliminar"
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
              </tr>
            ))}
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
        {filteredUsers.map((user) => (
          <div key={user.id} className="border rounded-lg p-4 space-y-3">
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
                  onClick={() => onToggleActive(user)}
                >
                  {user.isActive ? (
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
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Contador */}
      <p className="text-sm text-gray-600">
        Mostrando {filteredUsers.length} de {users.length} usuarios
      </p>
    </div>
  )
}
