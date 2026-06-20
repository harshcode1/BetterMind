'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, X, Plus, Send, Calendar, TrendingUp, Smile } from 'lucide-react';
import { demoMoods } from '../lib/demoData';

const MOODS = [
  { emoji: '😭', label: 'Terrible',  color: '#f43f5e' },
  { emoji: '😢', label: 'Very Sad',  color: '#fb7185' },
  { emoji: '😟', label: 'Sad',       color: '#f97316' },
  { emoji: '😕', label: 'Down',      color: '#fb923c' },
  { emoji: '😐', label: 'Neutral',   color: '#eab308' },
  { emoji: '🙂', label: 'Okay',      color: '#84cc16' },
  { emoji: '😊', label: 'Good',      color: '#22c55e' },
  { emoji: '😄', label: 'Happy',     color: '#10b981' },
  { emoji: '🥳', label: 'Great',     color: '#06b6d4' },
  { emoji: '😍', label: 'Amazing',   color: '#6366f1' },
];

const ACTIVITIES = [
  'Exercise', 'Work', 'Study', 'Family Time', 'Social Event',
  'Relaxation', 'Meditation', 'Reading', 'Outdoor Activity', 'Travel',
  'Creative Activity', 'Entertainment', 'Chores', 'Therapy', 'Self-care',
  'Cooking', 'Music', 'Gaming',
];

const TIMEFRAMES = [{ label: '7D', value: '7' }, { label: '30D', value: '30' }, { label: '90D', value: '90' }];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const m = MOODS[payload[0].value - 1];
  return (
    <div className="bg-white border border-surface-border rounded-xl shadow-lg px-3.5 py-3 text-xs">
      <p className="text-ink-4 mb-1">{label}</p>
      <p className="text-lg">{m?.emoji} <span className="font-bold" style={{ color: m?.color }}>{payload[0].value}/10</span></p>
      <p className="text-ink-4">{m?.label}</p>
    </div>
  );
};

export default function MoodPage() {
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');
  const [activities, setActivities] = useState([]);
  const [customActivity, setCustomActivity] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('30');
  const { user, loading: authLoading, isGuest, requireRealUser } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!authLoading && !user && !isGuest) router.push('/login?redirect=/mood'); }, [user, authLoading, isGuest]);
  useEffect(() => {
    if (user) fetchHistory();
    else if (isGuest) { setMoodHistory(demoMoods(parseInt(timeframe))); setLoading(false); }
  }, [user, isGuest, timeframe]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mood?days=${timeframe}`);
      if (res.ok) { const d = await res.json(); setMoodHistory(d.moods || []); }
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Guests can't persist — prompt them to sign in.
    if (!requireRealUser('save your mood')) return;
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: parseInt(mood), notes, activities }),
      });
      if (res.ok) {
        setSuccess(true); setMood(5); setNotes(''); setActivities([]);
        fetchHistory();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const d = await res.json(); setError(d.error || 'Failed to record mood');
      }
    } catch { setError('An unexpected error occurred'); }
    finally { setSubmitting(false); }
  };

  const toggleActivity = (a) => setActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const addCustom = () => {
    if (customActivity.trim() && !activities.includes(customActivity.trim())) {
      setActivities(prev => [...prev, customActivity.trim()]); setCustomActivity('');
    }
  };

  const chartData = [...moodHistory]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(e => ({ date: new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), mood: e.mood }));

  const avgMood = moodHistory.length ? (moodHistory.reduce((s, e) => s + e.mood, 0) / moodHistory.length).toFixed(1) : null;
  const currentMood = MOODS[mood - 1];

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!user && !isGuest) return null;

  return (
    <div className="min-h-screen bg-surface-1 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="font-display font-bold text-3xl text-ink-1 mb-1.5">Mood Tracker</h1>
          <p className="text-ink-3 text-sm">Track how you feel and discover patterns in your wellbeing</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Entry Form ── */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}
            className="lg:col-span-2 card p-6 flex flex-col gap-5">
            <h2 className="font-display font-semibold text-ink-1">How are you feeling?</h2>

            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-mint-700 bg-mint-50 border border-mint-200">
                  <CheckCircle size={14} /> Mood recorded!
                </motion.div>
              )}
              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-rose-600 bg-rose-50 border border-rose-200">
                  <X size={14} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Emoji display */}
              <div className="flex flex-col items-center py-6 bg-surface-2 rounded-2xl">
                <motion.div key={mood}
                  initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="text-6xl mb-2 select-none">
                  {currentMood.emoji}
                </motion.div>
                <motion.p key={`label-${mood}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="font-display font-bold text-lg" style={{ color: currentMood.color }}>
                  {currentMood.label}
                </motion.p>
                <p className="text-ink-4 text-sm mt-0.5">{mood}/10</p>
              </div>

              {/* Slider */}
              <div className="px-1">
                <div className="relative h-8 flex items-center">
                  <div className="absolute inset-x-0 h-2 rounded-full"
                    style={{ background: 'linear-gradient(to right, #f43f5e, #eab308, #10b981, #6366f1)' }} />
                  <input type="range" min="1" max="10" value={mood}
                    onChange={e => setMood(parseInt(e.target.value))}
                    className="relative w-full h-2 rounded-full appearance-none cursor-pointer bg-transparent"
                    style={{ '--thumb-color': currentMood.color }}
                  />
                </div>
                <div className="flex justify-between text-xs text-ink-4 mt-1.5">
                  <span>1</span><span>5</span><span>10</span>
                </div>
              </div>

              {/* Activities */}
              <div>
                <p className="text-sm text-ink-2 font-medium mb-2.5">What have you been doing?</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {ACTIVITIES.map(a => (
                    <button key={a} type="button" onClick={() => toggleActivity(a)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                        activities.includes(a)
                          ? 'bg-brand-500 text-white shadow-brand'
                          : 'bg-surface-2 text-ink-3 border border-surface-border hover:border-brand-200 hover:text-brand-600'
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={customActivity} onChange={e => setCustomActivity(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                    placeholder="Custom activity..." className="input flex-1 text-sm py-2" />
                  <button type="button" onClick={addCustom}
                    className="px-3 rounded-xl bg-surface-2 text-ink-3 hover:text-brand-600 hover:bg-brand-50 border border-surface-border transition-colors">
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-sm text-ink-2 font-medium mb-2">Notes (optional)</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Anything on your mind today?"
                  className="input w-full resize-none text-sm" />
              </div>

              <motion.button type="submit" disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.01 }} whileTap={{ scale: submitting ? 1 : 0.99 }}
                className="btn-primary py-3 gap-2 text-sm font-semibold justify-center">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
                  : <><Send size={15} /> Record Mood</>}
              </motion.button>
            </form>
          </motion.div>

          {/* ── Chart & Stats ── */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
            className="lg:col-span-3 flex flex-col gap-5">

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Calendar,   label: 'Entries',  value: moodHistory.length },
                { icon: TrendingUp, label: 'Avg Mood', value: avgMood ? `${avgMood}/10` : '—' },
                { icon: Smile,      label: 'Best',     value: moodHistory.length ? `${Math.max(...moodHistory.map(e => e.mood))}/10` : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="card p-4 text-center">
                  <Icon size={16} className="text-brand-500 mx-auto mb-2" />
                  <p className="font-display font-bold text-xl text-ink-1">{value}</p>
                  <p className="text-ink-4 text-xs">{label}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="card p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-ink-1 text-sm">Mood Over Time</h3>
                <div className="flex items-center gap-1.5">
                  {TIMEFRAMES.map(t => (
                    <button key={t.value} onClick={() => setTimeframe(t.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        timeframe === t.value ? 'bg-gradient-brand text-white' : 'bg-surface-2 text-ink-3 border border-surface-border hover:border-brand-200'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-44">
                  <div className="w-7 h-7 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-44 text-center gap-2">
                  <Smile size={32} className="text-ink-5" />
                  <p className="text-ink-4 text-sm">No mood data yet — record your first entry!</p>
                </div>
              ) : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodHistGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"  stopColor="#6366f1" stopOpacity={0.20} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={[1, 10]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#c7d2fe', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2.5} fill="url(#moodHistGrad)"
                        dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#6366f1', stroke: '#c7d2fe', strokeWidth: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Recent entries */}
            {moodHistory.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-semibold text-ink-1 text-sm mb-3">Recent Entries</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {[...moodHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8).map((entry, i) => {
                    const m = MOODS[entry.mood - 1];
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-1 border border-surface-border">
                        <span className="text-xl">{m?.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: m?.color }}>{m?.label}</p>
                          {entry.activities?.length > 0 && (
                            <p className="text-xs text-ink-4 truncate">{entry.activities.slice(0, 3).join(', ')}</p>
                          )}
                        </div>
                        <p className="text-xs text-ink-5 flex-shrink-0">
                          {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--thumb-color, #6366f1);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15), 0 2px 6px rgba(0,0,0,0.12);
          cursor: pointer;
          transition: box-shadow 0.15s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 5px rgba(99,102,241,0.20), 0 2px 6px rgba(0,0,0,0.12);
        }
        input[type='range']::-moz-range-thumb {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--thumb-color, #6366f1);
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
