import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  user: { email: string; id: number } | null; // Assuming user has email and id from token
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<{ email: string; id: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        // In a real app, you would decode the token or fetch user data from an endpoint
        // For now, we'll just set a dummy user or parse basic info if possible
        try {
          // This is a placeholder. You might have an /auth/me endpoint.
          // For now, assume the token itself might contain some user info or you fetch it later.
          // For this example, we'll just check if the token exists.
          // Later, we can add logic to decode JWT to get user details if needed.
          // The backend currently only returns access_token on login, not user details.
          // So, for now, 'user' object will remain null or be populated by decoding the token if available.
          const decodedToken = parseJwt(token);
          if (decodedToken && decodedToken.sub) {
            setUser({ id: parseInt(decodedToken.sub), email: 'user@example.com' }); // Dummy email
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    // You might want to decode the token here and set user state
    const decodedToken = parseJwt(newToken);
    if (decodedToken && decodedToken.sub) {
      setUser({ id: parseInt(decodedToken.sub), email: 'user@example.com' }); // Dummy email
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

import { parseJwt } from '../utils/jwt';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
