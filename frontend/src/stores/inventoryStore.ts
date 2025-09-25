import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Product } from '@/types'
import { productsService, categoriesService, inventoryService, MovementType } from '@/services'

interface InventoryState {
  products: Product[]
  categories: string[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  selectedCategory: string | null

  setProducts: (products: Product[]) => void
  fetchProducts: (token?: string) => Promise<void>
  fetchCategories: (token?: string) => Promise<void>
  updateStock: (productId: string, quantity: number, variantId?: string) => void
  adjustStock: (productId: string, quantity: number, reason: string, token: string) => Promise<void>
  searchProducts: (query: string) => void
  filterByCategory: (category: string | null) => void

  getProduct: (id: string) => Product | undefined
  getLowStockProducts: (threshold?: number) => Product[]
  getOutOfStockProducts: () => Product[]
  getCategories: () => string[]
  getFilteredProducts: () => Product[]
  clearError: () => void
}

const computeCategories = (products: Product[]): string[] => {
  const categories = new Set<string>()
  products.forEach((product) => {
    if (product.category) {
      categories.add(product.category)
    }
  })
  return Array.from(categories).sort()
}

export const useInventoryStore = create<InventoryState>()(
  devtools(
    persist(
      (set, get) => ({
        products: [],
        categories: [],
        isLoading: false,
        error: null,
        searchQuery: '',
        selectedCategory: null,

        setProducts: (products) => {
          set({
            products,
            categories: computeCategories(products)
          })
        },

        fetchProducts: async (token) => {
          set({ isLoading: true, error: null })
          try {
            const products = await productsService.getProducts(token)
            set({
              products,
              categories: computeCategories(products)
            })
          } catch (error) {
            console.error('Error cargando productos:', error)
            set({
              error: error instanceof Error ? error.message : 'No fue posible cargar los productos'
            })
          } finally {
            set({ isLoading: false })
          }
        },

        fetchCategories: async (token) => {
          try {
            const categories = await categoriesService.getCategories(token)
            const names = categories.map((category) => category.name).filter(Boolean)
            set({ categories: names })
          } catch (error) {
            console.warn('No fue posible cargar las categorías desde el backend:', error)
          }
        },

        updateStock: (productId, quantity, variantId) => {
          set((state) => ({
            products: state.products.map((product) => {
              if (product.id !== productId) {
                return product
              }

              if (variantId && product.variants) {
                const variants = product.variants.map((variant) =>
                  variant.id === variantId
                    ? { ...variant, stock: variant.stock + quantity }
                    : variant
                )
                const totalVariantStock = variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0)
                return {
                  ...product,
                  variants,
                  stock: totalVariantStock
                }
              }

              return {
                ...product,
                stock: product.stock + quantity
              }
            })
          }))
        },

        searchProducts: (query) => {
          set({ searchQuery: query })
        },

        filterByCategory: (category) => {
          set({ selectedCategory: category })
        },

        getProduct: (id) => {
          return get().products.find((product) => product.id === id)
        },

        getLowStockProducts: (threshold = 10) => {
          return get().products.filter((product) => product.stock > 0 && product.stock <= threshold)
        },

        getOutOfStockProducts: () => {
          return get().products.filter((product) => product.stock <= 0)
        },

        getCategories: () => {
          const categories = get().categories
          if (categories.length > 0) {
            return categories
          }
          return computeCategories(get().products)
        },

        getFilteredProducts: () => {
          const state = get()
          let filtered = [...state.products]

          if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase()
            filtered = filtered.filter((product) =>
              product.name.toLowerCase().includes(query) ||
              product.sku.toLowerCase().includes(query)
            )
          }

          if (state.selectedCategory) {
            filtered = filtered.filter((product) => product.category === state.selectedCategory)
          }

          return filtered
        },

        adjustStock: async (productId, quantity, reason, token) => {
          try {
            await inventoryService.adjustStock(
              {
                productId,
                quantity,
                movementType: MovementType.ADJUSTMENT,
                reason,
                notes: `Manual adjustment: ${reason}`
              },
              token
            )
            
            // Recargar productos para reflejar el cambio
            await get().fetchProducts(token)
          } catch (error) {
            console.error('Error ajustando stock:', error)
            set({
              error: error instanceof Error ? error.message : 'No fue posible ajustar el stock'
            })
            throw error
          }
        },

        clearError: () => set({ error: null })
      }),
      {
        name: 'inventory-storage',
        partialize: (state) => ({
          products: state.products,
          categories: state.categories
        })
      }
    )
  )
)
