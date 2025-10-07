import React, { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Package,
  CreditCard,
  Calculator,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Store,
  Sun,
  Moon,
  Bell,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/stores/authStore'
import { usePOSStore } from '@/stores/posStore'
import { useBusinessStore } from '@/stores/businessStore'
import POSView from '@/views/POSView'
import RequireCashRegister from '@/components/RequireCashRegister'

// Lazy load de otros componentes
const LoginView = lazy(() => import('@/views/LoginView'))
const InventoryView = lazy(() => import('@/views/InventoryView'))
const CreditView = lazy(() => import('@/views/CreditView'))
const CashRegisterView = lazy(() => import('@/views/CashRegisterView'))
const SettingsView = lazy(() => import('@/views/SettingsView'))
const DashboardView = lazy(() => import('@/views/DashboardView'))

// Loading component
function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    </div>
  )
}

// Navigation items
const navItems = [
  { path: '/', label: 'Venta', icon: ShoppingCart, shortcut: 'F1' },
  { path: '/inventory', label: 'Inventario', icon: Package, shortcut: 'F2' },
  { path: '/credit', label: 'Fiado', icon: CreditCard, shortcut: 'F3' },
  { path: '/cash-register', label: 'Caja', icon: Calculator, shortcut: 'F4' },
  { path: '/dashboard', label: 'Reportes', icon: BarChart3, shortcut: 'F5' },
  { path: '/settings', label: 'Configuración', icon: Settings, shortcut: 'F6' }
]

// Layout principal con navegación
function MainLayout({ children }: { children: React.ReactNode }) {
  const { business, user, logout } = useAuthStore()
  const { cart } = usePOSStore()
  const { config: businessConfig } = useBusinessStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications] = useState(3) // Mock de notificaciones

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Manejar atajos de teclado de navegación
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo activar si no hay inputs, textareas o modales activos
      const isInputActive =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'

      if (isInputActive) return

      // Mapeo de teclas F a rutas
      const keyMap: { [key: string]: string } = {
        'F1': '/',
        'F2': '/inventory',
        'F3': '/credit',
        'F4': '/cash-register',
        'F5': '/dashboard',
        'F6': '/settings'
      }

      const route = keyMap[e.key]
      if (route) {
        e.preventDefault()
        navigate(route)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header/Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-4 shadow-sm">
        <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
          {/* Logo y menú móvil */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            
            <div className="flex items-center gap-2">
              {businessConfig.logo ? (
                <img src={businessConfig.logo} alt="Logo" className="h-8 w-8 object-contain" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {businessConfig.name || 'NexoPOS'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  {business?.name || 'Sistema de Punto de Venta'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Navegación desktop */}
          <nav className="hidden md:flex gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.path === '/' && cart.length > 0 && (
                  <Badge className="ml-1 h-5 px-1" variant="secondary">
                    {cart.length}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
          
          {/* Acciones del usuario */}
          <div className="flex items-center gap-2">
            {/* Botón de notificaciones */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>
            
            {/* Toggle dark mode */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {/* Menú de usuario */}
            <div className="flex items-center gap-2 ml-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role || 'Administrador'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <User className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-6">
                  {businessConfig.logo ? (
                    <img src={businessConfig.logo} alt="Logo" className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">
                      {businessConfig.name || 'NexoPOS'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {business?.name || 'Punto de Venta'}
                    </p>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  {navItems.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => `
                        flex items-center justify-between px-3 py-3 rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-primary text-white' 
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.path === '/' && cart.length > 0 && (
                        <Badge variant="secondary">
                          {cart.length}
                        </Badge>
                      )}
                    </NavLink>
                  ))}
                </nav>
                
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.role || 'Administrador'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      
      {/* Footer con atajos de teclado (solo desktop) */}
      <footer className="hidden md:flex items-center justify-center gap-4 px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        {navItems.map(item => (
          <div key={item.path} className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 font-mono">
              {item.shortcut}
            </kbd>
            <span>{item.label}</span>
          </div>
        ))}
      </footer>
    </div>
  )
}

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Ruta de login */}
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginView />
            } />

            {/* Rutas protegidas */}
            <Route path="/" element={
              !isAuthenticated ? <Navigate to="/login" replace /> : (
                <RequireCashRegister>
                  <MainLayout>
                    <POSView />
                  </MainLayout>
                </RequireCashRegister>
              )
            } />

            <Route path="/inventory" element={
              !isAuthenticated ? <Navigate to="/login" replace /> : (
                <RequireCashRegister>
                  <MainLayout>
                    <InventoryView />
                  </MainLayout>
                </RequireCashRegister>
              )
            } />

            <Route path="/credit" element={
              !isAuthenticated ? <Navigate to="/login" replace /> : (
                <RequireCashRegister>
                  <MainLayout>
                    <CreditView />
                  </MainLayout>
                </RequireCashRegister>
              )
            } />

            <Route path="/cash-register" element={
              !isAuthenticated ? <Navigate to="/login" replace /> : (
                <MainLayout>
                  <CashRegisterView />
                </MainLayout>
              )
            } />

            <Route path="/dashboard" element={
              !isAuthenticated ? <Navigate to="/login" replace /> : (
                <MainLayout>
                  <DashboardView />
                </MainLayout>
              )
            } />

            <Route path="/settings" element={
              !isAuthenticated ? <Navigate to="/login" replace /> : (
                <MainLayout>
                  <SettingsView />
                </MainLayout>
              )
            } />

            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster />
    </>
  )
}

