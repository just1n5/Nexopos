import { apiFetch } from '@/lib/api'

export interface Category {
  id: string
  name: string
  description?: string
  parentId?: string | null
  isActive?: boolean
  sortOrder?: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateCategoryDto {
  name: string
  description?: string
  parentId?: string
  color?: string
  icon?: string
}

type ApiCategory = {
  id: string
  name: string
  description?: string | null
  parent?: { id: string } | null
  parentId?: string | null
  isActive?: boolean
  sortOrder?: number
  createdAt?: string | null
  updatedAt?: string | null
}

const toDate = (value?: string | null): Date => {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

const mapCategory = (payload: ApiCategory): Category => ({
  id: payload.id,
  name: payload.name,
  description: payload.description ?? undefined,
  parentId: payload.parentId ?? payload.parent?.id ?? undefined,
  isActive: payload.isActive,
  sortOrder: payload.sortOrder,
  createdAt: toDate(payload.createdAt),
  updatedAt: toDate(payload.updatedAt)
})

async function parseResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  if (!response.ok) {
    let message = defaultMessage
    try {
      const errorBody = await response.json()
      if (typeof errorBody?.message === 'string') {
        message = errorBody.message
      } else if (Array.isArray(errorBody?.message)) {
        message = errorBody.message.join('\n')
      }
    } catch (error) {
      console.warn('No fue posible interpretar la respuesta de error', error)
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

class CategoriesService {
  async getCategories(token?: string): Promise<Category[]> {
    const response = await apiFetch('/categories', {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<ApiCategory[]>(response, 'Error al obtener las categorías')
    return payload.map(mapCategory)
  }

  async getCategoryById(id: string, token?: string): Promise<Category> {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<ApiCategory>(response, 'Error al obtener la categoría')
    return mapCategory(payload)
  }

  async createCategory(categoryData: CreateCategoryDto, token: string): Promise<Category> {
    const response = await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
      token
    })

    const payload = await parseResponse<ApiCategory>(response, 'Error al crear la categoría')
    return mapCategory(payload)
  }

  async updateCategory(id: string, categoryData: Partial<CreateCategoryDto>, token: string): Promise<Category> {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData),
      token
    })

    const payload = await parseResponse<ApiCategory>(response, 'Error al actualizar la categoría')
    return mapCategory(payload)
  }

  async deleteCategory(id: string, token: string): Promise<void> {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'DELETE',
      token
    })

    await parseResponse(response, 'Error al eliminar la categoría')
  }
}

export const categoriesService = new CategoriesService()
