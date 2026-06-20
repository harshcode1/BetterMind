'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Brain, Heart, ShieldCheck, Stethoscope, AlertCircle, User, Mail, Lock } from 'lucide-react';

const FEATURES = [
  { icon: Brain,       text: 'AI-powered mental health insights' },
  { icon: Heart,       text: 'Track mood & emotional patterns' },
  { icon: ShieldCheck, text: 'Private, encrypted & secure' },
  { icon: Stethoscope, text: 'Connect with licensed therapists' },
];

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, user } = useAuth();

  useEffect(() => { if (user) router.push('/'); }, [user, router]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(name, email, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-1">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-ink-1">BetterMind</span>
          </Link>

          <h1 className="font-display font-bold text-3xl text-ink-1 mb-1">Create your account</h1>
          <p className="text-ink-3 text-sm mb-8">Start your mental wellness journey today</p>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-200">
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                <User size={12} className="text-ink-4" /> Full Name
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" required disabled={loading}
                className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                <Mail size={12} className="text-ink-4" /> Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com" required disabled={loading}
                className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                <Lock size={12} className="text-ink-4" /> Password
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters" required disabled={loading}
                className="input w-full" />
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.99 }}
              className="btn-primary w-full py-3 justify-center mt-2 disabled:opacity-50">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                : 'Sign Up as Patient'}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-border space-y-4">
            <p className="text-center text-sm text-ink-3">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Log in</Link>
            </p>
            <div className="card p-4">
              <p className="text-xs font-semibold text-ink-2 mb-2 text-center">Are you a healthcare provider?</p>
              <Link href="/signup/doctor"
                className="block w-full text-center btn-soft py-2 text-sm justify-center">
                Sign Up as Healthcare Provider
              </Link>
              <p className="text-xs text-ink-4 mt-2 text-center">Doctors, therapists, and other mental health professionals</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right — brand panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 bg-gradient-to-br from-brand-600 to-calm-600 relative overflow-hidden">
        <div className="blob blob-brand w-96 h-96 -top-24 -right-24 opacity-20" />
        <div className="blob blob-mint w-64 h-64 bottom-12 left-0 opacity-20" />
        <div className="relative z-10 max-w-sm">
          <h2 className="font-display font-bold text-3xl text-white mb-3">Your mental health journey starts here</h2>
          <p className="text-white/70 text-sm mb-8">Join thousands of people who use BetterMind to understand and improve their mental wellness.</p>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <Icon size={16} className="text-white flex-shrink-0" />
                <span className="text-white/90 text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
