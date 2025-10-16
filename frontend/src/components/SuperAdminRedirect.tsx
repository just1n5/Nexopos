import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

interface SuperAdminRedirectProps {
  children: React.ReactNode;
}

const TENANT_ROUTES = ['/', '/inventory', '/credit', '/cash-register', '/dashboard'];

export default function SuperAdminRedirect({ children }: SuperAdminRedirectProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  // Check if the current path is a tenant-specific route. Note: /settings is allowed for Super Admin.
  const onTenantRoute = TENANT_ROUTES.includes(location.pathname);

  useEffect(() => {
    if (isSuperAdmin && onTenantRoute) {
      navigate('/admin/tenants', { replace: true });
    }
  }, [isSuperAdmin, onTenantRoute, navigate]);

  // While the redirect is pending, render nothing to prevent flashing the wrong content.
  if (isSuperAdmin && onTenantRoute) {
    return null;
  }

  return <>{children}</>;
}