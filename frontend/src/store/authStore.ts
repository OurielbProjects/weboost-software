import { create } from 'zustand';
import api from '../utils/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'client';
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  init: () => void;
}

// Load from localStorage
const loadAuth = () => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.user || null,
        token: parsed.token || null,
      };
    }
  } catch (e) {
    // Ignore
  }
  return { user: null, token: null };
};

// Save to localStorage
const saveAuth = (user: User | null, token: string | null) => {
  localStorage.setItem('auth-storage', JSON.stringify({ user, token }));
};

export const useAuthStore = create<AuthState>((set, get) => {
  const initialState = loadAuth();
  
  return {
    user: initialState.user,
    token: initialState.token,
    init: () => {
      const { token } = get();
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    },
    login: async (email: string, password: string) => {
      const response = await api.post('/api/auth/login', { email, password });
      set({ user: response.data.user, token: response.data.token });
      saveAuth(response.data.user, response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    },
    logout: () => {
      set({ user: null, token: null });
      saveAuth(null, null);
      delete api.defaults.headers.common['Authorization'];
    },
    checkAuth: async () => {
      const { token } = get();
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/api/auth/me');
          set({ user: response.data.user });
          saveAuth(response.data.user, token);
        } catch (error) {
          set({ user: null, token: null });
          saveAuth(null, null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
    },
  };
});

// Initialize axios
const { token } = loadAuth();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
