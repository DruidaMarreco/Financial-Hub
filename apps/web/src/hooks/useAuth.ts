import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const DEV_MODE = true; // Set to false when API is ready

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
            // Validate token with API
            // const response = await fetch('http://localhost:3001/auth/me', {
            //   headers: { 'Authorization': `Bearer ${token}` }
            // });
            // if (response.ok) {
            //   const userData = await response.json();
            //   setUser(userData);
            //   setIsAuthenticated(true);
            // }
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
