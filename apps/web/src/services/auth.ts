import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEV_MODE = true; // Enable dev mode for localStorage auth

export const authApi = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
authApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function signup(email: string, name: string, password: string, confirmPassword: string) {
  if (DEV_MODE) {
    // Dev mode: use localStorage instead of API
    const mockUser = {
      id: `user-${Date.now()}`,
      email,
      name,
    };
    const devToken = `dev-token-${Date.now()}`;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    localStorage.setItem('auth_token', devToken);
    return { success: true, accessToken: devToken, user: mockUser };
  }

  try {
    const response = await authApi.post('/signup', {
      email,
      name,
      password,
      confirmPassword,
    });
    if (response.data.accessToken) {
      setAuthToken(response.data.accessToken);
    }
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

export async function signin(email: string, password: string) {
  if (DEV_MODE) {
    // Dev mode: use localStorage instead of API
    const mockUser = {
      id: 'dev-user-123',
      email,
      name: email.split('@')[0],
    };
    const devToken = `dev-token-${Date.now()}`;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    localStorage.setItem('auth_token', devToken);
    return { success: true, accessToken: devToken, user: mockUser };
  }

  try {
    const response = await authApi.post('/signin', { email, password });
    if (response.data.accessToken) {
      setAuthToken(response.data.accessToken);
    }
    return response.data;
  } catch (error) {
    console.error('Signin error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const response = await authApi.get('/me');
    return response.data;
  } catch (error) {
    clearAuthToken();
    throw error;
  }
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export function logout() {
  clearAuthToken();
}
