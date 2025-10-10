import { apiFetch } from '@/lib/api'
import type { User, CreateUserDto, UpdateUserDto, ChangePasswordDto } from '@/types'

class UsersService {
  async getAll(token: string): Promise<User[]> {
    const response = await apiFetch('/users', {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener usuarios')
    }

    const data = await response.json()
    return data.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    }))
  }

  async getById(id: string, token: string): Promise<User> {
    const response = await apiFetch(`/users/${id}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener usuario')
    }

    const data = await response.json()
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    }
  }

  async getProfile(token: string): Promise<User> {
    const response = await apiFetch('/users/me', {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener perfil')
    }

    const data = await response.json()
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    }
  }

  async create(createUserDto: CreateUserDto, token: string): Promise<User> {
    const response = await apiFetch('/users', {
      method: 'POST',
      token,
      body: JSON.stringify(createUserDto)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear usuario')
    }

    const data = await response.json()
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, token: string): Promise<User> {
    const response = await apiFetch(`/users/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(updateUserDto)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar usuario')
    }

    const data = await response.json()
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    }
  }

  async delete(id: string, token: string): Promise<void> {
    const response = await apiFetch(`/users/${id}`, {
      method: 'DELETE',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar usuario')
    }
  }

  async toggleActive(id: string, token: string): Promise<User> {
    const response = await apiFetch(`/users/${id}/toggle-active`, {
      method: 'PATCH',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al cambiar estado')
    }

    const data = await response.json()
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto, token: string): Promise<void> {
    const response = await apiFetch('/users/me/change-password', {
      method: 'PATCH',
      token,
      body: JSON.stringify(changePasswordDto)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al cambiar contraseña')
    }
  }

  async checkUserExists(identifier: string): Promise<{ exists: boolean; name?: string; email?: string }> {
    const response = await apiFetch('/auth/check-user', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al verificar usuario')
    }

    return response.json()
  }
}

export const usersService = new UsersService()
