import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, getAuthToken, logout as logoutAuth } from '../services/auth';

interface User {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    // Validate token and fetch user
    getCurrentUser()
      .then((userData) => {
        setUser(userData);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = () => {
    logoutAuth();
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
