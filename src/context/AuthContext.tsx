/**
 * Gateway Mobile — Auth Context
 * Mirrors gateway-fe/src/context/AuthContext.tsx
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { User, Role, OrganizerStatus } from '../types/api';
import { ApiError, authApi } from '../lib/api';
import { getToken, removeToken } from '../lib/tokenStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  isAdmin: boolean;
  organizerStatus: OrganizerStatus | null;
  isOrganizerApproved: boolean;
  isSuspended: boolean;
  suspendReason: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const loadUser = useCallback(async (forLogin = false) => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      if (error instanceof ApiError && [401, 403].includes(error.statusCode)) {
        await removeToken();
        setUser(null);
      }
      if (forLogin) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(() => loadUser(), [loadUser]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      refreshUser();
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      await authApi.login(email, password);
      await loadUser(true);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      await removeToken();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const role = user?.role ?? null;
  const isAdmin = role === 'ADMIN';
  const organizerStatus = user?.organizerProfile?.status ?? null;
  const isOrganizerApproved = organizerStatus === 'APPROVED';
  const isSuspended = !!user?.isSuspended;
  const suspendReason = user?.suspendReason ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        role,
        isAdmin,
        organizerStatus,
        isOrganizerApproved,
        isSuspended,
        suspendReason,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
