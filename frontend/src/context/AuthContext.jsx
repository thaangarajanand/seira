import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL as API } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user on mount (Session Persistence)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          credentials: 'include'
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          const text = await res.text();
          console.warn('Auth check failed with status:', res.status, 'Body snippet:', text.substring(0, 100));
        }
      } catch (err) {
        console.error('Auth hydration failed:', err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      localStorage.clear(); // Clear any non-sensitive UI preferences
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const updateUser = (data) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const updateLanguage = (lang) => {
    updateUser({ preferredLanguage: lang });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      updateLanguage,
      isLoggedIn: !!user,
      isCompany: user?.role === 'company',
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
