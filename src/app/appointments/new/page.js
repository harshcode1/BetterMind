'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

function NewAppointmentContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId');

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/auth/google/status').then(r => r.json()).then(d => setGoogleConnected(d.connected)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!doctorId || !user) return;
    setLoading(true);
    fetch(`/api/doctors/${doctorId}`).then(r => r.json()).then(d => {
      if (d.error) setError(d.error); else setDoctor(d);
    }).catch(() => setError('Failed to load doctor info')).finally(() => setLoading(false));
  }, [doctorId, user]);

  useEffect(() => {
    if (!doctorId || !selectedDate || !user) return;
    setSlotLoading(true); setSelectedTime('');
    fetch(`/api/doctors/${doctorId}?date=${selectedDate}`).then(r => r.json()).then(d => {
      if (d.error) { setError(d.error); setAvailableSlots([]); }
      else { setAvailableSlots(d.availableSlots || []); if (!d.availabilityError) setError(''); }
    }).catch(() => { setError('Failed to load slots'); setAvailableSlots([]); }).finally(() => setSlotLoading(false));
  }, [doctorId, selectedDate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return setError('Please select date and time');
    setError(''); setSubmitting(true);
    try {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, dateTime: dateTime.toISOString(), notes, useGoogleCalendar: googleConnected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book');
      setSuccess(true);
      setTimeout(() => router.push('/appointments'), 2200);
    } catch (err) { setError(err.message || 'Failed to book appointment'); }
    finally { setSubmitting(false); }
  };

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (authLoading || (loading && !doctor)) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-1">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="card p-10 text-center max-w-sm w-full">
        <div className="icon-box icon-box-mint w-16 h-16 rounded-2xl mx-auto mb-5">
          <CheckCircle size={28} className="text-mint-500" />
        </div>
        <h2 className="font-display font-bold text-2xl text-ink-1 mb-2">Appointment Booked!</h2>
        <p className="text-ink-3 text-sm">Redirecting to your appointments...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-1 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link href="/doctors" className="flex items-center gap-1.5 text-sm text-ink-4 hover:text-ink-2 transition-colors mb-6">
          <ArrowLeft size={14} /> Back to Doctors
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="font-display font-bold text-3xl text-ink-1 mb-6">Book Appointment</motion.h1>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-200">
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Doctor card */}
        {doctor && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="card p-5 mb-6 flex items-center gap-4">
            <div className="icon-box icon-box-brand w-12 h-12 rounded-xl font-display font-bold text-sm text-brand-600 flex-shrink-0">
              {(doctor.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-semibold text-ink-1">{doctor.name}</h2>
              <p className="text-brand-600 text-sm">{doctor.specialty}</p>
              {doctor.description && <p className="text-ink-4 text-xs mt-0.5 line-clamp-1">{doctor.description}</p>}
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-2 flex items-center gap-2">
                <Calendar size={13} className="text-brand-500" /> Select Date
              </label>
              <input type="date" min={minDate} value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                required className="input w-full" />
            </div>

            {/* Time slots */}
            <AnimatePresence>
              {selectedDate && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="block text-sm font-medium text-ink-2 mb-2 flex items-center gap-2">
                    <Clock size={13} className="text-brand-500" /> Select Time
                  </label>
                  {slotLoading ? (
                    <div className="flex items-center gap-2 text-sm text-ink-4 py-3">
                      <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                      Loading available slots...
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map(slot => {
                        const t = new Date(slot).toTimeString().slice(0, 5);
                        const selected = selectedTime === t;
                        return (
                          <motion.button key={slot} type="button" onClick={() => setSelectedTime(t)}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className={`py-2 px-3 rounded-xl text-sm font-medium transition-all text-center border ${
                              selected
                                ? 'bg-gradient-brand text-white border-transparent shadow-brand'
                                : 'bg-surface-1 text-ink-3 border-surface-border hover:border-brand-200 hover:text-ink-2'
                            }`}>
                            {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-ink-4 text-sm py-2">No available slots for this date. Please try another day.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-2">Notes for doctor <span className="text-ink-4 font-normal">(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Describe your concerns or symptoms..."
                className="input w-full resize-none text-sm" style={{ minHeight: 80 }} />
            </div>

            {/* Google Calendar notice */}
            {googleConnected && (
              <div className="flex items-center gap-2 text-xs text-mint-700 bg-mint-50 border border-mint-100 rounded-lg px-3 py-2">
                <CheckCircle size={12} /> This appointment will also be added to your Google Calendar
              </div>
            )}

            {/* Submit */}
            <motion.button type="submit" disabled={submitting || !selectedDate || !selectedTime}
              whileHover={{ scale: submitting ? 1 : 1.01 }} whileTap={{ scale: submitting ? 1 : 0.99 }}
              className="btn-primary w-full py-3.5 justify-center text-sm disabled:opacity-50">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Booking...</>
                : <><CheckCircle size={14} /> Confirm Appointment</>}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-surface-1">
        <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    }>
      <NewAppointmentContent />
    </Suspense>
  );
}
