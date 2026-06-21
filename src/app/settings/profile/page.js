'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Save, AlertCircle, CheckCircle, ChevronRight, Heart,
} from 'lucide-react';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-ink-3 uppercase tracking-wider">
        <Icon size={12} /> {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '', phone: '', gender: '', dateOfBirth: '',
    address: '', emergencyContact: '',
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/settings/profile');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
          address: data.address || '',
          emergencyContact: data.emergencyContact || '',
        });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <Link href="/dashboard" className="hover:text-ink-1 transition-colors">Dashboard</Link>
          <ChevronRight size={12} />
          <Link href="/settings/security" className="hover:text-ink-1 transition-colors">Settings</Link>
          <ChevronRight size={12} />
          <span className="text-ink-1">Profile</span>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-ink-1">Your Profile</h1>
          <p className="text-sm text-ink-3 mt-1">Personal information and emergency contact</p>
        </motion.div>

        {/* Avatar card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {form.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-ink-1">{form.name || 'Your Name'}</p>
            <p className="text-sm text-ink-3">{profile?.email}</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 capitalize">
              {user?.role || 'patient'}
            </span>
          </div>
        </motion.div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle size={15} /> {success}
          </div>
        )}

        {/* Form */}
        <motion.form
          onSubmit={handleSave}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 space-y-5"
        >
          <h2 className="font-semibold text-ink-1 flex items-center gap-2">
            <User size={16} className="text-violet-400" /> Personal Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" icon={User}>
              <input
                className="input-dark w-full"
                value={form.name}
                onChange={set('name')}
                placeholder="Your full name"
              />
            </Field>

            <Field label="Email" icon={Mail}>
              <input
                className="input-dark w-full opacity-60 cursor-not-allowed"
                value={profile?.email || ''}
                disabled
              />
            </Field>

            <Field label="Phone" icon={Phone}>
              <input
                className="input-dark w-full"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 98xxx xxxxx"
              />
            </Field>

            <Field label="Date of Birth" icon={Calendar}>
              <input
                type="date"
                className="input-dark w-full"
                value={form.dateOfBirth}
                onChange={set('dateOfBirth')}
                max={new Date().toISOString().slice(0, 10)}
              />
            </Field>

            <Field label="Gender" icon={User}>
              <select className="input-dark w-full" value={form.gender} onChange={set('gender')}>
                <option value="">Select gender</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>

            <Field label="Address" icon={MapPin}>
              <input
                className="input-dark w-full"
                value={form.address}
                onChange={set('address')}
                placeholder="City, State"
              />
            </Field>
          </div>

          <div className="pt-2 border-t border-white/5">
            <h2 className="font-semibold text-ink-1 flex items-center gap-2 mb-4">
              <Heart size={16} className="text-rose-400" /> Emergency Contact
            </h2>
            <Field label="Name & Phone" icon={Phone}>
              <input
                className="input-dark w-full"
                value={form.emergencyContact}
                onChange={set('emergencyContact')}
                placeholder="e.g. Mum — +91 98xxx xxxxx"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/settings/security"
              className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-violet-400 transition-colors"
            >
              <Shield size={14} /> Security & 2FA
            </Link>
            <button type="submit" disabled={saving} className="btn-primary gap-2">
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Save size={15} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </motion.form>

      </div>
    </div>
  );
}
