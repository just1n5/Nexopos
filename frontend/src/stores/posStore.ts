import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { SaleStatus, type CartItem, type Product, type ProductVariant, type Customer, type PaymentMethod, type Sale } from '@/types'
import { generateId } from '@/lib/utils'

interface POSState {
  // Cart State
  cart: CartItem[]
  selectedCustomer: Customer | null
  discount: number
  notes: string
  
  // Actions
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateDiscount: (itemId: string, discount: number) => void
  clearCart: () => void
  setGlobalDiscount: (discount: number) => void
  setCustomer: (customer: Customer | null) => void
  setNotes: (notes: string) => void
  
  // Calculations
  getSubtotal: () => number
  getTotalDiscount: () => number
  getTotalTax: () => number
  getTotal: () => number
  
  // Sale Processing
  processSale: (paymentMethod: PaymentMethod, cashReceived?: number) => Sale | null
}

export const usePOSStore = create<POSState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        cart: [],
        selectedCustomer: null,
        discount: 0,
        notes: '',
        
        // Add product to cart
        addToCart: (product, quantity = 1, variant) => {
          set((state) => {
            const existingItem = state.cart.find(item => 
              item.product.id === product.id && 
              item.variant?.id === variant?.id
            )
            
            if (existingItem) {
              // Update quantity if item already exists
              return {
                cart: state.cart.map(item =>
                  item.id === existingItem.id
                    ? {
                        ...item,
                        quantity: item.quantity + quantity,
                        subtotal: (item.quantity + quantity) * item.price,
                        total: (item.quantity + quantity) * item.price * (1 - item.discount / 100) * (1 + item.tax / 100)
                      }
                    : item
                )
              }
            }
            
            // Add new item to cart
            const price = variant?.price || product.price
            const subtotal = price * quantity
            const tax = product.tax || 19 // Default 19% IVA in Colombia
            const taxAmount = subtotal * (tax / 100)
            
            const newItem: CartItem = {
              id: generateId(),
              product,
              variant,
              quantity,
              price,
              discount: 0,
              subtotal,
              tax: taxAmount,
              total: subtotal + taxAmount
            }
            
            return { cart: [...state.cart, newItem] }
          })
        },
        
        // Remove item from cart
        removeFromCart: (itemId) => {
          set((state) => ({
            cart: state.cart.filter(item => item.id !== itemId)
          }))
        },
        
        // Update item quantity
        updateQuantity: (itemId, quantity) => {
          if (quantity <= 0) {
            get().removeFromCart(itemId)
            return
          }
          
          set((state) => ({
            cart: state.cart.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    quantity,
                    subtotal: quantity * item.price,
                    tax: quantity * item.price * (item.product.tax / 100),
                    total: quantity * item.price * (1 - item.discount / 100) * (1 + item.product.tax / 100)
                  }
                : item
            )
          }))
        },
        
        // Update item discount
        updateDiscount: (itemId, discount) => {
          set((state) => ({
            cart: state.cart.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    discount,
                    total: item.subtotal * (1 - discount / 100) * (1 + item.product.tax / 100)
                  }
                : item
            )
          }))
        },
        
        // Clear cart
        clearCart: () => {
          set({ 
            cart: [], 
            selectedCustomer: null, 
            discount: 0, 
            notes: '' 
          })
        },
        
        // Set global discount
        setGlobalDiscount: (discount) => {
          set((state) => {
            const updatedCart = state.cart.map(item => ({
              ...item,
              discount,
              total: item.subtotal * (1 - discount / 100) * (1 + item.product.tax / 100)
            }))
            return { discount, cart: updatedCart }
          })
        },
        
        // Set customer
        setCustomer: (customer) => {
          set({ selectedCustomer: customer })
        },
        
        // Set notes
        setNotes: (notes) => {
          set({ notes })
        },
        
        // Calculate subtotal
        getSubtotal: () => {
          const state = get()
          return state.cart.reduce((sum, item) => sum + item.subtotal, 0)
        },
        
        // Calculate total discount
        getTotalDiscount: () => {
          const state = get()
          return state.cart.reduce((sum, item) => 
            sum + (item.subtotal * item.discount / 100), 0
          )
        },
        
        // Calculate total tax
        getTotalTax: () => {
          const state = get()
          return state.cart.reduce((sum, item) => sum + item.tax, 0)
        },
        
        // Calculate total
        getTotal: () => {
          const state = get()
          return state.cart.reduce((sum, item) => sum + item.total, 0)
        },
        
        // Process sale
        processSale: (paymentMethod, cashReceived) => {
          const state = get()
          
          if (state.cart.length === 0) return null
          
          const sale: Sale = {
            id: generateId(),
            date: new Date(),
            items: [...state.cart],
            subtotal: state.getSubtotal(),
            discount: state.getTotalDiscount(),
            tax: state.getTotalTax(),
            total: state.getTotal(),
            paymentMethod,
            customerId: state.selectedCustomer?.id,
            status: SaleStatus.COMPLETED,
            notes: state.notes,
            cashReceived,
            change: cashReceived ? cashReceived - state.getTotal() : undefined,
            createdBy: 'current-user-id' // This should come from auth
          }
          
          // Clear cart after sale
          state.clearCart()
          
          return sale
        }
      }),
      {
        name: 'pos-storage',
        partialize: (state) => ({ cart: state.cart }) // Only persist cart
      }
    )
  )
)
