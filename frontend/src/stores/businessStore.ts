import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BusinessConfig {
  name: string
  nit: string
  address: string
  phone: string
  email: string
  regime: string
  logo?: string // Base64 encoded image
}

interface BusinessState {
  config: BusinessConfig
  updateConfig: (config: Partial<BusinessConfig>) => void
  setLogo: (logo: string) => void
}

const DEFAULT_CONFIG: BusinessConfig = {
  name: 'NexoPOS',
  nit: '',
  address: '',
  phone: '',
  email: '',
  regime: 'Responsable de IVA'
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,

      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig }
        })),

      setLogo: (logo) =>
        set((state) => ({
          config: { ...state.config, logo }
        }))
    }),
    {
      name: 'business-config'
    }
  )
)
