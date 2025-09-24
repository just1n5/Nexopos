import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Product, ProductVariant } from '@/types'
import { generateId } from '@/lib/utils'

interface InventoryState {
  products: Product[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  selectedCategory: string | null
  
  // Actions
  setProducts: (products: Product[]) => void
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  updateStock: (productId: string, quantity: number, variantId?: string) => void
  searchProducts: (query: string) => void
  filterByCategory: (category: string | null) => void
  
  // Getters
  getProduct: (id: string) => Product | undefined
  getLowStockProducts: (threshold?: number) => Product[]
  getOutOfStockProducts: () => Product[]
  getCategories: () => string[]
  getFilteredProducts: () => Product[]
}

export const useInventoryStore = create<InventoryState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        products: [
          {
            id: '1',
            sku: 'PRD001',
            name: 'Coca-Cola 350ml',
            price: 3500,
            stock: 50,
            category: 'Bebidas',
            tax: 19,
            barcode: '7702004000001',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            sku: 'PRD002',
            name: 'Pan Tajado Bimbo',
            price: 8500,
            stock: 30,
            category: 'Panadería',
            tax: 5,
            barcode: '7702004000002',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            sku: 'PRD003',
            name: 'Leche Alpina 1L',
            price: 4800,
            stock: 25,
            category: 'Lácteos',
            tax: 5,
            barcode: '7702004000003',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '4',
            sku: 'PRD004',
            name: 'Doritos Nacho',
            price: 5200,
            stock: 40,
            category: 'Snacks',
            tax: 19,
            barcode: '7702004000004',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '5',
            sku: 'PRD005',
            name: 'Papel Higiénico Scott',
            price: 15000,
            stock: 20,
            category: 'Aseo',
            tax: 19,
            barcode: '7702004000005',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '6',
            sku: 'PRD006',
            name: 'Arroz Diana 1kg',
            price: 4200,
            stock: 35,
            category: 'Granos',
            tax: 5,
            barcode: '7702004000006',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '7',
            sku: 'PRD007',
            name: 'Aceite Girasol 1L',
            price: 12000,
            stock: 15,
            category: 'Abarrotes',
            tax: 5,
            barcode: '7702004000007',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '8',
            sku: 'PRD008',
            name: 'Detergente Fab 1kg',
            price: 18500,
            stock: 8,
            category: 'Aseo',
            tax: 19,
            barcode: '7702004000008',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '9',
            sku: 'PRD009',
            name: 'Galletas Oreo',
            price: 4800,
            stock: 45,
            category: 'Snacks',
            tax: 19,
            barcode: '7702004000009',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '10',
            sku: 'PRD010',
            name: 'Café Sello Rojo 500g',
            price: 16000,
            stock: 12,
            category: 'Bebidas',
            tax: 5,
            barcode: '7702004000010',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        isLoading: false,
        error: null,
        searchQuery: '',
        selectedCategory: null,
        
        // Set products
        setProducts: (products) => {
          set({ products })
        },
        
        // Add product
        addProduct: (productData) => {
          const newProduct: Product = {
            ...productData,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          set((state) => ({
            products: [...state.products, newProduct]
          }))
        },
        
        // Update product
        updateProduct: (id, productData) => {
          set((state) => ({
            products: state.products.map(product =>
              product.id === id
                ? { ...product, ...productData, updatedAt: new Date() }
                : product
            )
          }))
        },
        
        // Delete product
        deleteProduct: (id) => {
          set((state) => ({
            products: state.products.filter(product => product.id !== id)
          }))
        },
        
        // Update stock
        updateStock: (productId, quantity, variantId) => {
          set((state) => ({
            products: state.products.map(product => {
              if (product.id === productId) {
                if (variantId && product.variants) {
                  // Update variant stock
                  const updatedVariants = product.variants.map(variant =>
                    variant.id === variantId
                      ? { ...variant, stock: variant.stock + quantity }
                      : variant
                  )
                  return { ...product, variants: updatedVariants, updatedAt: new Date() }
                } else {
                  // Update main product stock
                  return { ...product, stock: product.stock + quantity, updatedAt: new Date() }
                }
              }
              return product
            })
          }))
        },
        
        // Search products
        searchProducts: (query) => {
          set({ searchQuery: query })
        },
        
        // Filter by category
        filterByCategory: (category) => {
          set({ selectedCategory: category })
        },
        
        // Get single product
        getProduct: (id) => {
          return get().products.find(product => product.id === id)
        },
        
        // Get low stock products
        getLowStockProducts: (threshold = 10) => {
          return get().products.filter(product => 
            product.stock > 0 && product.stock <= threshold
          )
        },
        
        // Get out of stock products
        getOutOfStockProducts: () => {
          return get().products.filter(product => product.stock === 0)
        },
        
        // Get categories
        getCategories: () => {
          const categories = new Set(get().products.map(p => p.category))
          return Array.from(categories).sort()
        },
        
        // Get filtered products
        getFilteredProducts: () => {
          const state = get()
          let filtered = [...state.products]
          
          // Apply search filter
          if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase()
            filtered = filtered.filter(product =>
              product.name.toLowerCase().includes(query) ||
              product.sku.toLowerCase().includes(query) ||
              product.barcode?.includes(query)
            )
          }
          
          // Apply category filter
          if (state.selectedCategory) {
            filtered = filtered.filter(product =>
              product.category === state.selectedCategory
            )
          }
          
          return filtered
        }
      }),
      {
        name: 'inventory-storage',
        partialize: (state) => ({ products: state.products })
      }
    )
  )
)
