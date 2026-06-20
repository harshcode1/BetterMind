'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Search, Calendar, Stethoscope, Users, Filter } from 'lucide-react';
import { demoDoctors } from '../lib/demoData';

const AVATAR_COLORS = ['icon-box-brand', 'icon-box-calm', 'icon-box-mint', 'icon-box-warm', 'icon-box-rose'];
const AVATAR_TEXT   = ['text-brand-600', 'text-calm-600', 'text-mint-600', 'text-warm-500', 'text-rose-500'];

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={11}
            fill={s <= Math.round(rating || 0) ? '#fbbf24' : 'none'}
            className={s <= Math.round(rating || 0) ? 'text-amber-400' : 'text-ink-5'} />
        ))}
      </div>
      <span className="text-xs text-ink-4">
        {rating ? `${rating.toFixed(1)} (${count ?? 0})` : 'No reviews yet'}
      </span>
    </div>
  );
}

function DoctorCard({ doctor, onBook, index }) {
  const initials = (doctor.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colorIdx = index % AVATAR_COLORS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className="card p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`icon-box w-12 h-12 rounded-xl flex-shrink-0 font-display font-bold text-sm ${AVATAR_COLORS[colorIdx]} ${AVATAR_TEXT[colorIdx]}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-ink-1 leading-tight truncate">{doctor.name}</h3>
          <p className={`text-xs font-semibold mt-0.5 ${AVATAR_TEXT[colorIdx]}`}>{doctor.specialty}</p>
          <StarRating rating={doctor.averageRating} count={doctor.reviews?.length} />
        </div>
      </div>

      {/* Bio */}
      {(doctor.description || doctor.bio) && (
        <p className="text-sm text-ink-3 leading-relaxed line-clamp-2">{doctor.description || doctor.bio}</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-ink-4">
        {doctor.experience  && <span className="flex items-center gap-1"><Stethoscope size={11} /> {doctor.experience}y exp.</span>}
        {doctor.totalPatients && <span className="flex items-center gap-1"><Users size={11} /> {doctor.totalPatients} patients</span>}
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => onBook(doctor)}
        className="btn-primary w-full gap-2 py-2.5 text-sm justify-center"
      >
        <Calendar size={13} /> Book Appointment
      </motion.button>
    </motion.div>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [search, setSearch] = useState('');
  const { user, loading: authLoading, isGuest, requireRealUser } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!authLoading && !user && !isGuest) router.push('/login?redirect=/doctors'); }, [user, authLoading, isGuest]);

  useEffect(() => {
    if (!user && isGuest) {
      const all = demoDoctors();
      const filtered = selectedSpecialty ? all.filter(d => d.specialty === selectedSpecialty) : all;
      setDoctors(filtered);
      setSpecialties([...new Set(all.map(d => d.specialty))].filter(Boolean));
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);
    const url = selectedSpecialty ? `/api/doctors?specialty=${encodeURIComponent(selectedSpecialty)}` : '/api/doctors';
    fetch(url).then(r => r.json()).then(d => {
      if (d.doctors) {
        setDoctors(d.doctors);
        if (!selectedSpecialty) setSpecialties([...new Set(d.doctors.map(doc => doc.specialty))].filter(Boolean));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, isGuest, selectedSpecialty]);

  const handleBook = (d) => {
    if (!requireRealUser('book an appointment')) return;
    router.push(`/appointments/new?doctorId=${d.id || d._id}`);
  };

  const filtered = search.trim()
    ? doctors.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()) || d.specialty?.toLowerCase().includes(search.toLowerCase()))
    : doctors;

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!user && !isGuest) return null;

  return (
    <div className="min-h-screen bg-surface-1 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display font-bold text-3xl text-ink-1 mb-2">Mental Health Professionals</h1>
          <p className="text-ink-3 text-sm">Find and connect with verified healthcare providers</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="mb-6 relative max-w-lg mx-auto">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or specialty..."
            className="input pl-11 w-full" />
        </motion.div>

        {/* Specialty pills */}
        {specialties.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
            className="flex flex-wrap gap-2 mb-8 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-ink-4 mr-1 self-center">
              <Filter size={11} /> Filter:
            </span>
            {['', ...specialties].map((s, i) => (
              <button key={i} onClick={() => setSelectedSpecialty(s)}
                className={`chip ${selectedSpecialty === s ? 'active' : ''}`}>
                {s || 'All Specialties'}
              </button>
            ))}
          </motion.div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton rounded-2xl h-56" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Stethoscope size={28} className="text-ink-4" /></div>
            <h3 className="font-display font-semibold text-ink-1">No doctors found</h3>
            <p className="text-ink-3 text-sm">
              {selectedSpecialty ? `No ${selectedSpecialty} specialists available` : 'No doctors are currently available.'}
            </p>
            {selectedSpecialty && (
              <button onClick={() => setSelectedSpecialty('')} className="btn-soft mt-2">Clear filter</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((doc, i) => (
                <DoctorCard key={doc.id || doc._id} doctor={doc} index={i} onBook={handleBook} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
