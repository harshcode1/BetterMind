'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Flame, Target, TrendingDown, ClipboardList, BarChart2, Award } from 'lucide-react';

const ICONS = {
  mood: Star,
  assessment: ClipboardList,
  streak: Flame,
  count: Target,
  improvement: TrendingDown,
  severity: BarChart2,
};

const STYLES = {
  mood:        { iconBox: 'icon-box-calm',  iconColor: 'text-calm-600' },
  assessment:  { iconBox: 'icon-box-brand', iconColor: 'text-brand-600' },
  streak:      { iconBox: 'icon-box-warm',  iconColor: 'text-warm-500' },
  count:       { iconBox: 'icon-box-mint',  iconColor: 'text-mint-600' },
  improvement: { iconBox: 'icon-box-mint',  iconColor: 'text-mint-600' },
  severity:    { iconBox: 'icon-box-calm',  iconColor: 'text-calm-600' },
};

function generateMilestones(moods = [], assessments = []) {
  const list = [];

  if (moods.length > 0) {
    const first = moods.reduce((e, m) => new Date(m.createdAt) < new Date(e.createdAt) ? m : e, moods[0]);
    list.push({ id: 'first-mood', type: 'mood', title: 'First Mood Entry', desc: 'Started tracking your mood', date: first.createdAt });
  }
  if (assessments.length > 0) {
    const first = assessments.reduce((e, a) => new Date(a.date) < new Date(e.date) ? a : e, assessments[0]);
    list.push({ id: 'first-assess', type: 'assessment', title: 'First Assessment', desc: 'Completed your first mental health check', date: first.date });
  }
  if (moods.length >= 7) {
    const sorted = [...moods].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let streak = 1, maxStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i].createdAt) - new Date(sorted[i - 1].createdAt)) / 86400000;
      streak = diff <= 1.5 ? streak + 1 : 1;
      if (streak > maxStreak) maxStreak = streak;
    }
    if (maxStreak >= 7) list.push({ id: 'week-streak', type: 'streak', title: '7-Day Streak', desc: 'Tracked mood 7 days in a row', date: sorted[6].createdAt });
  }
  if (moods.length >= 30) {
    const sorted = [...moods].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    list.push({ id: '30-moods', type: 'count', title: '30 Mood Entries', desc: 'Recorded 30 mood check-ins', date: sorted[29].createdAt });
  }
  if (assessments.length >= 2) {
    const sorted = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], curr = sorted[i];
      if ((prev.scores?.phq9 ?? prev.phq9Score ?? 0) - (curr.scores?.phq9 ?? curr.phq9Score ?? 0) >= 5) {
        list.push({ id: 'phq9-improve', type: 'improvement', title: 'Depression Improvement', desc: 'PHQ-9 score dropped by 5+ points', date: curr.date });
        break;
      }
    }
  }

  return list.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export default function MilestoneTracker({ moodData = [], assessmentData = [] }) {
  const milestones = useMemo(() => generateMilestones(moodData, assessmentData), [moodData, assessmentData]);

  if (!milestones.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Award size={28} className="text-ink-4" /></div>
        <p className="text-ink-3 text-sm">Keep tracking to unlock milestones</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-80 pr-1">
      {milestones.map((m, i) => {
        const Icon = ICONS[m.type] || Star;
        const { iconBox, iconColor } = STYLES[m.type] || STYLES.mood;
        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-1 border border-surface-border"
          >
            <div className={`icon-box w-9 h-9 rounded-xl flex-shrink-0 ${iconBox}`}>
              <Icon size={15} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ink-1 text-sm font-semibold leading-tight">{m.title}</p>
              <p className="text-ink-4 text-xs mt-0.5">{m.desc}</p>
            </div>
            <p className="text-ink-5 text-xs flex-shrink-0 mt-0.5">
              {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
