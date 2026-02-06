import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    let loginPath = '/';
    if (location.pathname.startsWith('/business/')) {
      loginPath = '/business/login';
    } else if (location.pathname.startsWith('/customer/')) {
      loginPath = '/customer/login';
    } else if (location.pathname.startsWith('/admin/')) {
      loginPath = '/admin/login';
    }
    return <Navigate to={loginPath} replace />;
  }

  // Role-based access check
  if (requiredRole) {
    const user = authApi.getStoredUser();
    const roles = user?.roles || [];
    if (!roles.includes(requiredRole)) {
      // User is logged in but lacks the required role - redirect to appropriate dashboard
      if (location.pathname.startsWith('/admin/')) {
        return <Navigate to="/admin/login" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
