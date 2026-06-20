'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, RefreshCw, Plus, AlertCircle, CheckCircle, XCircle, Stethoscope } from 'lucide-react';
import { demoAppointments } from '../lib/demoData';

const STATUS_CONFIG = {
  confirmed: { badge: 'badge-mint',  icon: CheckCircle, borderColor: 'border-mint-400',  dateBox: 'bg-mint-50 border-mint-100',  dateText: 'text-mint-600' },
  pending:   { badge: 'badge-amber', icon: Clock,        borderColor: 'border-amber-400', dateBox: 'bg-amber-50 border-amber-100', dateText: 'text-amber-600' },
  cancelled: { badge: 'badge-rose',  icon: XCircle,      borderColor: 'border-rose-300',  dateBox: 'bg-rose-50 border-rose-100',   dateText: 'text-rose-500' },
};

function AppointmentCard({ appt, onCancel, cancelling, index, dimmed }) {
  const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const date = new Date(appt.dateTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: dimmed ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`card p-5 flex flex-col sm:flex-row sm:items-center gap-4 border-l-2 ${cfg.borderColor}`}
    >
      {/* Date block */}
      <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center border ${cfg.dateBox}`}>
        <span className={`font-display font-bold text-xl leading-none ${cfg.dateText}`}>{date.getDate()}</span>
        <span className="text-xs text-ink-4">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <User size={12} className="text-ink-4 flex-shrink-0" />
          <p className="font-display font-semibold text-ink-1 truncate">{appt.doctorName || 'Doctor'}</p>
        </div>
        {appt.specialty && <p className="text-xs text-brand-600 font-medium mb-1">{appt.specialty}</p>}
        <div className="flex items-center gap-4 text-xs text-ink-4">
          <span className="flex items-center gap-1"><Clock size={11} /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="flex items-center gap-1"><Calendar size={11} /> {date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Status + Action */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`badge ${cfg.badge} flex items-center gap-1`}>
          <StatusIcon size={10} /> {cfg.badge.split('-')[1].charAt(0).toUpperCase() + cfg.badge.split('-')[1].slice(1) === 'Mint' ? 'Confirmed' : cfg.badge.split('-')[1] === 'amber' ? 'Pending' : 'Cancelled'}
          {appt.googleEventId && <span className="opacity-50 ml-0.5">·G</span>}
        </span>
        {appt.status !== 'cancelled' && (
          <button onClick={() => onCancel(appt._id)} disabled={cancelling === appt._id}
            className="text-xs text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 disabled:opacity-40">
            {cancelling === appt._id
              ? <><div className="w-3 h-3 border border-rose-300 border-t-rose-500 rounded-full animate-spin" /> Cancelling...</>
              : <><XCircle size={12} /> Cancel</>}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { user, loading: authLoading, isGuest, requireRealUser } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!authLoading && !user && !isGuest) router.push('/login'); }, [user, authLoading, isGuest, router]);

  useEffect(() => {
    if (!user && isGuest) { setAppointments(demoAppointments()); setLoading(false); return; }
    if (!user) return;
    fetch('/api/auth/google/status').then(r => r.json()).then(d => setGoogleConnected(d.connected)).catch(() => {});
    fetch('/api/appointments').then(r => r.json()).then(d => {
      if (d.error) setError(d.error); else setAppointments(Array.isArray(d) ? d : []);
    }).catch(() => setError('Failed to fetch appointments')).finally(() => setLoading(false));
  }, [user, isGuest]);

  const handleCancel = async (id) => {
    if (!requireRealUser('cancel an appointment')) return;
    if (!window.confirm('Cancel this appointment?')) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
    } catch (err) { setError(err.message || 'Failed to cancel'); }
    finally { setCancellingId(null); }
  };

  const handleSync = async () => {
    if (!requireRealUser('sync with Google Calendar')) return;
    if (!googleConnected) { router.push('/api/auth/google?redirect=/appointments'); return; }
    setSyncing(true);
    try {
      await fetch('/api/appointments/sync', { method: 'POST' });
      const res = await fetch('/api/appointments');
      const d = await res.json();
      if (Array.isArray(d)) setAppointments(d);
    } catch { setError('Failed to sync'); }
    finally { setSyncing(false); }
  };

  const upcoming = appointments
    .filter(a => new Date(a.dateTime) >= new Date() && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  const past = appointments
    .filter(a => new Date(a.dateTime) < new Date() || a.status === 'cancelled')
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  if (authLoading || (loading && !appointments.length)) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!user && !isGuest) return null;

  return (
    <div className="min-h-screen bg-surface-1 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="font-display font-bold text-3xl text-ink-1">My Appointments</motion.h1>
            <p className="text-ink-3 text-sm mt-1">{upcoming.length} upcoming</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              onClick={handleSync} disabled={syncing}
              className={`btn-soft gap-2 text-sm disabled:opacity-50 ${googleConnected ? 'text-mint-600' : ''}`}>
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {googleConnected ? 'Sync Calendar' : 'Connect Calendar'}
            </motion.button>
            <Link href="/doctors">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}
                className="btn-primary gap-2 text-sm cursor-pointer">
                <Plus size={13} /> New
              </motion.span>
            </Link>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-200">
              <AlertCircle size={14} /> {error}
              <button onClick={() => setError('')} className="ml-auto"><XCircle size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-semibold text-ink-1 mb-4 text-base flex items-center gap-2">
              <Calendar size={15} className="text-brand-500" /> Upcoming
            </h2>
            <div className="space-y-3">
              {upcoming.map((a, i) => (
                <AppointmentCard key={a._id} appt={a} onCancel={handleCancel} cancelling={cancellingId} index={i} dimmed={false} />
              ))}
            </div>
          </div>
        )}

        {/* Past / Cancelled */}
        {past.length > 0 && (
          <div>
            <h2 className="font-display font-medium text-ink-4 mb-4 text-xs uppercase tracking-widest">Past &amp; Cancelled</h2>
            <div className="space-y-3">
              {past.map((a, i) => (
                <AppointmentCard key={a._id} appt={a} onCancel={handleCancel} cancelling={cancellingId} index={i} dimmed={true} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {appointments.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon"><Stethoscope size={28} className="text-ink-4" /></div>
            <h3 className="font-display font-semibold text-ink-1 text-lg">No appointments yet</h3>
            <p className="text-ink-3 text-sm">Book your first appointment with a mental health professional.</p>
            <Link href="/doctors">
              <span className="btn-primary mt-2 cursor-pointer">Find a Doctor</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
