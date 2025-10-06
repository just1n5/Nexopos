import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCashRegisterStore } from '@/stores/cashRegisterStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';

interface RequireCashRegisterProps {
  children: JSX.Element;
}

export default function RequireCashRegister({ children }: RequireCashRegisterProps) {
  const { currentRegister, loading, fetchCurrentData } = useCashRegisterStore();
  const { token } = useAuthStore();
  const { toast } = useToast();
  const location = useLocation();
  const [hasBeenChecked, setHasBeenChecked] = useState(false);

  useEffect(() => {
    if (token && !hasBeenChecked) {
      fetchCurrentData(token).finally(() => {
        setHasBeenChecked(true);
      });
    }
  }, [token, hasBeenChecked, fetchCurrentData]);

  useEffect(() => {
    if (hasBeenChecked && !loading && !currentRegister) {
      toast({
        key: 'REQUIRE_CASH_REGISTER',
        title: 'Caja Cerrada',
        description: 'Debes abrir una sesión de caja para acceder a esta sección.',
        variant: 'destructive',
      });
    }
  }, [hasBeenChecked, loading, currentRegister, toast]);

  if (!hasBeenChecked || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando estado de la caja...</p>
        </div>
      </div>
    );
  }

  if (!currentRegister) {
    return <Navigate to="/cash-register" state={{ from: location }} replace />;
  }

  return children;
}
