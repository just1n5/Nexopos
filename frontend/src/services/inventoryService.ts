import { apiFetch } from '@/lib/api'

export enum MovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER',
  DAMAGE = 'DAMAGE',
  PRODUCTION = 'PRODUCTION'
}

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export interface InventoryStock {
  id: string
  productId: string
  productVariantId?: string
  quantity: number
  availableQuantity: number
  reservedQuantity: number
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
  reorderQuantity: number
  unitOfMeasure: string
  averageCost: number
  lastCost: number
  totalValue: number
  warehouseId?: string
  location?: string
  batchNumber?: string
  expiryDate?: Date
  status: StockStatus
  isLowStock: boolean
  lastMovementId?: string
  lastMovementDate?: Date
  lastCountDate?: Date
  lastCountQuantity?: number
  createdAt: Date
  updatedAt: Date
}

export interface InventoryMovement {
  id: string
  productId: string
  productVariantId?: string
  movementType: MovementType
  quantity: number
  quantityBefore: number
  quantityAfter: number
  unitCost?: number
  totalCost?: number
  referenceType?: string
  referenceId?: string
  referenceNumber?: string
  batchNumber?: string
  expiryDate?: Date
  warehouseId?: string
  fromWarehouseId?: string
  toWarehouseId?: string
  notes?: string
  reason?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface AdjustStockDto {
  productId: string
  quantity: number
  movementType: MovementType
  variantId?: string
  warehouseId?: string
  unitCost?: number
  notes?: string
  reason?: string
}

export interface StockCountDto {
  productId: string
  actualQuantity: number
  variantId?: string
  warehouseId?: string
  batchNumber?: string
  notes?: string
}

export interface StockValuation {
  totalValue: number
  totalItems: number
  totalProducts: number
  byStatus: {
    inStock: number
    lowStock: number
    outOfStock: number
  }
}

class InventoryService {
  async getStock(productId: string, variantId?: string, warehouseId?: string, token?: string): Promise<InventoryStock> {
    const params = new URLSearchParams()
    if (variantId) params.append('variantId', variantId)
    if (warehouseId) params.append('warehouseId', warehouseId)

    const response = await apiFetch(`/inventory/stock/${productId}?${params.toString()}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Failed to fetch stock information')
    }

    return response.json()
  }

  async getLowStockProducts(warehouseId?: string, token?: string): Promise<InventoryStock[]> {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : ''
    
    const response = await apiFetch(`/inventory/low-stock${params}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Failed to fetch low stock products')
    }

    return response.json()
  }

  async getExpiringProducts(daysAhead = 30, warehouseId?: string, token?: string): Promise<InventoryStock[]> {
    const params = new URLSearchParams()
    params.append('daysAhead', daysAhead.toString())
    if (warehouseId) params.append('warehouseId', warehouseId)

    const response = await apiFetch(`/inventory/expiring?${params.toString()}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Failed to fetch expiring products')
    }

    return response.json()
  }

  async getMovements(filters?: {
    productId?: string
    variantId?: string
    warehouseId?: string
    movementType?: MovementType
    startDate?: Date
    endDate?: Date
  }, token?: string): Promise<InventoryMovement[]> {
    const params = new URLSearchParams()
    if (filters?.productId) params.append('productId', filters.productId)
    if (filters?.variantId) params.append('variantId', filters.variantId)
    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId)
    if (filters?.movementType) params.append('movementType', filters.movementType)
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString())
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString())

    const response = await apiFetch(`/inventory/movements?${params.toString()}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Failed to fetch inventory movements')
    }

    return response.json()
  }

  async getValuation(warehouseId?: string, token?: string): Promise<StockValuation> {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : ''
    
    const response = await apiFetch(`/inventory/valuation${params}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Failed to fetch stock valuation')
    }

    return response.json()
  }

  async adjustStock(data: AdjustStockDto, token: string): Promise<InventoryMovement> {
    const response = await apiFetch('/inventory/adjust-stock', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to adjust stock' }))
      throw new Error(error.message || 'Failed to adjust stock')
    }

    return response.json()
  }

  async performStockCount(data: StockCountDto, token: string): Promise<{
    success: boolean
    message: string
    movement?: InventoryMovement
  }> {
    const response = await apiFetch('/inventory/stock-count', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to perform stock count' }))
      throw new Error(error.message || 'Failed to perform stock count')
    }

    return response.json()
  }
}

export const inventoryService = new InventoryService()
