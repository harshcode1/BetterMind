'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-surface-border rounded-xl shadow-lg px-3.5 py-3 text-xs" style={{ minWidth: 160 }}>
      <p className="text-ink-1 font-semibold mb-1">{d.name}</p>
      <p className="text-ink-3">Avg mood: <span className="text-brand-600 font-bold">{d.avgMood.toFixed(1)}/10</span></p>
      <p className="text-ink-3">Impact: <span className={`font-bold ${d.impact >= 0 ? 'text-mint-600' : 'text-rose-500'}`}>{d.impact >= 0 ? '+' : ''}{d.impact.toFixed(1)}</span></p>
      <p className="text-ink-4 mt-0.5">{d.count} entries</p>
    </div>
  );
};

export default function ActivityImpactChart({ moodData }) {
  const [sortBy, setSortBy] = useState('impact');

  const data = useMemo(() => {
    if (!moodData?.length) return [];
    const overallAvg = moodData.reduce((s, e) => s + e.mood, 0) / moodData.length;
    const map = {};
    moodData.forEach(entry => {
      (entry.activities || []).forEach(act => {
        if (!map[act]) map[act] = { name: act, count: 0, moodSum: 0 };
        map[act].count++;
        map[act].moodSum += entry.mood;
      });
    });
    let arr = Object.values(map)
      .filter(a => a.count >= 2)
      .map(a => ({ ...a, avgMood: a.moodSum / a.count, impact: a.moodSum / a.count - overallAvg }));
    if (sortBy === 'impact') arr.sort((a, b) => b.impact - a.impact);
    else if (sortBy === 'frequency') arr.sort((a, b) => b.count - a.count);
    else arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr.slice(0, 12);
  }, [moodData, sortBy]);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-2">
        {['impact', 'frequency', 'alphabetical'].map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
              sortBy === s ? 'bg-gradient-brand text-white' : 'bg-surface-2 text-ink-3 border border-surface-border hover:text-ink-2'
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={76} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <ReferenceLine x={0} stroke="#e2e8f0" />
            <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i}
                  fill={entry.impact >= 0 ? '#10b981' : '#f43f5e'}
                  fillOpacity={0.65 + Math.min(Math.abs(entry.impact) / 3, 0.35)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
