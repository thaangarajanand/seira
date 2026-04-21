import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL as API } from '../api';

console.log('[API DIAGNOSTIC] Current Base URL:', API);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user on mount (Session Persistence)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const url = `${API}/api/auth/me`;
        console.log('[API DIAGNOSTIC] Hydrating from:', url);
        const res = await fetch(url, {
          credentials: 'include'
        });
        
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const userData = await res.json();
          setUser(userData);
        } else {
          const text = await res.text();
          console.warn('[API DIAGNOSTIC] Auth check failed.', {
            status: res.status,
            contentType,
            bodySnippet: text.substring(0, 100)
          });
        }
      } catch (err) {
        console.error('[API DIAGNOSTIC] Auth hydration error:', err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ── IDLE TIMER FOR ADMINS ──────────────────────────────
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let idleTimer;
    const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        console.warn('Admin session expired due to inactivity');
        logout();
      }, IDLE_TIMEOUT);
    };

    // Events to monitor for activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(name => document.addEventListener(name, resetTimer));
    resetTimer(); // Initialize

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach(name => document.removeEventListener(name, resetTimer));
    };
  }, [user]);

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
