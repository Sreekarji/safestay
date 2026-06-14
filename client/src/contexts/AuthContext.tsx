import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  isAuthenticated: boolean;
  isVerifiedStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  
  const [loading, setLoading] = useState(true);

  // ✅ Computed properties
  const isAuthenticated = !!(user && token);
  const isVerifiedStudent = !!(
    user && 
    user.role === 'student' && 
    (user.isCollegeVerified || user.isVerified)
  );

  // ✅ Verify authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          // Verify token is still valid by calling profile endpoint
          const res = await fetch(`${API}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
              // Update user with fresh data from server
              const updatedUser: User = {
                _id: data.data._id || data.data.id,
                name: data.data.name,
                email: data.data.email,
                role: data.data.role,
                isCollegeVerified: data.data.isCollegeVerified || false,
                isVerified: data.data.isVerified || false,
                collegeName: data.data.collegeName || null,
                profilePhoto: data.data.profilePhoto || null,
                phone: data.data.phone || null,
                isBanned: data.data.isBanned || false,
                ownerVerificationStatus: data.data.ownerVerificationStatus || null,
                propertyName: data.data.propertyName || null,
                propertyCount: data.data.propertyCount || null
              };

              setUser(updatedUser);
              setToken(storedToken);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
              // Profile fetch failed, use stored data
              setUser(JSON.parse(storedUser));
              setToken(storedToken);
            }
          } else {
            // Token invalid, clear auth
            console.log('Token validation failed, clearing auth');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            setToken(null);
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          // Network error, use stored data
          try {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          } catch {
            setUser(null);
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [API]);

  // ✅ Login function
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        const userData: User = {
          _id: data.user?.id || data.user?._id || data.data?.user?.id,
          name: data.user?.name || data.data?.user?.name,
          email: data.user?.email || data.data?.user?.email,
          role: data.user?.role || data.data?.user?.role,
          isCollegeVerified: data.user?.isCollegeVerified || data.data?.user?.isCollegeVerified || false,
          isVerified: data.user?.isVerified || data.data?.user?.isVerified || false,
          collegeName: data.user?.collegeName || data.data?.user?.collegeName || null,
          profilePhoto: data.user?.profilePhoto || data.data?.user?.profilePhoto || null,
          phone: data.user?.phone || data.data?.user?.phone || null,
          isBanned: data.user?.isBanned || data.data?.user?.isBanned || false,
          ownerVerificationStatus: data.user?.ownerVerificationStatus || data.data?.user?.ownerVerificationStatus || null,
          propertyName: data.user?.propertyName || data.data?.user?.propertyName || null,
          propertyCount: data.user?.propertyCount || data.data?.user?.propertyCount || null
        };

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.token);
        setUser(userData);
        setToken(data.token);
        
        return userData;
      } else {
        throw new Error(data.message || "Invalid credentials");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // ✅ Register function
  const register = async (
    name: string, 
    email: string, 
    password: string, 
    role: string = 'student'
  ): Promise<any> => {
    try {
      const endpoint = role === 'owner' 
        ? `${API}/api/auth/register-owner`
        : `${API}/api/auth/signup`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // If registration returns token (auto-login)
        if (data.token) {
          const userData: User = {
            _id: data.user?.id || data.user?._id,
            name: data.user?.name,
            email: data.user?.email,
            role: data.user?.role || role,
            isCollegeVerified: data.user?.isCollegeVerified || false,
            isVerified: data.user?.isVerified || false,
            collegeName: data.user?.collegeName || null,
            profilePhoto: data.user?.profilePhoto || null,
            isBanned: false
          };

          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("token", data.token);
          setUser(userData);
          setToken(data.token);
        }
        return data;
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // ✅ Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // ✅ Refresh user data from localStorage
  const refreshUser = () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch {
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
      setToken(null);
    }
  };

  // ✅ Update user data (for profile updates)
  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      const newUserData = { ...user, ...updatedData };
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout, 
      refreshUser,
      updateUser,
      isAuthenticated,
      isVerifiedStudent
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ✅ Export types for use in other components
export type { User, AuthContextType };