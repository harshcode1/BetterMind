'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Calendar, Users, Star, Clock, AlertTriangle, CheckCircle, ArrowRight, Stethoscope } from 'lucide-react';

const STAT_META = [
  { key: 'upcomingAppointments', label: 'Upcoming', icon: Calendar, iconBox: 'icon-box-brand',  text: 'text-brand-600' },
  { key: 'totalPatients',        label: 'Patients',  icon: Users,    iconBox: 'icon-box-calm',  text: 'text-calm-600' },
  { key: 'pendingReviews',       label: 'Pending',   icon: Clock,    iconBox: 'icon-box-warm',  text: 'text-warm-500' },
  { key: 'averageRating',        label: 'Avg Rating',icon: Star,     iconBox: 'icon-box-rose',  text: 'text-rose-500', format: v => `${(v || 0).toFixed(1)} ★` },
];

const STATUS_BADGE = {
  confirmed: 'badge-mint',
  pending:   'badge-amber',
  cancelled: 'badge-rose',
};

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ upcomingAppointments: 0, totalPatients: 0, pendingReviews: 0, averageRating: 0 });
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'doctor') { router.push('/'); return; }
    (async () => {
      setLoading(true);
      try {
        const [sR, aR, pR] = await Promise.all([
          fetch('/api/doctor/stats'), fetch('/api/doctor/appointments?limit=5'), fetch('/api/doctor/profile'),
        ]);
        if (sR.ok) setStats(await sR.json());
        if (aR.ok) setAppointments(await aR.json());
        if (pR.ok) setDoctorProfile(await pR.json());
      } catch {} finally { setLoading(false); }
    })();
  }, [user, router]);

  if (!user || user.role !== 'doctor') return null;

  return (
    <div className="min-h-screen bg-surface-1 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-ink-1">Doctor Dashboard</h1>
            <p className="text-ink-3 text-sm mt-1">Welcome back, {user.name}</p>
          </div>
          <div className="icon-box icon-box-brand w-11 h-11 rounded-xl font-display font-bold text-brand-600 text-sm">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
        </motion.div>

        {/* Verification banners */}
        {!user.verified && doctorProfile?.rejected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 px-4 py-4 rounded-xl mb-5 bg-rose-50 border border-rose-200">
            <AlertTriangle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-rose-700 font-semibold text-sm">Application not approved</p>
              {doctorProfile.rejectionReason && <p className="text-rose-600 text-xs mt-0.5">Reason: {doctorProfile.rejectionReason}</p>}
              <p className="text-rose-500 text-xs mt-1">Update your profile with accurate credentials and contact support if you believe this is an error.</p>
            </div>
          </motion.div>
        )}

        {!user.verified && !doctorProfile?.rejected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 px-4 py-4 rounded-xl mb-5 bg-amber-50 border border-amber-200">
            <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-700 font-semibold text-sm">Verification Pending</p>
              <p className="text-amber-600 text-xs mt-0.5">Your account is awaiting admin verification. You can accept appointments once approved.</p>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton rounded-2xl h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_META.map(({ key, label, icon: Icon, iconBox, text, format }, i) => (
              <motion.div key={key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="card p-5">
                <div className={`icon-box w-9 h-9 rounded-xl mb-3 ${iconBox}`}>
                  <Icon size={15} className={text} />
                </div>
                <p className="font-display font-bold text-2xl text-ink-1">
                  {format ? format(stats[key]) : (stats[key] ?? 0)}
                </p>
                <p className="text-ink-4 text-xs mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Appointments table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-surface-border">
            <h2 className="font-display font-semibold text-ink-1 flex items-center gap-2">
              <Calendar size={15} className="text-brand-500" /> Upcoming Appointments
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <div className="empty-state-icon mb-3"><Stethoscope size={26} className="text-ink-4" /></div>
              <p className="text-ink-3 text-sm">No upcoming appointments</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {appointments.map((appt, i) => {
                const date = new Date(appt.dateTime);
                return (
                  <motion.div key={appt._id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-2 transition-colors">
                    <div className="icon-box icon-box-brand w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center justify-center">
                      <span className="font-bold text-sm text-brand-600 leading-none">{date.getDate()}</span>
                      <span className="text-xs text-brand-400">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-1 text-sm truncate">{appt.patientName || 'Patient'}</p>
                      <p className="text-xs text-ink-4">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`badge ${STATUS_BADGE[appt.status] || 'badge-slate'} flex-shrink-0`}>
                      {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
                    </span>
                    <Link href={`/doctor/appointments/${appt._id}`}
                      className="text-ink-4 hover:text-brand-500 transition-colors flex-shrink-0">
                      <ArrowRight size={14} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Verified badge */}
        {user.verified && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-2 mt-4 text-xs text-mint-600">
            <CheckCircle size={13} /> Verified healthcare provider
          </motion.div>
        )}
      </div>
    </div>
  );
}
