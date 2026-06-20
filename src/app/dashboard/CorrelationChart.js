'use client';

import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-surface-border rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-ink-4">Mood: <span className="text-ink-1 font-bold">{d.mood}/10</span></p>
      <p className="text-ink-4">{d.type === 'phq9' ? 'PHQ-9' : 'GAD-7'}: <span className="text-brand-600 font-bold">{d.score}</span></p>
      <p className="text-ink-5">{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
    </div>
  );
};

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  const num = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, v) => s + (v - mx) ** 2, 0) * ys.reduce((s, v) => s + (v - my) ** 2, 0));
  return den === 0 ? 0 : num / den;
}

export default function CorrelationChart({ moodData = [], assessmentData = [] }) {
  const [type, setType] = useState('phq9');

  const { data, r } = useMemo(() => {
    const pts = [];
    moodData.forEach(mood => {
      const mDate = new Date(mood.createdAt).toDateString();
      const match = assessmentData.find(a => new Date(a.date).toDateString() === mDate);
      if (match) {
        const score = type === 'phq9' ? (match.scores?.phq9 ?? match.phq9Score) : (match.scores?.gad7 ?? match.gad7Score);
        if (score != null) pts.push({ mood: mood.mood, score, date: mood.createdAt, type });
      }
    });
    const r = pearson(pts.map(p => p.mood), pts.map(p => p.score));
    return { data: pts, r };
  }, [moodData, assessmentData, type]);

  const rLabel = Math.abs(r) > 0.7 ? 'Strong' : Math.abs(r) > 0.4 ? 'Moderate' : 'Weak';
  const rBadge = r < -0.4 ? 'badge-mint' : r > 0.4 ? 'badge-rose' : 'badge-slate';

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['phq9', 'gad7'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                type === t
                  ? 'bg-gradient-brand text-white shadow-brand'
                  : 'bg-surface-2 text-ink-3 border border-surface-border hover:border-brand-200'
              }`}>
              {t === 'phq9' ? 'Depression' : 'Anxiety'}
            </button>
          ))}
        </div>
        {data.length > 1 && (
          <span className={`badge ${rBadge}`}>{rLabel} (r={r.toFixed(2)})</span>
        )}
      </div>
      <div className="flex-1">
        {data.length < 2 ? (
          <div className="flex items-center justify-center h-full text-ink-4 text-sm">Not enough overlapping data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mood" type="number" domain={[1, 10]} name="Mood"
                tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                label={{ value: 'Mood Score', position: 'insideBottom', fill: '#94a3b8', fontSize: 10, dy: 12 }} />
              <YAxis dataKey="score" type="number" name={type === 'phq9' ? 'PHQ-9' : 'GAD-7'}
                tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#e2e8f0' }} />
              <Scatter data={data} fill="#6366f1" fillOpacity={0.7} r={5} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
