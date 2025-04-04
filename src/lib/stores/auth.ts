import { writable, derived } from 'svelte/store';
import type { AuthUser } from '$lib/server/auth';

// Define the auth store type
interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// Create the writable store with initial values
const createAuthStore = () => {
  // Initial state
  const initialState: AuthStore = {
    user: null,
    loading: true,
    error: null
  };
  
  const { subscribe, set, update } = writable<AuthStore>(initialState);
  
  return {
    subscribe,
    // Login action
    login: async (email: string, password: string) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }
        
        update(state => ({ ...state, user: data.user, loading: false }));
        return data.user;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        update(state => ({ ...state, error: message, loading: false }));
        throw error;
      }
    },
    
    // Register action
    register: async (username: string, email: string, password: string) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
        
        // Auto-login after registration
        return await authStore.login(email, password);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        update(state => ({ ...state, error: message, loading: false }));
        throw error;
      }
    },
    
    // Logout action
    logout: async () => {
      update(state => ({ ...state, loading: true }));
      
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        update(state => ({ ...state, user: null, loading: false }));
      } catch (error) {
        console.error('Logout error:', error);
        update(state => ({ ...state, loading: false }));
      }
    },
    
    // Check current authenticated user
    checkAuth: async () => {
      update(state => ({ ...state, loading: true }));
      
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        update(state => ({ 
          ...state, 
          user: data.authenticated ? data.user : null,
          loading: false 
        }));
        
        return data.authenticated;
      } catch (error) {
        console.error('Auth check error:', error);
        update(state => ({ ...state, user: null, loading: false }));
        return false;
      }
    },
    
    // Set user manually (useful for SSR)
    setUser: (user: AuthUser | null) => {
      update(state => ({ ...state, user, loading: false }));
    },
    
    // Clear any errors
    clearError: () => {
      update(state => ({ ...state, error: null }));
    }
  };
};

// Create the actual store instance
export const authStore = createAuthStore();

// Derived store for authentication status
export const isAuthenticated = derived(
  authStore,
  $authStore => !!$authStore.user
);

// Derived store for loading status
export const isLoading = derived(
  authStore,
  $authStore => $authStore.loading
); 