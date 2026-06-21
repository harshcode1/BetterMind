'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, EyeOff, Eye, ArrowRight, Sparkles, Mail, Lock, AlertCircle, CheckCircle, Shield, Heart, TrendingUp } from 'lucide-react';

const FEATURES = [
  { icon: Brain,     text: 'AI-powered mental health insights' },
  { icon: Shield,    text: 'Bank-grade AES-256 encryption' },
  { icon: Heart,     text: 'Connect with verified doctors' },
  { icon: TrendingUp, text: 'Track your wellness journey' },
];

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { login, user } = useAuth();

  useEffect(() => { if (user) router.push(redirectPath); }, [user]);
  useEffect(() => { if (error) setError(''); }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email is required');
    if (!password)     return setError('Password is required');
    setError('');
    setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err.message || 'Invalid credentials. Please try again.'); setLoading(false); }
  };

  if (user) return null;

  return (
    <div className="min-h-screen flex bg-surface-1">

      {/* ── Left: form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 relative">
        {/* Soft blobs */}
        <div className="blob blob-brand w-80 h-80 -top-20 -left-20 opacity-40 pointer-events-none" />
        <div className="blob blob-mint w-64 h-64 bottom-10 -right-10 opacity-30 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-brand shadow-brand">
              <Brain size={19} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-ink-1">BetterMind</span>
          </Link>

          <h1 className="font-display font-bold text-2xl text-ink-1 mb-1.5">Welcome back</h1>
          <p className="text-ink-3 text-sm mb-8">Sign in to continue your mental wellness journey.</p>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-200">
                <AlertCircle size={14} className="flex-shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {redirectPath !== '/' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm text-brand-700 bg-brand-50 border border-brand-100">
              <Sparkles size={13} /> Please sign in to access that page
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email address" disabled={loading}
                className="input pl-11" required />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password" disabled={loading}
                className="input pl-11 pr-11" required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-2 transition-colors">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full btn-primary py-3.5 gap-2 text-sm mt-1 justify-center">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in...</>
                : <>Sign In <ArrowRight size={15} /></>}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-surface-border space-y-2.5 text-center text-sm">
            <p className="text-ink-3">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors">Sign up as Patient</Link>
            </p>
            <p className="text-ink-3">
              Healthcare provider?{' '}
              <Link href="/signup/doctor" className="text-mint-600 hover:text-mint-700 font-semibold transition-colors">Doctor sign up</Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Right: illustration ── */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-brand-600 to-calm-600">
        <div className="absolute inset-0 bg-dot-pattern bg-dot-md opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white opacity-5 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white opacity-5 translate-y-1/3 -translate-x-1/3" />

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="relative z-10 text-center px-12 max-w-sm">
          <div className="w-24 h-24 rounded-3xl mx-auto mb-8 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 animate-float">
            <Brain size={44} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-3 leading-snug">
            Your mental health<br />matters most.
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed mb-8">
            Join thousands on their journey to better mental wellness with BetterMind.
          </p>

          <div className="space-y-3 text-left">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm border border-white/10">
                <Icon size={15} className="text-white flex-shrink-0" />
                <span className="text-white/90 text-sm">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[['12K+', 'Assessments'], ['500+', 'Doctors'], ['98%', 'Satisfaction']].map(([val, label]) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                <div className="font-display font-bold text-lg text-white">{val}</div>
                <div className="text-xs text-brand-200">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-surface-1">
        <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
