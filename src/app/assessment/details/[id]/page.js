'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Activity, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { demoAssessments } from '../../../lib/demoData';

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure",
  "Trouble concentrating on things",
  "Moving or speaking so slowly that other people could have noticed. Or being so fidgety or restless",
  "Thoughts that you would be better off dead, or of hurting yourself",
];

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen",
];

const FREQ_LABELS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
const FREQ_BADGE  = ['badge-mint', 'badge-amber', 'badge-rose', 'badge-rose'];

const SEVERITY_BADGE = {
  'Minimal or none': 'badge-mint',
  'Mild':            'badge-amber',
  'Moderate':        'badge-amber',
  'Moderately severe': 'badge-rose',
  'Severe':          'badge-rose',
};

function generateRecommendations(assessment) {
  if (!assessment) return [];
  const recs = [];
  const { phq9Score, gad7Score, phq9Answers } = assessment;
  if (phq9Score >= 10) recs.push("Consider consulting with a mental health professional about your depression symptoms");
  if (phq9Score >= 5) {
    recs.push("Practice self-care: regular exercise and consistent sleep schedule help with mood");
    recs.push("Try mindfulness meditation to manage depressive thoughts");
  }
  if (gad7Score >= 10) recs.push("Consider consulting with a mental health professional about your anxiety symptoms");
  if (gad7Score >= 5) {
    recs.push("Practice deep breathing exercises when feeling anxious");
    recs.push("Limit caffeine and alcohol, which can worsen anxiety");
  }
  recs.push("Track your mood daily to identify patterns and triggers");
  recs.push("Maintain social connections and reach out for support when needed");
  const suicideRisk = phq9Answers ? phq9Answers[8] : 0;
  if (suicideRisk >= 1) recs.unshift("Your responses indicate you may be having thoughts of harming yourself. Please reach out to a mental health professional immediately or contact a crisis helpline.");
  return recs;
}

export default function AssessmentDetailsPage({ params }) {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading, isGuest } = useAuth();
  const router = useRouter();
  const { id } = params;

  useEffect(() => { if (!authLoading && !user && !isGuest) router.push('/login?redirect=/assessment/details/' + id); }, [user, authLoading, isGuest, router, id]);

  useEffect(() => {
    if (!user && isGuest) {
      const found = demoAssessments().find(a => a.id === id) || demoAssessments()[0];
      setAssessment(found); setLoading(false); return;
    }
    if (!user || !id) return;
    fetch(`/api/assessment/${id}`).then(r => r.json()).then(d => {
      if (d.assessment) setAssessment(d.assessment);
      else setError('Failed to load assessment details');
    }).catch(() => setError('An error occurred')).finally(() => setLoading(false));
  }, [user, isGuest, id]);

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

        {/* Breadcrumb + header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/assessment/history')}
            className="flex items-center gap-1.5 text-sm text-ink-4 hover:text-ink-2 transition-colors">
            <ArrowLeft size={14} /> History
          </button>
          <span className="text-ink-5">/</span>
          <span className="text-sm text-ink-2 font-medium">Assessment Details</span>
        </div>

        {loading ? (
          <div className="space-y-5">
            {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton rounded-2xl h-36" />)}
          </div>
        ) : error ? (
          <div className="card p-5 text-sm text-rose-600 bg-rose-50 border-rose-200">{error}</div>
        ) : assessment ? (
          <div className="space-y-5">

            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <div className="flex items-start justify-between mb-5">
                <h1 className="font-display font-bold text-2xl text-ink-1">Assessment Summary</h1>
                <span className="text-xs text-ink-4">{formatDate(assessment.date)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={14} className="text-brand-500" />
                    <h3 className="font-display font-medium text-ink-1 text-sm">Depression (PHQ-9)</h3>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display font-bold text-3xl text-brand-600">{assessment.phq9Score}</span>
                    <span className="text-ink-4 text-sm">/ 27</span>
                  </div>
                  <span className={`badge ${SEVERITY_BADGE[assessment.depressionSeverity] || 'badge-slate'}`}>
                    {assessment.depressionSeverity}
                  </span>
                </div>
                <div className="bg-calm-50 border border-calm-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-calm-600" />
                    <h3 className="font-display font-medium text-ink-1 text-sm">Anxiety (GAD-7)</h3>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display font-bold text-3xl text-calm-600">{assessment.gad7Score}</span>
                    <span className="text-ink-4 text-sm">/ 21</span>
                  </div>
                  <span className={`badge ${SEVERITY_BADGE[assessment.anxietySeverity] || 'badge-slate'}`}>
                    {assessment.anxietySeverity}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              className="card p-6">
              <h2 className="font-display font-semibold text-ink-1 mb-4">Recommendations</h2>
              <ul className="space-y-2.5">
                {generateRecommendations(assessment).map((rec, i) => {
                  const isCrisis = rec.includes('harming yourself');
                  return (
                    <li key={i} className={`flex items-start gap-2.5 text-sm ${isCrisis ? 'text-rose-700 font-medium' : 'text-ink-2'}`}>
                      {isCrisis
                        ? <AlertTriangle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                        : <CheckCircle size={13} className="text-mint-500 flex-shrink-0 mt-0.5" />}
                      {rec}
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* PHQ-9 Responses */}
            {assessment.phq9Answers && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                className="card p-6">
                <h2 className="font-display font-semibold text-ink-1 mb-4 flex items-center gap-2">
                  <Brain size={14} className="text-brand-500" /> PHQ-9 Responses
                </h2>
                <div className="space-y-3">
                  {PHQ9_QUESTIONS.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5 border-b border-surface-border last:border-0">
                      <span className="text-xs text-ink-5 w-5 flex-shrink-0 mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-ink-2 flex-1 leading-relaxed">{q}</p>
                      <span className={`badge flex-shrink-0 ${FREQ_BADGE[assessment.phq9Answers[i]] || 'badge-slate'}`}>
                        {FREQ_LABELS[assessment.phq9Answers[i]] ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* GAD-7 Responses */}
            {assessment.gad7Answers && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                className="card p-6">
                <h2 className="font-display font-semibold text-ink-1 mb-4 flex items-center gap-2">
                  <Activity size={14} className="text-calm-500" /> GAD-7 Responses
                </h2>
                <div className="space-y-3">
                  {GAD7_QUESTIONS.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5 border-b border-surface-border last:border-0">
                      <span className="text-xs text-ink-5 w-5 flex-shrink-0 mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-ink-2 flex-1 leading-relaxed">{q}</p>
                      <span className={`badge flex-shrink-0 ${FREQ_BADGE[assessment.gad7Answers[i]] || 'badge-slate'}`}>
                        {FREQ_LABELS[assessment.gad7Answers[i]] ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Disclaimer */}
            <div className="card p-4 bg-surface-2 text-xs text-ink-4 leading-relaxed">
              <strong className="text-ink-3">Disclaimer:</strong> This assessment is not a diagnostic tool and does not replace professional medical advice. If you&apos;re experiencing severe symptoms or thoughts of harming yourself, please seek immediate professional help.
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button onClick={() => router.push('/assessment/history')} className="btn-soft gap-2">
                <ArrowLeft size={13} /> Back to History
              </button>
              <button onClick={() => router.push('/assessment')} className="btn-primary gap-2">
                <Plus size={13} /> New Assessment
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p className="text-ink-3 text-sm">Assessment not found.</p>
            <button onClick={() => router.push('/assessment/history')} className="btn-soft mt-2">Back to History</button>
          </div>
        )}
      </div>
    </div>
  );
}
