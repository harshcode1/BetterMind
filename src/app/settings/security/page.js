'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldOff, Key, AlertCircle, CheckCircle, Copy, X } from 'lucide-react';

export default function SecuritySettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [step, setStep] = useState('idle');
  const [qrImage, setQrImage] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.push('/login?redirect=/settings/security'); }, [user, authLoading, router]);
  useEffect(() => { if (user) fetch('/api/user/profile').then(r => r.json()).then(d => setTwoFAStatus(d.twoFactorAuth || { enabled: false })).catch(() => setTwoFAStatus({ enabled: false })); }, [user]);

  const startSetup = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const qr = await import('qrcode');
      setQrImage(await qr.default.toDataURL(data.qrCodeUrl));
      setSecret(data.secret); setStep('setup');
    } catch (err) { setError(err.message || 'Failed to start setup'); }
    finally { setLoading(false); }
  };

  const confirmSetup = async () => {
    setError('');
    if (!code || code.length < 6) { setError('Enter the 6-digit code from your app'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecoveryCodes(data.recoveryCodes); setTwoFAStatus({ enabled: true }); setStep('recovery');
    } catch (err) { setError(err.message || 'Invalid code'); }
    finally { setLoading(false); }
  };

  const disable2FA = async () => {
    setError('');
    if (!code || code.length < 6) { setError('Enter your authenticator code to confirm'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTwoFAStatus({ enabled: false }); setSuccess('2FA has been disabled.'); setStep('idle'); setCode('');
    } catch (err) { setError(err.message || 'Failed to disable'); }
    finally { setLoading(false); }
  };

  const copySecret = () => { navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-surface-1 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-3xl text-ink-1 mb-1">Security Settings</h1>
          <p className="text-ink-3 text-sm mb-8">Manage account security and two-factor authentication</p>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-200">
              <AlertCircle size={14} /> {error}
              <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm text-mint-700 bg-mint-50 border border-mint-200">
              <CheckCircle size={14} /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2FA Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              <div className={`icon-box w-10 h-10 rounded-xl ${twoFAStatus?.enabled ? 'icon-box-mint' : 'bg-surface-2 border border-surface-border'}`}>
                {twoFAStatus?.enabled
                  ? <ShieldCheck size={18} className="text-mint-600" />
                  : <Shield size={18} className="text-ink-4" />}
              </div>
              <div>
                <h2 className="font-display font-semibold text-ink-1">Two-Factor Authentication</h2>
                <p className="text-xs text-ink-4 mt-0.5">Protect your account with an authenticator app</p>
              </div>
            </div>
            <span className={`badge ${twoFAStatus?.enabled ? 'badge-mint' : 'badge-slate'}`}>
              {twoFAStatus?.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* Idle — enable CTA */}
            {step === 'idle' && !twoFAStatus?.enabled && (
              <motion.div key="idle-off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-sm text-ink-3 mb-4">Enable 2FA to add an extra layer of security. You&apos;ll need Google Authenticator or Authy.</p>
                <motion.button onClick={startSetup} disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="btn-primary gap-2 disabled:opacity-50">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={14} />}
                  Enable Two-Factor Authentication
                </motion.button>
              </motion.div>
            )}

            {/* Idle — disable CTA */}
            {step === 'idle' && twoFAStatus?.enabled && (
              <motion.div key="idle-on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-sm text-ink-3 mb-4">2FA is currently active. Your account is protected by your authenticator app.</p>
                <button onClick={() => { setStep('disable'); setCode(''); setError(''); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors">
                  <ShieldOff size={14} /> Disable 2FA
                </button>
              </motion.div>
            )}

            {/* Setup — QR scan */}
            {step === 'setup' && (
              <motion.div key="setup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <p className="text-sm text-ink-3">Scan the QR code with your authenticator app, then enter the 6-digit code below.</p>
                {qrImage && (
                  <div className="flex justify-center">
                    <div className="p-3 rounded-xl bg-white border border-surface-border shadow-sm">
                      <img src={qrImage} alt="2FA QR Code" className="w-40 h-40" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-surface-border">
                  <Key size={13} className="text-ink-4 flex-shrink-0" />
                  <code className="text-xs text-ink-3 flex-1 break-all">{secret}</code>
                  <button onClick={copySecret} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 flex-shrink-0">
                    <Copy size={11} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-2">Verification Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000"
                    className="input w-full text-center text-2xl tracking-widest font-mono" />
                </div>
                <div className="flex gap-3">
                  <motion.button onClick={confirmSetup} disabled={loading}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="btn-primary gap-2 disabled:opacity-50">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                    Verify &amp; Enable
                  </motion.button>
                  <button onClick={() => { setStep('idle'); setCode(''); setError(''); }}
                    className="btn-soft">Cancel</button>
                </div>
              </motion.div>
            )}

            {/* Recovery codes */}
            {step === 'recovery' && (
              <motion.div key="recovery" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">Save your recovery codes</p>
                    <p className="text-xs text-amber-600/80 mt-0.5">These are shown only once. Use them if you lose your authenticator app.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-surface-2 border border-surface-border">
                  {recoveryCodes.map((c, i) => (
                    <code key={i} className="text-xs text-ink-2 font-mono">{c}</code>
                  ))}
                </div>
                <motion.button onClick={() => setStep('idle')}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="btn-primary gap-2">
                  I&apos;ve saved my codes — Done
                </motion.button>
              </motion.div>
            )}

            {/* Disable */}
            {step === 'disable' && (
              <motion.div key="disable" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-sm text-ink-3">Enter your current authenticator code to confirm disabling 2FA.</p>
                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-2">Authenticator Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000"
                    className="input w-full text-center text-2xl tracking-widest font-mono" />
                </div>
                <div className="flex gap-3">
                  <button onClick={disable2FA} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50">
                    {loading ? <div className="w-4 h-4 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" /> : <ShieldOff size={13} />}
                    Confirm Disable
                  </button>
                  <button onClick={() => { setStep('idle'); setCode(''); setError(''); }}
                    className="btn-soft">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
