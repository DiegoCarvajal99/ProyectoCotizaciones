import React, { createContext, useContext, useEffect, useState } from 'react';
import { authStore, type UserProfile } from '../../lib/authStore';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isExpired: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isExpired: false,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(authStore.get());

  useEffect(() => {
    return authStore.subscribe((user, profile, loading) => {
      setState({ user, profile, loading });
    });
  }, []);

  const isExpired = state.profile 
    ? state.profile.accessExpiration.toMillis() < Date.now() 
    : false;

  const isAdmin = state.profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ ...state, isExpired, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
