import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { SaleStatus, type CartItem, type Product, type ProductVariant, type Customer, type PaymentMethod, type Sale } from '@/types'
import { generateId } from '@/lib/utils'

const DEFAULT_TAX_RATE = 19

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const resolveTaxRate = (product: Product): number => {
  const value = typeof product.tax === 'number' ? product.tax : NaN
  if (Number.isFinite(value) && value > 0) {
    return value
  }
  return DEFAULT_TAX_RATE
}

const toNetUnitPrice = (price: number, taxRate: number): number => {
  const gross = Number.isFinite(price) ? price : 0
  const divisor = 1 + (Math.max(taxRate, 0) / 100)
  if (divisor <= 0) {
    return roundCurrency(gross)
  }
  return roundCurrency(gross / divisor)
}

const calculateLineTotals = (price: number, quantity: number, discountPercent: number, taxRate: number) => {
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0
  const normalizedDiscount = Number.isFinite(discountPercent) ? Math.min(Math.max(discountPercent, 0), 100) : 0
  const normalizedTax = Number.isFinite(taxRate) ? Math.max(taxRate, 0) : DEFAULT_TAX_RATE

  const unitPrice = toNetUnitPrice(price, normalizedTax)
  const discountFactor = 1 - normalizedDiscount / 100

  const netBeforeDiscount = unitPrice * safeQuantity
  const netAfterDiscount = netBeforeDiscount * discountFactor
  const subtotal = roundCurrency(netAfterDiscount)
  const taxAmount = roundCurrency(subtotal * (normalizedTax / 100))
  const total = roundCurrency(subtotal + taxAmount)

  return {
    unitPrice,
    subtotal,
    taxAmount,
    total
  }
}

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
              return {
                cart: state.cart.map(item => {
                  if (item.id !== existingItem.id) {
                    return item
                  }

                  const nextQuantity = item.quantity + quantity
                  const taxRate = item.taxRate ?? resolveTaxRate(item.product)
                  const { unitPrice, subtotal, taxAmount, total } = calculateLineTotals(item.price, nextQuantity, item.discount, taxRate)

                  return {
                    ...item,
                    quantity: nextQuantity,
                    unitPrice,
                    subtotal,
                    tax: taxAmount,
                    taxRate,
                    total
                  }
                })
              }
            }

            const price = variant?.price ?? product.price
            const taxRate = resolveTaxRate(product)
            const { unitPrice, subtotal, taxAmount, total } = calculateLineTotals(price, quantity, 0, taxRate)

            const newItem: CartItem = {
              id: generateId(),
              product,
              variant,
              quantity,
              price,
              unitPrice,
              discount: 0,
              subtotal,
              tax: taxAmount,
              taxRate,
              total
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
            cart: state.cart.map(item => {
              if (item.id !== itemId) {
                return item
              }

              const taxRate = item.taxRate ?? resolveTaxRate(item.product)
              const { unitPrice, subtotal, taxAmount, total } = calculateLineTotals(item.price, quantity, item.discount, taxRate)

              return {
                ...item,
                quantity,
                unitPrice,
                subtotal,
                tax: taxAmount,
                taxRate,
                total
              }
            })
          }))
        },

        // Update item discount
        updateDiscount: (itemId, discount) => {
          set((state) => ({
            cart: state.cart.map(item => {
              if (item.id !== itemId) {
                return item
              }

              const taxRate = item.taxRate ?? resolveTaxRate(item.product)
              const { unitPrice, subtotal, taxAmount, total } = calculateLineTotals(item.price, item.quantity, discount, taxRate)

              return {
                ...item,
                discount,
                unitPrice,
                subtotal,
                tax: taxAmount,
                taxRate,
                total
              }
            })
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
            const updatedCart = state.cart.map(item => {
              const taxRate = item.taxRate ?? resolveTaxRate(item.product)
              const { unitPrice, subtotal, taxAmount, total } = calculateLineTotals(item.price, item.quantity, discount, taxRate)

              return {
                ...item,
                discount,
                unitPrice,
                subtotal,
                tax: taxAmount,
                taxRate,
                total
              }
            })
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
          const subtotal = state.cart.reduce((sum, item) => sum + (item.subtotal ?? 0), 0)
          return roundCurrency(subtotal)
        },
        
        // Calculate total discount
        getTotalDiscount: () => {
          const state = get()
          const discount = state.cart.reduce((sum, item) => {
            const taxRate = item.taxRate ?? resolveTaxRate(item.product)
            const baseUnitPrice = item.unitPrice ?? toNetUnitPrice(item.price, taxRate)
            const quantity = Number.isFinite(item.quantity) ? item.quantity : 0
            const netBeforeDiscount = baseUnitPrice * quantity
            return sum + (netBeforeDiscount - (item.subtotal ?? 0))
          }, 0)
          return roundCurrency(discount)
        },
        
        // Calculate total tax
        getTotalTax: () => {
          const state = get()
          const tax = state.cart.reduce((sum, item) => sum + (item.tax ?? 0), 0)
          return roundCurrency(tax)
        },
        
        // Calculate total
        getTotal: () => {
          const state = get()
          const total = state.cart.reduce((sum, item) => sum + (item.total ?? 0), 0)
          return roundCurrency(total)
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
            change: cashReceived ? roundCurrency(cashReceived - state.getTotal()) : undefined,
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
