import { apiFetch } from '@/lib/api'
import type { Product, ProductVariant } from '@/types'
import { ProductSaleType } from '@/types'

type ApiProductVariant = {
  id: string
  name: string
  sku: string
  priceDelta?: number | string
  stock?: number
  size?: string | null
  color?: string | null
}

type ApiProduct = {
  id: string
  name: string
  description?: string | null
  sku: string
  basePrice?: number | string
  status?: string
  saleType?: 'UNIT' | 'WEIGHT'
  pricePerGram?: number
  stock?: number
  barcode?: string | null
  categoryId?: string | null
  categoryName?: string | null
  imageUrl?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  variants?: ApiProductVariant[] | null
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const toDate = (value: string | null | undefined): Date => {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

const mapVariant = (variant: ApiProductVariant, productId: string, basePrice: number): ProductVariant => ({
  id: variant.id,
  productId,
  name: variant.name,
  sku: variant.sku,
  price: basePrice + toNumber(variant.priceDelta),
  stock: variant.stock ?? 0,
  attributes: {
    ...(variant.size ? { talla: variant.size } : {}),
    ...(variant.color ? { color: variant.color } : {})
  }
})

const mapProduct = (item: ApiProduct): Product => {
  const basePrice = toNumber(item.basePrice)
  const variants = Array.isArray(item.variants)
    ? item.variants.map((variant) => mapVariant(variant, item.id, basePrice))
    : []

  const stock =
    variants.length > 0
      ? variants.reduce((sum, variant) => sum + Number(variant.stock ?? 0), 0)
      : Number(item.stock ?? 0);

  return {
    id: item.id,
    saleType: (item.saleType ?? 'UNIT') as ProductSaleType,
    pricePerGram: item.pricePerGram,
    sku: item.sku,
    name: item.name,
    description: item.description ?? undefined,
    price: basePrice,
    stock,
    category: item.categoryName ?? 'General',
    image: item.imageUrl ?? undefined,
    tax: 0,
    variants,
    barcode: item.barcode ?? undefined,
    isActive: (item.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE',
    createdAt: toDate(item.createdAt ?? undefined),
    updatedAt: toDate(item.updatedAt ?? undefined)
  }
}

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

class ProductsService {
  async getProducts(token?: string): Promise<Product[]> {
    const response = await apiFetch('/products', {
      method: 'GET',
      token,
      skipContentType: true,
      cache: 'no-store' // Bypass browser cache
    })

    const payload = await parseResponse<ApiProduct[]>(response, 'Error al obtener los productos')
    return payload.map(mapProduct)
  }

  async getProductById(id: string, token?: string): Promise<Product> {
    const response = await apiFetch(`/products/${id}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<ApiProduct>(response, 'Error al obtener el producto')
    return mapProduct(payload)
  }

  async getProductByBarcode(barcode: string, token?: string): Promise<Product> {
    const response = await apiFetch(`/products/barcode/${barcode}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<ApiProduct>(response, 'Producto no encontrado')
    return mapProduct(payload)
  }

  async createProduct(productData: unknown, token: string): Promise<Product> {
    const response = await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
      token
    })

    const payload = await parseResponse<ApiProduct>(response, 'Error al crear el producto')
    return mapProduct(payload)
  }

  async updateProduct(id: string, productData: unknown, token: string): Promise<Product> {
    const response = await apiFetch(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData),
      token
    })

    const payload = await parseResponse<ApiProduct>(response, 'Error al actualizar el producto')
    return mapProduct(payload)
  }

  async deleteProduct(id: string, token: string): Promise<void> {
    const response = await apiFetch(`/products/${id}`, {
      method: 'DELETE',
      token
    })

    await parseResponse(response, 'Error al eliminar el producto')
  }

  async updateStock(id: string, quantity: number, variantId?: string, token?: string): Promise<Product> {
    const response = await apiFetch(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, variantId }),
      token
    })

    const payload = await parseResponse<ApiProduct>(response, 'Error al actualizar el stock')
    return mapProduct(payload)
  }

  async searchProducts(query: string, token?: string): Promise<Product[]> {
    const response = await apiFetch(`/products/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<ApiProduct[]>(response, 'Error al buscar productos')
    return payload.map(mapProduct)
  }

  async getProductsByCategory(categoryId: string, token?: string): Promise<Product[]> {
    const response = await apiFetch(`/products/category/${categoryId}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<ApiProduct[]>(response, 'Error al obtener productos por categoría')
    return payload.map(mapProduct)
  }

  async uploadProductImage(file: File, token: string): Promise<{ imageUrl: string }> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await apiFetch('/products/upload-image', {
      method: 'POST',
      body: formData,
      token,
      skipContentType: true // Let browser set multipart/form-data boundary
    })

    return parseResponse<{ imageUrl: string }>(response, 'Error al subir la imagen')
  }
}

export const productsService = new ProductsService()
