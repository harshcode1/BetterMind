'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectPath);
    }
  }, [user, router, redirectPath]);

  // Clear error when user types
  useEffect(() => {
    if (formTouched && error) {
      setError('');
    }
  }, [email, password, formTouched, error]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormTouched(true);
    
    // Basic form validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      // Login successful, the useEffect will handle redirect
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // If already logged in, show nothing during redirect
  if (user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login to BetterMind</h2>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
        
        {redirectPath !== '/' && (
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <p className="text-blue-500 text-sm">Please log in to access that page</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input 
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormTouched(true);
              }}
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input 
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormTouched(true);
              }}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 border-t pt-4">
          <p className="text-center text-sm text-gray-600 mb-4">
            Don&apos;t have an account? <Link href="/signup" className="text-blue-600 hover:underline">Sign up as Patient</Link>
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <Link href="/signup/doctor" className="text-sm text-blue-600 hover:underline">
              Healthcare Provider Sign Up
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="#" className="text-sm text-gray-600 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
