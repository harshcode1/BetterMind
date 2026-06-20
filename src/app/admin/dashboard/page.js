'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Eye, X, AlertCircle } from 'lucide-react';

const TABS = [
  { key: 'pending',  label: 'Pending Verification' },
  { key: 'verified', label: 'Verified Doctors' },
  { key: 'rejected', label: 'Rejected Applications' },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('pending');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!isAdmin?.()) { router.push('/'); return; }
  }, [user, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin?.()) return;
    setLoading(true);
    fetch(`/api/admin/doctors?status=${activeTab}`).then(r => r.json()).then(d => {
      setDoctors(d.doctors || []);
    }).catch(() => setError('Failed to load doctors. Please try again.')).finally(() => setLoading(false));
  }, [activeTab, user, isAdmin]);

  const handleApprove = async (doctorId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
      setSelectedDoctor(null);
    } catch { setError('Failed to approve doctor.'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (doctorId) => {
    if (!rejectionReason.trim()) { setError('Please provide a reason for rejection'); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: false, rejected: true, rejectionReason }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
      setSelectedDoctor(null); setRejectionReason('');
    } catch { setError('Failed to reject doctor.'); }
    finally { setActionLoading(false); }
  };

  if (!user || !isAdmin?.()) return null;

  return (
    <div className="min-h-screen bg-surface-1 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
          <div className="icon-box icon-box-brand w-10 h-10 rounded-xl">
            <Shield size={18} className="text-brand-600" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-ink-1">Admin Dashboard</h1>
            <p className="text-ink-3 text-sm">Doctor verification &amp; management</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="tab-bar mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`tab-item ${activeTab === t.key ? 'active' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-200">
              <AlertCircle size={14} /> {error}
              <button onClick={() => setError(null)} className="ml-auto"><X size={13} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton rounded-xl h-14" />)}</div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Shield size={26} className="text-ink-4" /></div>
            <p className="text-ink-3 text-sm">
              {activeTab === 'pending' ? 'No pending verifications' : activeTab === 'verified' ? 'No verified doctors' : 'No rejected applications'}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-surface-2 border-b border-surface-border">
                    {['Name', 'Email', 'Specialty', 'License', 'Submitted', 'Actions'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-ink-3 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {doctors.map((doctor, i) => (
                    <motion.tr key={doctor._id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="hover:bg-surface-2 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-ink-1">{doctor.name}</td>
                      <td className="py-3 px-4 text-sm text-ink-3">{doctor.email}</td>
                      <td className="py-3 px-4 text-sm text-ink-3">{doctor.specialty}</td>
                      <td className="py-3 px-4 text-sm text-ink-3 font-mono text-xs">{doctor.licenseNumber}</td>
                      <td className="py-3 px-4 text-sm text-ink-4">{new Date(doctor.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedDoctor(doctor); setRejectionReason(''); }}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors">
                            <Eye size={12} /> View
                          </button>
                          {activeTab === 'pending' && (
                            <button onClick={() => handleApprove(doctor._id)}
                              className="flex items-center gap-1 text-xs text-mint-600 hover:text-mint-700 transition-colors">
                              <CheckCircle size={12} /> Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={e => e.target === e.currentTarget && setSelectedDoctor(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-bold text-xl text-ink-1">Doctor Details</h2>
                  <button onClick={() => setSelectedDoctor(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-ink-4 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-5">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Personal</h3>
                    <p className="text-sm"><span className="text-ink-4">Name:</span> <span className="font-medium text-ink-1">{selectedDoctor.name}</span></p>
                    <p className="text-sm"><span className="text-ink-4">Email:</span> <span className="text-ink-2">{selectedDoctor.email}</span></p>
                    <p className="text-sm"><span className="text-ink-4">Phone:</span> <span className="text-ink-2">{selectedDoctor.phone || 'Not provided'}</span></p>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Professional</h3>
                    <p className="text-sm"><span className="text-ink-4">Specialty:</span> <span className="font-medium text-ink-1">{selectedDoctor.specialty}</span></p>
                    <p className="text-sm"><span className="text-ink-4">License:</span> <span className="font-mono text-xs text-ink-2">{selectedDoctor.licenseNumber}</span></p>
                    <p className="text-sm"><span className="text-ink-4">Credentials:</span> <span className="text-ink-2">{selectedDoctor.credentials || 'N/A'}</span></p>
                  </div>
                </div>

                {selectedDoctor.address && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Address</h3>
                    <p className="text-sm text-ink-2">{selectedDoctor.address}</p>
                  </div>
                )}

                {selectedDoctor.bio && (
                  <div className="mb-5">
                    <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Professional Bio</h3>
                    <p className="text-sm text-ink-2 whitespace-pre-line">{selectedDoctor.bio}</p>
                  </div>
                )}

                {activeTab === 'rejected' && selectedDoctor.rejectionReason && (
                  <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                    <h3 className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Rejection Reason</h3>
                    <p className="text-sm text-rose-700 whitespace-pre-line">{selectedDoctor.rejectionReason}</p>
                  </div>
                )}

                {activeTab === 'pending' && (
                  <div className="border-t border-surface-border pt-5">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-ink-2 mb-1.5">
                        Rejection Reason <span className="text-ink-4 font-normal">(required if rejecting)</span>
                      </label>
                      <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                        className="input w-full text-sm resize-none" rows={3}
                        placeholder="Provide a reason for rejection..." />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setSelectedDoctor(null)} disabled={actionLoading}
                        className="btn-soft">Cancel</button>
                      <button onClick={() => handleReject(selectedDoctor._id)} disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50">
                        <XCircle size={13} /> {actionLoading ? 'Rejecting...' : 'Reject'}
                      </button>
                      <button onClick={() => handleApprove(selectedDoctor._id)} disabled={actionLoading}
                        className="btn-primary gap-2 disabled:opacity-50">
                        <CheckCircle size={13} /> {actionLoading ? 'Approving...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
