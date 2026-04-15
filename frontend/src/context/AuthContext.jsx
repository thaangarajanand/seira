import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const loading = false;

  const login = (userData, tokenData) => {
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  const updateUser = (data) => {
    const updatedUser = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const updateLanguage = (lang) => {
    updateUser({ preferredLanguage: lang });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      updateUser,
      updateLanguage,
      isLoggedIn: !!token,
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
