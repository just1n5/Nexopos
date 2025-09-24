import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Mail, Lock, Store, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, SEED_ACCOUNTS } from '@/stores/authStore'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  admin: 'Admin',
  CASHIER: 'Cajero',
  cashier: 'Cajero',
  MANAGER: 'Manager',
  manager: 'Manager'
}

export default function LoginView() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const isLoading = useAuthStore(state => state.isLoading)
  const error = useAuthStore(state => state.error)
  const clearError = useAuthStore(state => state.clearError)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const authenticated = await login(email, password)
    if (authenticated) {
      navigate('/', { replace: true })
    }
  }

  const handleEmailChange = (value: string) => {
    if (error) clearError()
    setEmail(value)
  }

  const handlePasswordChange = (value: string) => {
    if (error) clearError()
    setPassword(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                <Store className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">NexoPOS</CardTitle>
            <CardDescription className="text-center">
              Sistema de Punto de Venta Inteligente para Colombia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg border border-dashed border-muted bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  Usa estas credenciales demo
                </div>
                <div className="space-y-2 text-sm">
                  {SEED_ACCOUNTS.map(account => (
                    <div key={account.email} className="flex items-start justify-between gap-2 rounded-md bg-white/70 px-3 py-2 text-left">
                      <div>
                        <p className="font-medium text-foreground">{account.name}</p>
                        <p className="text-muted-foreground">Correo: {account.email}</p>
                        <p className="text-muted-foreground">Contraseña: {account.password}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 self-start">
                        {ROLE_LABELS[account.role] ?? account.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@nexopos.co"
                    value={email}
                    onChange={(event) => handleEmailChange(event.target.value)}
                    className="pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="•••••••"
                    value={password}
                    onChange={(event) => handlePasswordChange(event.target.value)}
                    className="pl-10"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Ingresando...
                  </div>
                ) : (
                  'Ingresar'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O continúa con
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full" type="button">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Crear cuenta gratuita
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                ¿Olvidaste tu contraseña?{' '}
                <a href="#" className="text-primary hover:underline">
                  Recupérala aquí
                </a>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Cumplimiento DIAN garantizado • Soporte 24/7
        </p>
      </motion.div>
    </div>
  )
}
