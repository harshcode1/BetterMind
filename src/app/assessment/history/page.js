'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ClipboardList, Plus, Brain, Activity, TrendingUp,
  TrendingDown, Minus, ChevronRight, ArrowRight, Calendar,
} from 'lucide-react';
import { demoAssessments } from '../../lib/demoData';

const SEVERITY = {
  'Minimal or none':   { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  'Mild':              { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-400' },
  'Moderate':          { color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  'Moderately severe': { color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',     dot: 'bg-rose-400' },
  'Severe':            { color: 'text-red-400',      bg: 'bg-red-500/10 border-red-500/20',       dot: 'bg-red-400' },
};

const DEFAULT_SEV = { color: 'text-ink-3', bg: 'bg-white/5 border-white/10', dot: 'bg-ink-3' };

function SeverityBadge({ label }) {
  const s = SEVERITY[label] || DEFAULT_SEV;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function ScoreBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-xs tabular-nums text-ink-3 w-8 text-right">{value}/{max}</span>
    </div>
  );
}

function TrendIcon({ current, previous }) {
  if (previous == null) return null;
  const diff = current - previous;
  if (diff < -1) return <TrendingDown size={13} className="text-emerald-400" />;
  if (diff > 1)  return <TrendingUp size={13} className="text-rose-400" />;
  return <Minus size={13} className="text-ink-4" />;
}

function AssessmentCard({ assessment, previous, index }) {
  const router = useRouter();
  const date = new Date(assessment.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl p-5 group hover:border-white/20 transition-all cursor-pointer"
      onClick={() => router.push(`/assessment/details/${assessment.id}`)}
    >
      {/* Top row — date + view */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <Calendar size={12} />
          <span>{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span className="text-ink-4">·</span>
          <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <span className="flex items-center gap-1 text-xs text-ink-4 group-hover:text-violet-400 transition-colors">
          View <ArrowRight size={11} />
        </span>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        {/* PHQ-9 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Brain size={13} className="text-violet-400" />
            <span className="text-xs font-semibold text-ink-2">PHQ-9</span>
            <TrendIcon current={assessment.phq9Score} previous={previous?.phq9Score} />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-display text-ink-1 leading-none">{assessment.phq9Score}</span>
            <span className="text-xs text-ink-4 mb-0.5">/ 27</span>
          </div>
          <ScoreBar value={assessment.phq9Score} max={27} color="bg-violet-500" />
          <SeverityBadge label={assessment.depressionSeverity} />
        </div>

        {/* GAD-7 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-cyan-400" />
            <span className="text-xs font-semibold text-ink-2">GAD-7</span>
            <TrendIcon current={assessment.gad7Score} previous={previous?.gad7Score} />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-display text-ink-1 leading-none">{assessment.gad7Score}</span>
            <span className="text-xs text-ink-4 mb-0.5">/ 21</span>
          </div>
          <ScoreBar value={assessment.gad7Score} max={21} color="bg-cyan-500" />
          <SeverityBadge label={assessment.anxietySeverity} />
        </div>
      </div>
    </motion.div>
  );
}

export default function AssessmentHistoryPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user && !isGuest) router.push('/login?redirect=/assessment/history');
  }, [user, authLoading, isGuest, router]);

  useEffect(() => {
    if (!user && isGuest) { setAssessments(demoAssessments()); setLoading(false); return; }
    if (!user) return;
    fetch('/api/assessment')
      .then(r => r.json())
      .then(d => {
        if (d.assessments) setAssessments(d.assessments);
        else setError('Failed to load assessment history');
      })
      .catch(() => setError('Network error — please try again'))
      .finally(() => setLoading(false));
  }, [user, isGuest]);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user && !isGuest) return null;

  const latest = assessments[0];
  const previous = assessments[1];

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <Link href="/dashboard" className="hover:text-ink-1 transition-colors">Dashboard</Link>
          <ChevronRight size={12} />
          <Link href="/assessment" className="hover:text-ink-1 transition-colors">Assessment</Link>
          <ChevronRight size={12} />
          <span className="text-ink-1">History</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-display font-bold text-ink-1">Assessment History</h1>
            <p className="text-sm text-ink-3 mt-1">Your PHQ-9 (depression) and GAD-7 (anxiety) scores over time</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            onClick={() => router.push('/assessment')}
            className="btn-primary gap-2 flex-shrink-0"
          >
            <Plus size={13} /> New
          </motion.button>
        </div>

        {/* Summary strip — only when there's data */}
        {latest && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5 flex flex-wrap gap-6"
          >
            <div>
              <p className="text-xs text-ink-3 mb-1">Total assessments</p>
              <p className="text-2xl font-display font-bold text-ink-1">{assessments.length}</p>
            </div>
            <div>
              <p className="text-xs text-ink-3 mb-1">Latest PHQ-9</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-display font-bold text-violet-400">{latest.phq9Score}</p>
                {previous && (
                  <span className={`text-xs ${latest.phq9Score < previous.phq9Score ? 'text-emerald-400' : latest.phq9Score > previous.phq9Score ? 'text-rose-400' : 'text-ink-4'}`}>
                    {latest.phq9Score < previous.phq9Score ? '▼' : latest.phq9Score > previous.phq9Score ? '▲' : '—'}
                    {Math.abs(latest.phq9Score - previous.phq9Score) || ''}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-ink-3 mb-1">Latest GAD-7</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-display font-bold text-cyan-400">{latest.gad7Score}</p>
                {previous && (
                  <span className={`text-xs ${latest.gad7Score < previous.gad7Score ? 'text-emerald-400' : latest.gad7Score > previous.gad7Score ? 'text-rose-400' : 'text-ink-4'}`}>
                    {latest.gad7Score < previous.gad7Score ? '▼' : latest.gad7Score > previous.gad7Score ? '▲' : '—'}
                    {Math.abs(latest.gad7Score - previous.gad7Score) || ''}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-auto self-center">
              <SeverityBadge label={latest.depressionSeverity} />
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="skeleton rounded-2xl h-40" />
            ))}
          </div>
        ) : assessments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass rounded-2xl p-12 flex flex-col items-center text-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <ClipboardList size={24} className="text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-ink-1">No assessments yet</p>
              <p className="text-sm text-ink-3 mt-1">Take your first PHQ-9 + GAD-7 to start tracking.</p>
            </div>
            <button onClick={() => router.push('/assessment')} className="btn-primary gap-2">
              <Plus size={13} /> Take Assessment
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {assessments.map((a, i) => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  previous={assessments[i + 1] || null}
                  index={i}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}
