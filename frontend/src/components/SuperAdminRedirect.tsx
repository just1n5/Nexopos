import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

interface SuperAdminRedirectProps {
  children: React.ReactNode;
}

const TENANT_ROUTES = ['/', '/inventory', '/credit', '/cash-register', '/dashboard', '/settings'];

export default function SuperAdminRedirect({ children }: SuperAdminRedirectProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.role === UserRole.SUPER_ADMIN) {
      // If the super admin is on a tenant-specific route, redirect them
      if (TENANT_ROUTES.includes(location.pathname)) {
        navigate('/admin/tenants', { replace: true });
      }
    }
  }, [user, location, navigate]);

  // For non-super-admins, or super-admins on their correct pages, render the children
  return <>{children}</>;
}
