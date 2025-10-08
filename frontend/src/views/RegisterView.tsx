import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, ChevronRight, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import type { RegisterFormData, BusinessType } from '@/types';
import { BusinessType as BusinessTypeEnum } from '@/types';

const BUSINESS_TYPES = Object.values(BusinessTypeEnum);

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
    {children}
  </label>
);

export default function RegisterView() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [betaKeyValid, setBetaKeyValid] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);

  const [formData, setFormData] = useState<RegisterFormData>({
    betaKey: '',
    businessName: '',
    nit: '',
    businessType: BusinessTypeEnum.TIENDA,
    address: '',
    businessPhone: '',
    businessEmail: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    documentId: '',
    phoneNumber: '',
  });

  const updateField = (field: keyof RegisterFormData, value: string | BusinessType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateBetaKey = async (key: string) => {
    if (key.length < 5) {
      setBetaKeyValid(false);
      return;
    }

    setValidatingKey(true);
    try {
      const result = await authService.validateBetaKey(key);
      setBetaKeyValid(result.valid);
      if (!result.valid) {
        setError(result.message || 'Clave beta inválida');
      } else {
        setError(null);
      }
    } catch (err) {
      setBetaKeyValid(false);
      setError('Error al validar la clave');
    } finally {
      setValidatingKey(false);
    }
  };

  const handleBetaKeyChange = (value: string) => {
    const upper = value.toUpperCase();
    updateField('betaKey', upper);
    if (upper.length >= 10) {
      validateBetaKey(upper);
    } else {
      setBetaKeyValid(false);
    }
  };

  const canProceedStep1 = betaKeyValid && formData.betaKey.trim().length > 0;
  const canProceedStep2 =
    formData.businessName.trim().length > 0 &&
    formData.nit.trim().length > 0 &&
    formData.address.trim().length > 0 &&
    formData.businessPhone.trim().length > 0 &&
    formData.businessEmail.trim().length > 0;

  const canProceedStep3 =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword &&
    formData.documentId.trim().length > 0 &&
    formData.phoneNumber.trim().length > 0;

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authService.register(registerData);

      // Usar el método login del store para guardar el token y usuario
      await login(response.user.email, formData.password);

      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            🚀 Beta Cerrada - Solo con Invitación
          </div>
          <CardTitle className="text-3xl font-bold">Crea tu Cuenta en NexoPOS</CardTitle>
          <CardDescription>
            Sistema de Punto de Venta para tu Negocio
          </CardDescription>

          {/* Stepper */}
          <div className="flex justify-between mt-8 mb-6 px-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep > step ? 'bg-green-500 text-white' :
                  currentStep === step ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className={`text-xs mt-2 ${currentStep >= step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {step === 1 ? 'Clave Beta' : step === 2 ? 'Negocio' : 'Administrador'}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Paso 1: Clave Beta */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="betaKey">Clave de Acceso Beta</Label>
                <div className="relative">
                  <Input
                    id="betaKey"
                    value={formData.betaKey}
                    onChange={(e) => handleBetaKeyChange(e.target.value)}
                    placeholder="BETA-XXXXX-XXXXX"
                    className="uppercase font-mono"
                    maxLength={17}
                  />
                  {validatingKey && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {!validatingKey && betaKeyValid && (
                    <Check className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Ingresa la clave beta que recibiste por email
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={nextStep} disabled={!canProceedStep1}>
                  Continuar <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Paso 2: Datos del Negocio */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="businessName">Nombre del Negocio *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    placeholder="Mi Tienda SAS"
                  />
                </div>

                <div>
                  <Label htmlFor="nit">NIT *</Label>
                  <Input
                    id="nit"
                    value={formData.nit}
                    onChange={(e) => updateField('nit', e.target.value)}
                    placeholder="900123456-7"
                  />
                </div>

                <div>
                  <Label htmlFor="businessType">Tipo de Negocio *</Label>
                  <Select value={formData.businessType} onValueChange={(value) => updateField('businessType', value as BusinessType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Calle 123 # 45-67, Bogotá"
                  />
                </div>

                <div>
                  <Label htmlFor="businessPhone">Teléfono del Negocio *</Label>
                  <Input
                    id="businessPhone"
                    value={formData.businessPhone}
                    onChange={(e) => updateField('businessPhone', e.target.value)}
                    placeholder="3001234567"
                  />
                </div>

                <div>
                  <Label htmlFor="businessEmail">Email del Negocio *</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => updateField('businessEmail', e.target.value)}
                    placeholder="contacto@mitienda.com"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>
                <Button onClick={nextStep} disabled={!canProceedStep2}>
                  Continuar <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Paso 3: Datos del Administrador */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Pérez"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="email">Email (para iniciar sesión) *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="juan.perez@gmail.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Debe incluir mayúscula, minúscula, número y carácter especial
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Repite la contraseña"
                  />
                </div>

                <div>
                  <Label htmlFor="documentId">Cédula *</Label>
                  <Input
                    id="documentId"
                    value={formData.documentId}
                    onChange={(e) => updateField('documentId', e.target.value)}
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Teléfono Personal *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => updateField('phoneNumber', e.target.value)}
                    placeholder="3109876543"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={!canProceedStep3 || isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Cuenta
                </Button>
              </div>
            </div>
          )}

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
