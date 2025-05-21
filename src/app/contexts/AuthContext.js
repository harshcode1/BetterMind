// app/contexts/AuthContext.js
'use client';
import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkUser = async () => {
    try {
      // Add timestamp to bust cache
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/auth/check?t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });
      const data = await res.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
      }
      return data;
    } catch (error) {
      console.error('Auth check error:', error);
      return { authenticated: false, error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in on page load
    checkUser();
  }, []);

  // Refresh user data from the server
  const refreshUser = async () => {
    const data = await checkUser();
    return data.authenticated ? data.user : null;
  };

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      
      // Redirect based on user role (all doctors go to dashboard regardless of verification)
      if (data.user.role === 'doctor') {
        router.push('/doctor/dashboard');
      } else if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
      
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          role: 'patient' // Default role for regular users
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  const registerDoctor = async (doctorData) => {
    try {
      const res = await fetch('/api/auth/register/doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...doctorData,
          role: 'doctor',
          verified: false // Doctors need verification before they can practice
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Doctor registration failed');
      }

      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Doctor registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Role-based access control helpers
  const isDoctor = () => {
    return user && user.role === 'doctor';
  };
  
  const isVerifiedDoctor = () => {
    return user && user.role === 'doctor' && user.verified;
  };
  
  const isAdmin = () => {
    return user && user.role === 'admin';
  };
  
  const isPatient = () => {
    return user && (user.role === 'patient' || !user.role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register,
      registerDoctor, 
      logout,
      refreshUser,
      isDoctor,
      isVerifiedDoctor,
      isAdmin,
      isPatient
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);