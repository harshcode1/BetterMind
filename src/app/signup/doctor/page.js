'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, User, Mail, Lock, Phone, MapPin, FileText, Stethoscope } from 'lucide-react';

const SPECIALTIES = [
  'Psychiatrist', 'Psychologist', 'Therapist', 'Counselor',
  'Clinical Social Worker', 'Mental Health Nurse', 'Addiction Specialist',
  'Child Psychiatrist', 'Geriatric Psychiatrist', 'Neuropsychiatrist',
];

export default function DoctorSignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [credentials, setCredentials] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const router = useRouter();
  const { registerDoctor, user } = useAuth();

  useEffect(() => { if (user) router.push('/'); }, [user, router]);

  const validateStep1 = () => {
    if (!name.trim()) { setError('Name is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return false; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return false; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!specialty) { setError('Specialty is required'); return false; }
    if (!credentials.trim()) { setError('Credentials are required'); return false; }
    if (!licenseNumber.trim()) { setError('License number is required'); return false; }
    if (!phone.trim()) { setError('Phone number is required'); return false; }
    return true;
  };

  const handleNext = () => { setError(''); if (validateStep1()) setStep(2); };
  const handleBack = () => { setError(''); setStep(1); };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await registerDoctor({ name, email, password, specialty, credentials, licenseNumber, bio, address, phone });
      router.push('/doctor/verification');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-surface-1 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-ink-1">BetterMind</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-3xl text-ink-1 mb-1">Healthcare Provider Registration</h1>
          <p className="text-ink-3 text-sm mb-8">Create a verified provider account to connect with patients</p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {[1, 2].map((s, i) => (
            <>
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm transition-all ${
                  step >= s
                    ? 'bg-gradient-brand text-white shadow-brand'
                    : 'bg-surface-2 border border-surface-border text-ink-4'
                }`}>{step > s ? <CheckCircle size={16} /> : s}</div>
                <span className={`text-xs ${step >= s ? 'text-brand-600 font-medium' : 'text-ink-4'}`}>
                  {s === 1 ? 'Account Info' : 'Professional'}
                </span>
              </div>
              {i < 1 && (
                <div className={`flex-1 h-0.5 mx-3 mb-4 rounded-full transition-all ${step >= 2 ? 'bg-gradient-brand' : 'bg-surface-border'}`} />
              )}
            </>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-200">
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="card p-6">
          <form onSubmit={handleSignup}>
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                      <User size={12} className="text-ink-4" /> Full Name
                    </label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Dr. Jane Smith" required disabled={loading}
                      className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                      <Mail size={12} className="text-ink-4" /> Email
                    </label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="doctor@example.com" required disabled={loading}
                      className="input w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                        <Lock size={12} className="text-ink-4" /> Password
                      </label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 characters" required disabled={loading}
                        className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-2 mb-1.5">Confirm Password</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password" required disabled={loading}
                        className="input w-full" />
                    </div>
                  </div>
                  <motion.button type="button" onClick={handleNext}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="btn-primary w-full py-3 justify-center mt-2 gap-2">
                    Next: Professional Details <ArrowRight size={14} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                        <Stethoscope size={12} className="text-ink-4" /> Specialty
                      </label>
                      <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                        required disabled={loading} className="input w-full">
                        <option value="">Select specialty</option>
                        {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-2 mb-1.5">Credentials</label>
                      <input type="text" value={credentials} onChange={e => setCredentials(e.target.value)}
                        placeholder="MD, PhD, LCSW..." required disabled={loading}
                        className="input w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                        <FileText size={12} className="text-ink-4" /> License Number
                      </label>
                      <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                        placeholder="Your license #" required disabled={loading}
                        className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                        <Phone size={12} className="text-ink-4" /> Phone
                      </label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="(123) 456-7890" required disabled={loading}
                        className="input w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1.5 flex items-center gap-2">
                      <MapPin size={12} className="text-ink-4" /> Practice Address <span className="text-ink-4 font-normal">(optional)</span>
                    </label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                      placeholder="123 Medical Center Dr, City, State" disabled={loading}
                      className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1.5">Professional Bio <span className="text-ink-4 font-normal">(optional)</span></label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)}
                      placeholder="Tell patients about your experience and approach..."
                      rows={3} disabled={loading}
                      className="input w-full resize-none text-sm" />
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={handleBack} disabled={loading}
                      className="btn-soft gap-2 flex-shrink-0">
                      <ArrowLeft size={14} /> Back
                    </button>
                    <motion.button type="submit" disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.99 }}
                      className="btn-primary flex-1 py-3 justify-center disabled:opacity-50">
                      {loading
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                        : 'Complete Registration'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Notice */}
        <div className="card p-4 mt-4 bg-brand-50 border-brand-100">
          <p className="text-xs font-semibold text-brand-700 mb-1">Verification required</p>
          <p className="text-xs text-brand-600">After registration, our team will review your credentials within 1–3 business days. You&apos;ll receive an email once approved.</p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4 text-sm text-ink-3">
          <Link href="/login" className="hover:text-ink-1 transition-colors">Log in</Link>
          <span className="w-1 h-1 rounded-full bg-ink-5" />
          <Link href="/signup" className="hover:text-ink-1 transition-colors">Patient signup</Link>
        </div>
      </div>
    </div>
  );
}
