import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Mail, Lock, Store, Eye, EyeOff, ArrowLeft, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/authStore'
import { usersService } from '@/services/usersService'

type LoginStep = 'identification' | 'authentication'
type LoginMethod = 'phone' | 'email'

export default function LoginView() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const isLoading = useAuthStore(state => state.isLoading)

  // State management
  const [step, setStep] = useState<LoginStep>('identification')
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone')
  const [identifier, setIdentifier] = useState('') // phone or email
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('')

  // Handlers
  const handleIdentifierChange = (value: string) => {
    if (error) setError('')
    setIdentifier(value)
  }

  const handlePasswordChange = (value: string) => {
    if (error) setError('')
    setPassword(value)
  }

  const switchLoginMethod = () => {
    setLoginMethod(prev => prev === 'phone' ? 'email' : 'phone')
    setIdentifier('')
    setError('')
  }

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    // Basic validation
    if (!identifier.trim()) {
      setError(loginMethod === 'phone'
        ? 'Por favor ingresa tu número de celular'
        : 'Por favor ingresa tu correo electrónico')
      return
    }

    try {
      // Check if user exists in the system
      const result = await usersService.checkUserExists(identifier)

      if (!result.exists) {
        setError(`No encontramos una cuenta asociada a este ${loginMethod === 'phone' ? 'número' : 'correo'}. ¿Quieres crear una cuenta nueva?`)
        return
      }

      // Set user data from API response
      setUserName(result.name || 'Usuario')

      // Generate initials from name
      const names = (result.name || '').split(' ')
      const initials = names.map(n => n[0]).join('').toUpperCase().slice(0, 2)
      setUserInitials(initials || '??')

      // Move to authentication step
      setStep('authentication')
    } catch (err: any) {
      setError(err.message || `Error al verificar ${loginMethod === 'phone' ? 'número' : 'correo'}. Intenta de nuevo.`)
    }
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!password.trim()) {
      setError('Por favor ingresa tu contraseña')
      return
    }

    try {
      const authenticated = await login(identifier, password)
      if (authenticated) {
        navigate('/', { replace: true })
      } else {
        setError('La contraseña es incorrecta. Por favor, inténtalo de nuevo.')
      }
    } catch (err: any) {
      setError(err.message || 'La contraseña es incorrecta. Por favor, inténtalo de nuevo.')
    }
  }

  const goBack = () => {
    setStep('identification')
    setPassword('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <AnimatePresence mode="wait">
              {step === 'identification' ? (
                <motion.div
                  key="identification-header"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Ingresa a tu cuenta de NexoPOS
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-2">
                    Accede a tu sistema de punto de venta
                  </CardDescription>
                </motion.div>
              ) : (
                <motion.div
                  key="authentication-header"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {userInitials}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      Hola de nuevo, {userName.split(' ')[0]}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-sm mt-1">
                      Ingresa tu contraseña para continuar
                    </CardDescription>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === 'identification' ? (
                <motion.form
                  key="identification-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleContinue}
                  className="space-y-6"
                >
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="identifier" className="text-sm font-medium text-muted-foreground">
                      {loginMethod === 'phone' ? 'Número de celular' : 'Correo electrónico'}
                    </label>
                    <div className="relative">
                      {loginMethod === 'phone' ? (
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      ) : (
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      )}
                      <Input
                        id="identifier"
                        type={loginMethod === 'phone' ? 'tel' : 'email'}
                        placeholder={loginMethod === 'phone' ? '300 123 4567' : 'ejemplo@ejemplo.com'}
                        value={identifier}
                        onChange={(event) => handleIdentifierChange(event.target.value)}
                        className="pl-10 h-12 text-base border-2 focus:border-primary transition-colors"
                        autoComplete={loginMethod === 'phone' ? 'tel' : 'email'}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-[hsl(var(--primary-hover))] transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Verificando...
                      </div>
                    ) : (
                      'Continuar'
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={switchLoginMethod}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      o ingresa con tu {loginMethod === 'phone' ? 'correo y contraseña' : 'número de celular'}
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        O
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-12"
                    type="button"
                    onClick={() => navigate('/register')}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Crear cuenta gratuita
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="authentication-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className="mb-4 -ml-2"
                    onClick={goBack}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChange={(event) => handlePasswordChange(event.target.value)}
                        className="pl-10 pr-10 h-12 text-base border-2 focus:border-primary transition-colors"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-[hsl(var(--primary-hover))] transition-colors"
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

                  <div className="text-center">
                    <a
                      href="#"
                      className="text-sm font-medium text-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault()
                        // TODO: Navigate to password recovery flow
                        console.log('Password recovery flow')
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Cumplimiento DIAN garantizado • Soporte 24/7
        </p>
      </motion.div>
    </div>
  )
}
