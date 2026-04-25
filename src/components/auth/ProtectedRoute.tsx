import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, profile, loading, isExpired, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login';
      } else if (isExpired && profile?.role !== 'admin') {
        window.location.href = '/expired';
      } else if (requireAdmin && !isAdmin) {
        window.location.href = '/';
      }
    }
  }, [user, profile, loading, isExpired, isAdmin, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00A3E0]/20 border-t-[#00A3E0] rounded-full animate-spin"></div>
          <p className="text-[#00A3E0] font-mono text-xs uppercase tracking-widest animate-pulse">
            Verificando Credenciales...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (isExpired && profile?.role !== 'admin') return null;
  if (requireAdmin && !isAdmin) return null;

  return <>{children}</>;
};
