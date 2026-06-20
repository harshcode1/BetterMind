'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Plus, X, GraduationCap, Briefcase, Clock } from 'lucide-react';

const DEFAULT_WORKING_HOURS = {
  monday:    { enabled: false, start: '09:00', end: '17:00' },
  tuesday:   { enabled: false, start: '09:00', end: '17:00' },
  wednesday: { enabled: false, start: '09:00', end: '17:00' },
  thursday:  { enabled: false, start: '09:00', end: '17:00' },
  friday:    { enabled: false, start: '09:00', end: '17:00' },
  saturday:  { enabled: false, start: '09:00', end: '13:00' },
  sunday:    { enabled: false, start: '09:00', end: '13:00' },
};

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '', specialization: '', bio: '', education: [], experience: [],
    workingHours: DEFAULT_WORKING_HOURS,
  });
  const [newEducation, setNewEducation] = useState({ institution: '', degree: '', year: '' });
  const [newExperience, setNewExperience] = useState({ position: '', organization: '', years: '' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'doctor') { router.push('/'); return; }
    if (!user.verified) { router.push('/doctor/verification'); return; }
    fetch('/api/doctor/profile').then(r => r.json()).then(d => {
      setFormData({ name: d.name || '', specialization: d.specialization || '', bio: d.bio || '', education: d.education || [], experience: d.experience || [], workingHours: d.workingHours || DEFAULT_WORKING_HOURS });
    }).catch(() => setError('Failed to load profile')).finally(() => setLoading(false));
  }, [user, router]);

  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setSaving(true);
    try {
      const res = await fetch('/api/doctor/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error('Failed to update profile');
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('An error occurred while updating your profile'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!user || user.role !== 'doctor' || !user.verified) return null;

  return (
    <div className="min-h-screen bg-surface-1 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display font-bold text-3xl text-ink-1">Doctor Profile</h1>
            <p className="text-ink-3 text-sm mt-1">Manage your professional information and availability</p>
          </motion.div>
          <span className={`badge ${user.verified ? 'badge-mint' : 'badge-amber'} flex items-center gap-1`}>
            {user.verified ? <><CheckCircle size={11} /> Verified</> : 'Pending'}
          </span>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic Info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <h2 className="font-display font-semibold text-ink-1 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1.5">Full Name</label>
                <input type="text" value={formData.name} onChange={e => set('name', e.target.value)}
                  className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1.5">Specialization</label>
                <input type="text" value={formData.specialization} onChange={e => set('specialization', e.target.value)}
                  className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1.5">Professional Bio</label>
                <textarea value={formData.bio} onChange={e => set('bio', e.target.value)}
                  rows={4} className="input w-full resize-none" />
              </div>
            </div>
          </motion.div>

          {/* Education */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="card p-6">
            <h2 className="font-display font-semibold text-ink-1 mb-4 flex items-center gap-2">
              <GraduationCap size={15} className="text-brand-500" /> Education
            </h2>

            {formData.education.length > 0 ? (
              <div className="space-y-3 mb-5">
                {formData.education.map((edu, idx) => (
                  <div key={idx} className="bg-surface-2 border border-surface-border rounded-xl p-4 relative">
                    <button type="button" onClick={() => set('education', formData.education.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-50 text-ink-4 hover:text-rose-500 transition-colors">
                      <X size={13} />
                    </button>
                    <div className="grid grid-cols-3 gap-3 pr-6">
                      {['institution', 'degree', 'year'].map(f => (
                        <div key={f}>
                          <label className="block text-xs font-medium text-ink-3 mb-1 capitalize">{f}</label>
                          <input type="text" value={edu[f] || ''} className="input text-sm py-1.5 w-full"
                            onChange={e => { const ed = [...formData.education]; ed[idx] = { ...ed[idx], [f]: e.target.value }; set('education', ed); }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-ink-4 text-sm mb-4">No education information added yet.</p>}

            <div className="border border-dashed border-surface-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-ink-2 mb-3">Add Education</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[['institution', 'Institution'], ['degree', 'Degree'], ['year', 'Year']].map(([f, label]) => (
                  <div key={f}>
                    <label className="block text-xs font-medium text-ink-3 mb-1">{label}</label>
                    <input type="text" value={newEducation[f]} className="input text-sm py-1.5 w-full"
                      onChange={e => setNewEducation(p => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => {
                if (newEducation.institution && newEducation.degree) {
                  set('education', [...formData.education, newEducation]);
                  setNewEducation({ institution: '', degree: '', year: '' });
                }
              }} className="btn-soft gap-2 text-sm">
                <Plus size={12} /> Add Education
              </button>
            </div>
          </motion.div>

          {/* Experience */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card p-6">
            <h2 className="font-display font-semibold text-ink-1 mb-4 flex items-center gap-2">
              <Briefcase size={15} className="text-calm-500" /> Professional Experience
            </h2>

            {formData.experience.length > 0 ? (
              <div className="space-y-3 mb-5">
                {formData.experience.map((exp, idx) => (
                  <div key={idx} className="bg-surface-2 border border-surface-border rounded-xl p-4 relative">
                    <button type="button" onClick={() => set('experience', formData.experience.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-50 text-ink-4 hover:text-rose-500 transition-colors">
                      <X size={13} />
                    </button>
                    <div className="grid grid-cols-3 gap-3 pr-6">
                      {['position', 'organization', 'years'].map(f => (
                        <div key={f}>
                          <label className="block text-xs font-medium text-ink-3 mb-1 capitalize">{f}</label>
                          <input type="text" value={exp[f] || ''} className="input text-sm py-1.5 w-full"
                            onChange={e => { const ex = [...formData.experience]; ex[idx] = { ...ex[idx], [f]: e.target.value }; set('experience', ex); }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-ink-4 text-sm mb-4">No experience information added yet.</p>}

            <div className="border border-dashed border-surface-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-ink-2 mb-3">Add Experience</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[['position', 'Position'], ['organization', 'Organization'], ['years', 'Years']].map(([f, label]) => (
                  <div key={f}>
                    <label className="block text-xs font-medium text-ink-3 mb-1">{label}</label>
                    <input type="text" value={newExperience[f]} className="input text-sm py-1.5 w-full"
                      onChange={e => setNewExperience(p => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => {
                if (newExperience.position && newExperience.organization) {
                  set('experience', [...formData.experience, newExperience]);
                  setNewExperience({ position: '', organization: '', years: '' });
                }
              }} className="btn-soft gap-2 text-sm">
                <Plus size={12} /> Add Experience
              </button>
            </div>
          </motion.div>

          {/* Working Hours */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="card p-6">
            <h2 className="font-display font-semibold text-ink-1 mb-1 flex items-center gap-2">
              <Clock size={15} className="text-mint-600" /> Working Hours
            </h2>
            <p className="text-sm text-ink-4 mb-5">Enable the days you are available and set your hours.</p>
            <div className="space-y-2.5">
              {Object.entries(formData.workingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-28 flex items-center gap-2.5">
                    <input type="checkbox" id={`day-${day}`} checked={hours.enabled}
                      onChange={e => setFormData(p => ({ ...p, workingHours: { ...p.workingHours, [day]: { ...p.workingHours[day], enabled: e.target.checked } } }))}
                      className="h-4 w-4 text-brand-600 rounded border-surface-border focus:ring-brand-500" />
                    <label htmlFor={`day-${day}`} className={`text-sm capitalize ${hours.enabled ? 'text-ink-1 font-medium' : 'text-ink-4'}`}>{day}</label>
                  </div>
                  <input type="time" value={hours.start} disabled={!hours.enabled}
                    onChange={e => setFormData(p => ({ ...p, workingHours: { ...p.workingHours, [day]: { ...p.workingHours[day], start: e.target.value } } }))}
                    className="input text-sm py-1.5 w-28 disabled:bg-surface-2 disabled:text-ink-5 disabled:cursor-not-allowed" />
                  <span className="text-ink-4 text-sm">to</span>
                  <input type="time" value={hours.end} disabled={!hours.enabled}
                    onChange={e => setFormData(p => ({ ...p, workingHours: { ...p.workingHours, [day]: { ...p.workingHours[day], end: e.target.value } } }))}
                    className="input text-sm py-1.5 w-28 disabled:bg-surface-2 disabled:text-ink-5 disabled:cursor-not-allowed" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Submit */}
          <div className="flex justify-end pb-4">
            <motion.button type="submit" disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.01 }} whileTap={{ scale: saving ? 1 : 0.99 }}
              className="btn-primary px-8 py-3 justify-center disabled:opacity-50">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : 'Save Profile'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
