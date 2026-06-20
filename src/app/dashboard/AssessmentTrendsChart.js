'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

const severity = (score, max) => score >= max * 0.74 ? 'Severe' : score >= max * 0.37 ? 'Moderate' : score >= max * 0.19 ? 'Mild' : 'Minimal';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const phq9 = payload.find(p => p.dataKey === 'phq9');
  const gad7 = payload.find(p => p.dataKey === 'gad7');
  return (
    <div className="bg-white border border-surface-border rounded-xl shadow-lg px-3.5 py-3 text-xs" style={{ minWidth: 168 }}>
      <p className="text-ink-4 mb-2">{label}</p>
      {phq9 && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />PHQ-9
          </span>
          <span className="font-bold text-brand-600">{phq9.value} <span className="font-normal text-ink-4">({severity(phq9.value, 27)})</span></span>
        </div>
      )}
      {gad7 && (
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className="w-2 h-2 rounded-full bg-calm-500 inline-block" />GAD-7
          </span>
          <span className="font-bold text-calm-600">{gad7.value} <span className="font-normal text-ink-4">({severity(gad7.value, 21)})</span></span>
        </div>
      )}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-6 mt-1">
    {payload?.map(e => (
      <span key={e.dataKey} className="flex items-center gap-1.5 text-xs text-ink-3">
        <span className="w-5 h-0.5 inline-block rounded" style={{ background: e.color }} />
        {e.dataKey === 'phq9' ? 'Depression (PHQ-9)' : 'Anxiety (GAD-7)'}
      </span>
    ))}
  </div>
);

export default function AssessmentTrendsChart({ assessmentData }) {
  const sorted = [...assessmentData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const data = sorted.map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    phq9: e.scores?.phq9 ?? null,
    gad7: e.scores?.gad7 ?? null,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 27]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
        <Legend content={<CustomLegend />} />
        <ReferenceLine y={5}  stroke="#fde68a" strokeDasharray="3 3" label={{ value: 'Mild',     position: 'insideTopRight', fill: '#d97706', fontSize: 9 }} />
        <ReferenceLine y={10} stroke="#fed7aa" strokeDasharray="3 3" label={{ value: 'Moderate', position: 'insideTopRight', fill: '#ea580c', fontSize: 9 }} />
        <ReferenceLine y={15} stroke="#fecdd3" strokeDasharray="3 3" label={{ value: 'Severe',   position: 'insideTopRight', fill: '#e11d48', fontSize: 9 }} />
        <Line type="monotone" dataKey="phq9" stroke="#6366f1" strokeWidth={2.5}
          dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#6366f1', stroke: '#c7d2fe', strokeWidth: 3 }} connectNulls />
        <Line type="monotone" dataKey="gad7" stroke="#8b5cf6" strokeWidth={2.5}
          dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#ddd6fe', strokeWidth: 3 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
