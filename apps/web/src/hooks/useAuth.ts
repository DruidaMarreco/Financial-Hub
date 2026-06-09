import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Use real API by default, unless NEXT_PUBLIC_DEV_MODE=true is set in .env
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || false;

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');

        if (DEV_MODE) {
          // Development mode - use mock user
          const mockUser = localStorage.getItem('mock_user');
          if (mockUser) {
            setUser(JSON.parse(mockUser));
            setIsAuthenticated(true);
          }
        } else {
          // Production mode - validate with API
          if (token) {
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setIsAuthenticated(true);
              } else {
                // Token invalid or expired
                localStorage.removeItem('auth_token');
              }
            } catch (error) {
              console.error('Failed to validate token:', error);
              localStorage.removeItem('auth_token');
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_user');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/signin');
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
  };
}
