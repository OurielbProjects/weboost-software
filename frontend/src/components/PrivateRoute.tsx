import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, token, checkAuth, init } = useAuthStore();

  useEffect(() => {
    init();
    if (token && !user) {
      checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

