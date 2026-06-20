'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-border rounded-xl shadow-lg px-3.5 py-3 text-xs" style={{ minWidth: 140 }}>
      <p className="text-ink-4 mb-1">{label}</p>
      <p className="font-display font-bold text-base text-brand-600">
        {payload[0].value}<span className="text-ink-4 font-normal text-xs">/10</span>
      </p>
      {payload[0].payload.activities?.length > 0 && (
        <p className="text-ink-4 mt-1 text-xs">{payload[0].payload.activities.slice(0, 3).join(', ')}</p>
      )}
    </div>
  );
};

export default function MoodTrendsChart({ moodData, detailed }) {
  const sorted = [...moodData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const data = sorted.map(e => ({
    date: new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: e.mood,
    activities: e.activities,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#6366f1" stopOpacity={0.20} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={[1, 10]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c7d2fe', strokeWidth: 1 }} />
        <ReferenceLine y={5} stroke="#e2e8f0" strokeDasharray="4 4" />
        <Area
          type="monotone"
          dataKey="mood"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#moodGrad)"
          dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#6366f1', stroke: '#c7d2fe', strokeWidth: 3 }}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
