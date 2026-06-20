'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, Brain } from 'lucide-react';

function TwoFactorChallengeContent() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const userId = searchParams.get('userId');

  useEffect(() => { if (user) router.push('/'); }, [user, router]);
  useEffect(() => { if (!userId) router.push('/login'); }, [userId, router]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!code || code.length < 6) { setError('Please enter your 6-digit code'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      await refreshUser();
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card p-8 w-full max-w-sm text-center">
        <div className="icon-box icon-box-brand w-14 h-14 rounded-2xl mx-auto mb-5">
          <ShieldCheck size={24} className="text-brand-600" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Brain size={14} className="text-brand-500" />
          <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">BetterMind</span>
        </div>
        <h2 className="font-display font-bold text-2xl text-ink-1 mb-1">Two-Factor Auth</h2>
        <p className="text-ink-3 text-sm mb-6">Enter the 6-digit code from your authenticator app, or a recovery code.</p>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-200">
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1.5 text-left">Verification Code</label>
            <input type="text" inputMode="numeric" maxLength={10} value={code}
              onChange={e => setCode(e.target.value.replace(/\s/g, ''))}
              placeholder="000000" autoFocus disabled={loading}
              className="input w-full text-center text-2xl tracking-widest font-mono py-3" />
          </div>
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.99 }}
            className="btn-primary w-full py-3 justify-center disabled:opacity-50">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
              : 'Verify'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-ink-4 mt-4">
          Lost access? <span className="text-brand-600">Enter a recovery code above instead.</span>
        </p>
      </motion.div>
    </div>
  );
}

export default function TwoFactorChallengePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-surface-1">
        <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    }>
      <TwoFactorChallengeContent />
    </Suspense>
  );
}
