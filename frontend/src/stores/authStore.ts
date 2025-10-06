import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Business, DianResolution, User } from '@/types';
import { UserRole } from '@/types';
import { apiFetch } from '@/lib/api';

interface AuthState {
  user: User | null;
  business: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  setBusiness: (business: Business) => void;
  updateBusinessInfo: (business: Partial<Business>) => void;
  updateDianResolution: (resolution: Partial<DianResolution>) => void;
  clearError: () => void;
}

type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
};

type ApiLoginResponse = {
  user: ApiUser;
  accessToken: string;
};

type SeedAccount = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
};

const LOGIN_PATH = '/auth/login';

const roleFromApi = (role: string): UserRole => {
  switch (role.toUpperCase()) {
    case 'ADMIN':
      return UserRole.ADMIN;
    case 'MANAGER':
      return UserRole.MANAGER;
    case 'CASHIER':
      return UserRole.CASHIER;
    default:
      return UserRole.CASHIER;
  }
};

const toUser = (payload: ApiUser): User => ({
  id: payload.id,
  name: `${payload.firstName} ${payload.lastName}`.trim(),
  email: payload.email,
  phone: payload.phone ?? '',
  role: roleFromApi(payload.role),
  isActive: payload.isActive,
  createdAt: new Date(payload.createdAt),
  updatedAt: new Date(payload.updatedAt),
});

const createDefaultBusiness = (): Business => ({
  id: 'default-business',
  name: import.meta.env.VITE_BUSINESS_NAME ?? 'Mi Tienda SAS',
  nit: import.meta.env.VITE_BUSINESS_NIT ?? '900123456-7',
  address: import.meta.env.VITE_BUSINESS_ADDRESS ?? 'Calle 123 #45-67',
  phone: import.meta.env.VITE_BUSINESS_PHONE ?? '+57 300 123 4567',
  email: import.meta.env.VITE_BUSINESS_EMAIL ?? 'info@mitienda.co',
  createdAt: new Date(),
  updatedAt: new Date(),
  dianResolution: undefined,
});

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data?.message === 'string') {
      return data.message;
    }
    if (Array.isArray(data?.message)) {
      return data.message.join(' ');
    }
  } catch (error) {
    console.warn('No se pudo interpretar el error de login:', error);
  }
  return response.status === 401
    ? 'Credenciales inválidas. Revisa el correo y la contraseña.'
    : 'Ocurrió un error inesperado al iniciar sesión.';
};

export const SEED_ACCOUNTS: SeedAccount[] = [
  {
    email: 'admin@nexopos.co',
    password: 'Admin123!',
    role: UserRole.ADMIN,
    name: 'Admin NexoPOS',
  },
  {
    email: 'cajero@nexopos.co',
    password: 'Cajero123!',
    role: UserRole.CASHIER,
    name: 'Juan Cajero',
  },
  {
    email: 'demo@nexopos.co',
    password: 'Demo123!',
    role: UserRole.CASHIER,
    name: 'Demo User',
  },
];

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        business: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiFetch(LOGIN_PATH, {
              method: 'POST',
              body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
              const message = await parseErrorMessage(response);
              set({
                isLoading: false,
                isAuthenticated: false,
                error: message,
              });
              return false;
            }

            const payload: ApiLoginResponse = await response.json();
            const user = toUser(payload.user);

            set({
              user,
              business: createDefaultBusiness(),
              token: payload.accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return true;
          } catch (error) {
            console.error('Error iniciando sesión:', error);
            set({
              isLoading: false,
              isAuthenticated: false,
              error: 'No fue posible conectar con el servidor. Intenta de nuevo.',
            });
            return false;
          }
        },

        logout: () => {
          set({
            user: null,
            business: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        },

        setUser: (user) => {
          set({ user });
        },

        setBusiness: (business) => {
          set({ business });
        },

        updateBusinessInfo: (businessData) => {
          const currentBusiness = get().business;
          if (currentBusiness) {
            set({
              business: {
                ...currentBusiness,
                ...businessData,
                updatedAt: new Date(),
              },
            });
          } else {
            set({ business: { ...createDefaultBusiness(), ...businessData, updatedAt: new Date() } });
          }
        },

        updateDianResolution: (resolutionData) => {
          const currentBusiness = get().business;
          if (currentBusiness && currentBusiness.dianResolution) {
            set({
              business: {
                ...currentBusiness,
                dianResolution: {
                  ...currentBusiness.dianResolution,
                  ...resolutionData,
                } as DianResolution,
                updatedAt: new Date(),
              },
            });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          business: state.business,
          isAuthenticated: state.isAuthenticated,
          token: state.token,
        }),
      }
    )
  )
);
