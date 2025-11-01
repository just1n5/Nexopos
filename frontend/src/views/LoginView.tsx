import { FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Mail,
  Lock,
  Store,
  Eye,
  EyeOff,
  ArrowLeft,
  Smartphone,
  Bot,
  LineChart,
  ShieldCheck,
} from 'lucide-react'
import gsap from 'gsap'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/authStore'
import { usersService } from '@/services/usersService'

type LoginStep = 'identification' | 'authentication'
type LoginMethod = 'phone' | 'email'
type PupilRegister = (index: number, element: SVGCircleElement | null) => void

const marketingHighlights = [
  {
    icon: Bot,
    title: 'Asistente IA',
    description: 'Gestiona tu inventario solo con tu voz.',
  },
  {
    icon: LineChart,
    title: 'Control total',
    description: "Administra ventas, fiado y reportes en un solo lugar.",
  },
  {
    icon: ShieldCheck,
    title: 'Cumplimiento DIAN',
    description: 'Facturación electrónica y documentos soporte sin estrés.',
  },
] as const

export default function LoginView() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const isLoading = useAuthStore(state => state.isLoading)

  const [step, setStep] = useState<LoginStep>('identification')
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('')
  const pupilRefs = useRef<SVGCircleElement[]>([])

  const handleIdentifierChange = (value: string) => {
    if (error) setError('')
    setIdentifier(value)
  }

  const handlePasswordChange = (value: string) => {
    if (error) setError('')
    setPassword(value)
  }

  const switchLoginMethod = () => {
    setLoginMethod(prev => (prev === 'phone' ? 'email' : 'phone'))
    setIdentifier('')
    setError('')
  }

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!identifier.trim()) {
      setError(
        loginMethod === 'phone'
          ? 'Por favor ingresa tu número de celular'
          : 'Por favor ingresa tu correo electrónico',
      )
      return
    }

    try {
      const result = await usersService.checkUserExists(identifier)

      if (!result.exists) {
        setError(
          `No encontramos una cuenta asociada a este ${loginMethod === 'phone' ? 'número' : 'correo'}. ¿Quieres crear una cuenta nueva?`,
        )
        return
      }

      setUserName(result.name || 'Usuario')

      const names = (result.name || '').split(' ')
      const initials = names.map(name => name[0]).join('').toUpperCase().slice(0, 2)
      setUserInitials(initials || '??')

      setStep('authentication')
    } catch (errorResponse: any) {
      setError(
        errorResponse.message ||
          `Error al verificar ${loginMethod === 'phone' ? 'número' : 'correo'}. Intenta de nuevo.`,
      )
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
    } catch (errorResponse: any) {
      setError(errorResponse.message || 'La contraseña es incorrecta. Por favor, inténtalo de nuevo.')
    }
  }

  const goBack = () => {
    setStep('identification')
    setPassword('')
    setError('')
  }

  useEffect(() => {
    if (!pupilRefs.current.length) return

    gsap.set(pupilRefs.current, { transformOrigin: '50% 50%' })

    const handleMouseMove = (event: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      const normalizedX = (event.clientX / innerWidth) * 2 - 1
      const normalizedY = (event.clientY / innerHeight) * 2 - 1
      const maxOffset = 8

      pupilRefs.current.forEach(pupil => {
        gsap.to(pupil, {
          x: normalizedX * maxOffset,
          y: normalizedY * maxOffset,
          duration: 0.4,
          ease: 'power2.out',
        })
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const registerPupil: PupilRegister = (index, element) => {
    if (element) {
      pupilRefs.current[index] = element
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-foreground flex flex-col-reverse lg:grid lg:grid-cols-2">
      <div className="relative flex flex-col justify-between bg-slate-950 text-white px-8 py-12 md:px-12 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/40" />
        <div className="relative z-10 space-y-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.3em] text-white/70">
            Inteligente · Amigable · Profesional
          </span>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-semibold leading-tight md:text-5xl"
            >
              Tu negocio, más inteligente.
            </motion.h1>
            <p className="text-lg text-white/75 md:text-xl">
              El POS que trabaja como tu mejor empleado.
            </p>
          </div>

          <ul className="space-y-6">
            {marketingHighlights.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{title}</p>
                  <p className="text-sm text-white/70">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-12 flex justify-end">
          <OwlMascot onPupilRegister={registerPupil} />
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-gray-50">
        <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="mb-10 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
                <Store className="h-8 w-8 text-white" />
              </div>
            </div>

            <Card className="border-0 shadow-2xl">
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
                      <CardDescription className="mt-2 text-muted-foreground">
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                        {userInitials}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-foreground">
                          Hola de nuevo, {userName.split(' ')[0]}
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm text-muted-foreground">
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
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          )}
                          <Input
                            id="identifier"
                            type={loginMethod === 'phone' ? 'tel' : 'email'}
                            placeholder={loginMethod === 'phone' ? '300 123 4567' : 'ejemplo@ejemplo.com'}
                            value={identifier}
                            onChange={event => handleIdentifierChange(event.target.value)}
                            className="h-12 pl-10 text-base"
                            autoComplete={loginMethod === 'phone' ? 'tel' : 'email'}
                            required
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="h-12 w-full text-base font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
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
                          <span className="bg-card px-2 text-muted-foreground">O</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="h-12 w-full"
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
                        <ArrowLeft className="mr-2 h-4 w-4" />
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
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={event => handlePasswordChange(event.target.value)}
                            className="h-12 pl-10 pr-10 text-base"
                            autoComplete="current-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="h-12 w-full text-base font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
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
                          onClick={event => {
                            event.preventDefault()
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
          </motion.div>
        </div>

        <p className="px-6 pb-8 text-center text-sm text-muted-foreground md:px-12">
          Cumplimiento DIAN garantizado • Soporte 24/7
        </p>
      </div>
    </div>
  )
}

function OwlMascot({ onPupilRegister }: { onPupilRegister: PupilRegister }) {
  return (
    <svg
      viewBox="0 0 360 200"
      className="h-48 w-auto drop-shadow-[0_20px_45px_rgba(15,23,42,0.45)]"
      role="img"
      aria-labelledby="owl-mascot-title"
    >
      <title id="owl-mascot-title">Asistentes inteligentes de NexoPOS observando</title>
      <defs>
        <linearGradient id="owl-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      <g transform="translate(50 30)">
        <Owl
          x={0}
          pupilIndexes={[0, 1]}
          onPupilRegister={onPupilRegister}
        />
        <Owl
          x={160}
          pupilIndexes={[2, 3]}
          onPupilRegister={onPupilRegister}
        />
        <path
          d="M20 150 Q130 180 240 150"
          fill="none"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={10}
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

function Owl({
  x,
  pupilIndexes,
  onPupilRegister,
}: {
  x: number
  pupilIndexes: [number, number]
  onPupilRegister: PupilRegister
}) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect
        x={0}
        y={20}
        width={120}
        height={120}
        rx={40}
        fill="url(#owl-body)"
        opacity={0.95}
      />
      <path
        d="M60 0 C80 35 110 40 120 60 L120 80 C110 70 80 70 60 40 C40 70 10 70 0 80 L0 60 C10 40 40 35 60 0 Z"
        fill="#1d4ed8"
        opacity={0.65}
      />
      <circle cx={40} cy={80} r={26} fill="#f8fafc" />
      <circle cx={80} cy={80} r={26} fill="#f8fafc" />
      <circle
        cx={40}
        cy={80}
        r={14}
        fill="#0f172a"
        ref={element => onPupilRegister(pupilIndexes[0], element)}
      />
      <circle
        cx={80}
        cy={80}
        r={14}
        fill="#0f172a"
        ref={element => onPupilRegister(pupilIndexes[1], element)}
      />
      <path
        d="M45 110 C60 122 80 122 95 110"
        fill="none"
        stroke="#38bdf8"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx={38} cy={70} r={4} fill="#bae6fd" />
      <circle cx={84} cy={70} r={4} fill="#bae6fd" />
      <path
        d="M30 130 Q60 150 90 130"
        fill="#38bdf8"
        opacity={0.35}
      />
      <text
        x={60}
        y={165}
        textAnchor="middle"
        fontSize="14"
        fill="#94a3b8"
      >
        NexoBots
      </text>
    </g>
  )
}
