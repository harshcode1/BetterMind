'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, RotateCcw, BookOpen, Smile } from 'lucide-react';

const PHQ9 = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you are a failure",
  "Trouble concentrating on things",
  "Moving or speaking so slowly that others noticed, or being unusually restless",
  "Thoughts that you would be better off dead or of hurting yourself",
];

const GAD7 = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen",
];

const FREQ = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

function getSeverity(score, type) {
  if (type === 'phq9') {
    if (score <= 4)  return { text: 'Minimal',           color: '#10b981', bg: 'bg-mint-50',  border: 'border-mint-200',  badge: 'badge-mint' };
    if (score <= 9)  return { text: 'Mild',               color: '#84cc16', bg: 'bg-mint-50',  border: 'border-mint-200',  badge: 'badge-mint' };
    if (score <= 14) return { text: 'Moderate',           color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'badge-amber' };
    if (score <= 19) return { text: 'Moderately Severe',  color: '#f97316', bg: 'bg-warm-50',  border: 'border-warm-200',  badge: 'badge-warm' };
    return           { text: 'Severe', color: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'badge-rose' };
  }
  if (score <= 4)  return { text: 'Minimal',  color: '#10b981', bg: 'bg-mint-50',  border: 'border-mint-200',  badge: 'badge-mint' };
  if (score <= 9)  return { text: 'Mild',     color: '#84cc16', bg: 'bg-mint-50',  border: 'border-mint-200',  badge: 'badge-mint' };
  if (score <= 14) return { text: 'Moderate', color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'badge-amber' };
  return           { text: 'Severe',  color: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'badge-rose' };
}

export default function AssessmentPage() {
  const [phase, setPhase] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [phq9Answers, setPhq9Answers] = useState(Array(PHQ9.length).fill(null));
  const [gad7Answers, setGad7Answers] = useState(Array(GAD7.length).fill(null));
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1);
  const { user, loading: authLoading, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!authLoading && !user && !isGuest) router.push('/login?redirect=/assessment'); }, [user, authLoading, isGuest]);

  const currentQuestions = phase === 0 ? PHQ9 : GAD7;
  const currentAnswers   = phase === 0 ? phq9Answers : gad7Answers;
  const totalQ           = PHQ9.length + GAD7.length;
  const answeredSoFar    = phq9Answers.filter(a => a !== null).length + gad7Answers.filter(a => a !== null).length;
  const progress         = phase < 2 ? Math.round((answeredSoFar / totalQ) * 100) : 100;

  const selectAnswer = (val) => {
    if (phase === 0) { const n = [...phq9Answers]; n[qIndex] = val; setPhq9Answers(n); }
    else             { const n = [...gad7Answers];  n[qIndex] = val; setGad7Answers(n); }
    setTimeout(() => {
      setDirection(1);
      if (qIndex < currentQuestions.length - 1) setQIndex(qIndex + 1);
      else if (phase === 0) { setPhase(1); setQIndex(0); }
      else finishAssessment();
    }, 280);
  };

  const goBack = () => {
    setDirection(-1);
    if (qIndex > 0) setQIndex(qIndex - 1);
    else if (phase === 1) { setPhase(0); setQIndex(PHQ9.length - 1); }
  };

  const finishAssessment = async () => {
    const phq9Total = phq9Answers.reduce((s, v) => s + (v ?? 0), 0);
    const gad7Total = gad7Answers.reduce((s, v) => s + (v ?? 0), 0);
    const recs = [];
    if (phq9Total >= 10) recs.push("Consider consulting a mental health professional about depression symptoms");
    if (phq9Total >= 5)  recs.push("Practice self-care — regular exercise and healthy sleep schedules help");
    if (gad7Total >= 10) recs.push("Consider speaking to a professional about anxiety symptoms");
    if (gad7Total >= 5)  recs.push("Try deep breathing exercises when feeling anxious");
    recs.push("Track your mood daily to identify patterns and triggers");
    recs.push("Maintain social connections and reach out for support");

    const res = {
      phq9Score: phq9Total, gad7Score: gad7Total,
      depressionSeverity: getSeverity(phq9Total, 'phq9').text,
      anxietySeverity: getSeverity(gad7Total, 'gad7').text,
      recommendations: recs,
      suicideRisk: (phq9Answers[8] ?? 0) >= 1,
      urgentMessage: (phq9Answers[8] ?? 0) >= 1 ? "Your responses indicate you may be having thoughts of self-harm. Please contact a crisis line immediately." : null,
      date: new Date().toISOString(),
    };
    setResults(res); setPhase(2);

    // Guests see their results computed live, but nothing is saved.
    if (isGuest && !user) return;

    setSaving(true);
    try {
      await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phq9Score: phq9Total, gad7Score: gad7Total, depressionSeverity: res.depressionSeverity, anxietySeverity: res.anxietySeverity, phq9Answers, gad7Answers, date: res.date, scores: { phq9: phq9Total, gad7: gad7Total } }),
      });
    } catch {} finally { setSaving(false); }
  };

  const restart = () => {
    setPhq9Answers(Array(PHQ9.length).fill(null)); setGad7Answers(Array(GAD7.length).fill(null));
    setResults(null); setPhase(0); setQIndex(0); setDirection(1);
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!user && !isGuest) return null;

  const phq9Sev = results ? getSeverity(results.phq9Score, 'phq9') : null;
  const gad7Sev = results ? getSeverity(results.gad7Score, 'gad7') : null;

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col items-center justify-center px-4 py-12">
      {/* Soft blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob blob-brand w-96 h-96 -top-24 -right-24 opacity-30" />
        <div className="blob blob-mint w-72 h-72 bottom-10 left-5 opacity-25" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo bar */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-brand shadow-brand">
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-ink-1">Mental Health Assessment</span>
        </div>

        {/* Progress */}
        {phase < 2 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-ink-4 mb-2">
              <span>{phase === 0 ? 'Depression (PHQ-9)' : 'Anxiety (GAD-7)'}</span>
              <span>{answeredSoFar}/{totalQ} completed</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-brand" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
            <div className="flex items-center justify-center gap-5 mt-4">
              {['Depression (PHQ-9)', 'Anxiety (GAD-7)', 'Results'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < phase  ? 'bg-mint-500 text-white'
                    : i === phase ? 'bg-gradient-brand text-white shadow-brand'
                    : 'bg-surface-2 text-ink-4 border border-surface-border'
                  }`}>
                    {i < phase ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:inline font-medium ${i === phase ? 'text-brand-600' : 'text-ink-4'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card */}
        <div className="card overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {phase < 2 ? (
              <motion.div key={`${phase}-${qIndex}`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 32 : -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -32 : 32 }}
                transition={{ duration: 0.22 }}
                className="p-8">

                <div className="flex items-center gap-2 mb-4">
                  <span className={`badge ${phase === 0 ? 'badge-brand' : 'badge-calm'}`}>
                    Q{phase === 0 ? qIndex + 1 : PHQ9.length + qIndex + 1}
                  </span>
                  <span className="text-xs text-ink-4">Over the past 2 weeks, how often have you been bothered by…</span>
                </div>

                <h2 className="font-display font-bold text-xl text-ink-1 mb-8 leading-snug">
                  {currentQuestions[qIndex]}
                </h2>

                <div className="grid gap-3">
                  {FREQ.map((opt) => {
                    const selected = currentAnswers[qIndex] === opt.value;
                    return (
                      <motion.button key={opt.value} onClick={() => selectAnswer(opt.value)}
                        whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                        className={`w-full text-left px-5 py-4 rounded-xl flex items-center gap-4 transition-all border ${
                          selected
                            ? phase === 0 ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-calm-50 border-calm-300 text-calm-700'
                            : 'bg-surface-1 border-surface-border text-ink-2 hover:border-brand-200 hover:bg-brand-50/40'
                        }`}>
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                          selected ? (phase === 0 ? 'border-brand-500 bg-brand-500' : 'border-calm-500 bg-calm-500') : 'border-surface-border-strong'
                        }`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="font-medium text-sm">{opt.label}</span>
                        <span className="ml-auto text-xs text-ink-4">{opt.value} pts</span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-border">
                  <button onClick={goBack} disabled={phase === 0 && qIndex === 0}
                    className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink-1 transition-colors disabled:opacity-30">
                    <ArrowLeft size={14} /> Back
                  </button>
                  {currentAnswers[qIndex] !== null && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => selectAnswer(currentAnswers[qIndex])}
                      className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                      Next <ArrowRight size={14} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-8">
                {/* Crisis alert */}
                {results?.urgentMessage && (
                  <div className="flex items-start gap-3 px-4 py-4 rounded-xl mb-6 bg-rose-50 border border-rose-200">
                    <AlertTriangle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-rose-700 text-sm font-medium">{results.urgentMessage}</p>
                      <p className="text-rose-600 font-bold text-sm mt-1">Crisis line: 988 or 1-800-273-8255</p>
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-mint-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} className="text-mint-600" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-ink-1">Assessment Complete</h2>
                  <p className="text-ink-3 text-sm mt-1">Here are your results based on your responses</p>
                  {saving && <p className="text-ink-4 text-xs mt-1">Saving results…</p>}
                </div>

                {/* Score cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Depression', key: 'phq9Score', max: 27, sev: phq9Sev },
                    { label: 'Anxiety',    key: 'gad7Score', max: 21, sev: gad7Sev },
                  ].map(card => (
                    <div key={card.key} className={`rounded-2xl p-5 border ${card.sev?.bg} ${card.sev?.border}`}>
                      <p className="text-xs text-ink-4 font-medium mb-1">{card.label}</p>
                      <div className="flex items-end gap-1 mb-2">
                        <span className="font-display font-bold text-3xl" style={{ color: card.sev?.color }}>{results?.[card.key]}</span>
                        <span className="text-ink-4 text-sm mb-1">/ {card.max}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/60 overflow-hidden mb-2">
                        <motion.div className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${((results?.[card.key] ?? 0) / card.max) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          style={{ background: card.sev?.color }} />
                      </div>
                      <span className={`badge ${card.sev?.badge} text-2xs`}>{card.sev?.text}</span>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {results?.recommendations?.length > 0 && (
                  <div className="rounded-2xl p-4 mb-6 bg-mint-50 border border-mint-200">
                    <p className="text-mint-700 font-semibold text-sm mb-3 flex items-center gap-2">
                      <CheckCircle size={13} /> Personalized Recommendations
                    </p>
                    <ul className="space-y-2">
                      {results.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-ink-2 flex items-start gap-2">
                          <span className="text-mint-500 mt-0.5 flex-shrink-0">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-ink-4 mb-6 text-center">
                  This is not a diagnostic tool. Always consult a healthcare professional for medical advice.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={restart}
                    className="flex-1 btn-secondary gap-2 py-2.5 text-sm justify-center">
                    <RotateCcw size={13} /> Retake
                  </button>
                  <button onClick={() => router.push('/mood')}
                    className="flex-1 btn-soft gap-2 py-2.5 text-sm justify-center">
                    <Smile size={13} /> Track Mood
                  </button>
                  <button onClick={() => router.push('/resources')}
                    className="flex-1 btn-primary gap-2 py-2.5 text-sm justify-center">
                    <BookOpen size={13} /> Resources
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
