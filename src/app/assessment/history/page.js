'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, ArrowRight, Brain, Activity } from 'lucide-react';
import { demoAssessments } from '../../lib/demoData';

const SEVERITY_BADGE = {
  'Minimal or none': 'badge-mint',
  'Mild':            'badge-amber',
  'Moderate':        'badge-amber',
  'Moderately severe': 'badge-rose',
  'Severe':          'badge-rose',
};

export default function AssessmentHistoryPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!authLoading && !user && !isGuest) router.push('/login?redirect=/assessment/history'); }, [user, authLoading, isGuest, router]);

  useEffect(() => {
    if (!user && isGuest) { setAssessments(demoAssessments()); setLoading(false); return; }
    if (!user) return;
    fetch('/api/assessment').then(r => r.json()).then(d => {
      if (d.assessments) setAssessments(d.assessments);
      else setError('Failed to load assessment history');
    }).catch(() => setError('An error occurred while fetching your assessment history')).finally(() => setLoading(false));
  }, [user, isGuest]);

  const formatDate = d => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (authLoading) return (
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display font-bold text-3xl text-ink-1">Assessment History</h1>
            <p className="text-ink-3 text-sm mt-1">Track your PHQ-9 and GAD-7 progress over time</p>
          </motion.div>
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            onClick={() => router.push('/assessment')}
            className="btn-primary gap-2">
            <Plus size={13} /> New Assessment
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <div className="card p-4 mb-6 text-sm text-rose-600 bg-rose-50 border-rose-200">{error}</div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton rounded-2xl h-20" />)}
          </div>
        ) : assessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ClipboardList size={28} className="text-ink-4" /></div>
            <h3 className="font-display font-semibold text-ink-1 text-lg">No assessments yet</h3>
            <p className="text-ink-3 text-sm">Take your first PHQ-9 + GAD-7 assessment to start tracking.</p>
            <button onClick={() => router.push('/assessment')} className="btn-primary mt-2 gap-2">
              <Plus size={13} /> Take Assessment
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Table header */}
            <div className="px-5 py-3.5 border-b border-surface-border flex items-center gap-2">
              <ClipboardList size={14} className="text-brand-500" />
              <h2 className="font-display font-semibold text-ink-1 text-sm">Past Assessments</h2>
              <span className="badge badge-brand ml-auto">{assessments.length} total</span>
            </div>

            <div className="divide-y divide-surface-border">
              {assessments.map((assessment, i) => (
                <motion.div key={assessment.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2 transition-colors group">

                  {/* Date */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-1">{formatDate(assessment.date)}</p>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Brain size={11} className="text-brand-500" />
                        <span className="text-xs text-ink-4">PHQ-9:</span>
                        <span className="text-sm font-bold text-brand-600">{assessment.phq9Score}</span>
                        <span className={`badge text-xs ${SEVERITY_BADGE[assessment.depressionSeverity] || 'badge-slate'}`}>
                          {assessment.depressionSeverity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity size={11} className="text-calm-500" />
                        <span className="text-xs text-ink-4">GAD-7:</span>
                        <span className="text-sm font-bold text-calm-600">{assessment.gad7Score}</span>
                        <span className={`badge text-xs ${SEVERITY_BADGE[assessment.anxietySeverity] || 'badge-slate'}`}>
                          {assessment.anxietySeverity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View link */}
                  <button onClick={() => router.push(`/assessment/details/${assessment.id}`)}
                    className="flex items-center gap-1 text-xs text-ink-4 hover:text-brand-600 transition-colors flex-shrink-0 group-hover:text-brand-600">
                    View <ArrowRight size={12} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
