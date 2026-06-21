// app/contexts/AuthContext.js
'use client';
import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Guest mode is the default for any non-authenticated visitor — no opt-in needed.
  // When a guest triggers a write action, we surface a sign-in prompt.
  const [guestPrompt, setGuestPrompt] = useState(null); // { action } | null
  const router = useRouter();

  // isGuest is true for anyone who is not signed in (after the auth check completes).
  const isGuest = !user && !loading;

  // No-op kept for call-site compatibility; navigation handled by callers directly.
  const enterGuestMode = (redirectTo = '/dashboard') => {
    if (redirectTo) router.push(redirectTo);
  };

  // Navigate to a sign-in/sign-up flow.
  const exitGuestMode = (redirectTo = '/signup') => {
    setGuestPrompt(null);
    if (redirectTo) router.push(redirectTo);
  };

  const clearGuest = () => {
    setGuestPrompt(null);
  };

  // Returns true if the viewer is a real, signed-in user and the action may proceed.
  // For guests, opens the "sign in to continue" prompt and returns false.
  const requireRealUser = (action = 'do this') => {
    if (user) return true;
    setGuestPrompt({ action });
    return false;
  };
  const closeGuestPrompt = () => setGuestPrompt(null);

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

      // 2FA required — don't set user yet, redirect to challenge page
      if (data.requires2FA) {
        router.push(`/login/2fa?userId=${data.userId}`);
        return { requires2FA: true };
      }

      clearGuest();
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

      clearGuest();
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

      clearGuest();
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
      isPatient,
      isGuest,
      enterGuestMode,
      exitGuestMode,
      requireRealUser,
      guestPrompt,
      closeGuestPrompt
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);