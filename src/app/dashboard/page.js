'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Brain, TrendingUp, TrendingDown, Smile, BarChart3,
  Zap, Plus, ChevronRight, Sparkles, AlertCircle, MessageSquare
} from 'lucide-react';
import MoodTrendsChart from './MoodTrendsChart';
import AssessmentTrendsChart from './AssessmentTrendsChart';
import ActivityImpactChart from './ActivityImpactChart';
import MilestoneTracker from './MilestoneTracker';
import { demoMoods, demoAssessments } from '../lib/demoData';

function StatCard({ label, value, sub, subPositive, icon: Icon, iconBoxClass, iconColorClass, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`icon-box ${iconBoxClass}`}>
          <Icon size={18} className={iconColorClass} />
        </div>
        {sub !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${subPositive ? 'text-mint-600 bg-mint-50' : 'text-rose-500 bg-rose-50'}`}>
            {subPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(parseFloat(sub || 0)).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-ink-4 text-xs font-medium mb-1">{label}</p>
      <p className="font-display font-bold text-2xl text-ink-1">{value}</p>
      {sub !== undefined && <p className="text-ink-5 text-xs mt-1">vs last period</p>}
    </motion.div>
  );
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardPage() {
  const [moodData, setMoodData] = useState([]);
  const [assessmentData, setAssessmentData] = useState([]);
  const [timeframe, setTimeframe] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { user, loading: authLoading, isDoctor, isAdmin, isVerifiedDoctor, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user && !isGuest) router.push('/login?redirect=/dashboard');
      else if (user && isAdmin?.()) router.push('/admin/dashboard');
      else if (user && isVerifiedDoctor?.()) router.push('/doctor/dashboard');
      else if (user && isDoctor?.() && !user.verified) router.push('/doctor/verification');
    }
  }, [user, authLoading, isGuest]);

  useEffect(() => {
    if (user) fetchData();
    else if (isGuest) {
      setMoodData(demoMoods(parseInt(timeframe)));
      setAssessmentData(demoAssessments());
      setLoading(false);
    }
  }, [user, isGuest, timeframe]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [moodRes, assessRes] = await Promise.all([
        fetch(`/api/mood?days=${timeframe}`),
        fetch(`/api/assessment?limit=50`),
      ]);
      const moodJson  = await moodRes.json();
      const assessJson = await assessRes.json();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(timeframe));
      setMoodData(moodJson.moods || []);
      setAssessmentData((assessJson.assessments || []).filter(a => new Date(a.date) >= cutoff));
    } catch { setError('Failed to load dashboard data'); }
    finally { setLoading(false); }
  };

  const stats = (() => {
    if (!moodData.length) return { avgMood: '—', moodChange: 0, avgPhq9: '—', avgGad7: '—', phq9Change: 0, gad7Change: 0, topActivities: [], insights: [] };
    const avgMood = (moodData.reduce((s, e) => s + e.mood, 0) / moodData.length).toFixed(1);
    const week = 7 * 86400000;
    const thisWeek = moodData.filter(e => Date.now() - new Date(e.createdAt) < week);
    const lastWeek = moodData.filter(e => { const d = Date.now() - new Date(e.createdAt); return d >= week && d < 2 * week; });
    const twAvg = thisWeek.length ? thisWeek.reduce((s, e) => s + e.mood, 0) / thisWeek.length : 0;
    const lwAvg = lastWeek.length ? lastWeek.reduce((s, e) => s + e.mood, 0) / lastWeek.length : 0;
    const moodChange = lwAvg ? ((twAvg - lwAvg) / lwAvg * 100).toFixed(1) : 0;
    const avgPhq9 = assessmentData.length ? (assessmentData.reduce((s, e) => s + e.phq9Score, 0) / assessmentData.length).toFixed(1) : '—';
    const avgGad7 = assessmentData.length ? (assessmentData.reduce((s, e) => s + e.gad7Score, 0) / assessmentData.length).toFixed(1) : '—';
    const l = assessmentData[assessmentData.length - 1], p = assessmentData[assessmentData.length - 2];
    const phq9Change = l && p ? ((l.phq9Score - p.phq9Score) / p.phq9Score * 100).toFixed(1) : 0;
    const gad7Change = l && p ? ((l.gad7Score - p.gad7Score) / p.gad7Score * 100).toFixed(1) : 0;
    const actMap = {};
    moodData.forEach(e => e.activities?.forEach(a => actMap[a] = (actMap[a] || 0) + 1));
    const topActivities = Object.entries(actMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([activity, count]) => ({ activity, count }));
    const insights = [];
    if (moodChange > 10) insights.push({ text: 'Your mood has improved significantly this week! Keep it up.', type: 'positive' });
    else if (moodChange < -10) insights.push({ text: 'Your mood has dipped this week. Consider reviewing your self-care routine.', type: 'warning' });
    if (phq9Change < -10) insights.push({ text: 'Depression symptoms improving since last assessment.', type: 'positive' });
    if (gad7Change < -10) insights.push({ text: 'Anxiety symptoms improving since last assessment.', type: 'positive' });
    if (topActivities.length) insights.push({ text: `Most tracked activity: ${topActivities[0].activity} (${topActivities[0].count}×)`, type: 'info' });
    return { avgMood, moodChange, avgPhq9, avgGad7, phq9Change, gad7Change, topActivities, insights };
  })();

  const tabs = [
    { id: 'overview',    label: 'Overview' },
    { id: 'mood',        label: 'Mood Analysis' },
    { id: 'milestones',  label: 'Milestones' },
  ];

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1">
      <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!user && !isGuest) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-ink-4 text-sm mb-0.5">
            {greeting()},
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="font-display font-bold text-2xl text-ink-1">
            {(user?.name?.split(' ')[0]) || 'Guest'}&rsquo;s <span className="gradient-text">Dashboard</span>
          </motion.h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
            className="input text-sm py-2 px-4 w-auto"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
          </select>
          <Link href="/mood" className="btn-primary py-2 px-4 text-sm gap-1.5">
            <Plus size={14} /> Log Mood
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm text-rose-600 bg-rose-50 border border-rose-200">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Avg Mood" value={stats.avgMood === '—' ? '—' : `${stats.avgMood}/10`}
          sub={stats.moodChange} subPositive={parseFloat(stats.moodChange) >= 0}
          icon={Smile} iconBoxClass="icon-box-calm" iconColorClass="text-calm-600" delay={0} />
        <StatCard label="PHQ-9 Score" value={stats.avgPhq9 === '—' ? '—' : `${stats.avgPhq9}/27`}
          sub={stats.phq9Change} subPositive={parseFloat(stats.phq9Change) <= 0}
          icon={Brain} iconBoxClass="icon-box-brand" iconColorClass="text-brand-600" delay={0.08} />
        <StatCard label="GAD-7 Score" value={stats.avgGad7 === '—' ? '—' : `${stats.avgGad7}/21`}
          sub={stats.gad7Change} subPositive={parseFloat(stats.gad7Change) <= 0}
          icon={Activity} iconBoxClass="icon-box-rose" iconColorClass="text-rose-500" delay={0.16} />
        <StatCard label="Mood Entries" value={moodData.length}
          icon={BarChart3} iconBoxClass="icon-box-mint" iconColorClass="text-mint-600" delay={0.24} />
      </div>

      {/* Tabs */}
      <div className="tab-bar w-fit mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
        </div>
      ) : !moodData.length && !assessmentData.length ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-16">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Sparkles size={28} className="text-brand-500" />
            </div>
            <h2 className="font-display font-bold text-xl text-ink-1">No data yet</h2>
            <p className="text-ink-3 text-sm max-w-xs">Start tracking your mood and taking assessments to see beautiful visualizations and AI-powered insights.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link href="/mood" className="btn-primary gap-2"><Activity size={15} /> Log First Mood</Link>
              <Link href="/assessment" className="btn-secondary gap-2"><Brain size={15} /> Take Assessment</Link>
            </div>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="grid lg:grid-cols-2 gap-5">
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-ink-1 text-sm mb-4 flex items-center gap-2">
                    <TrendingUp size={15} className="text-brand-500" /> Mood Trends
                  </h3>
                  <div className="h-60">
                    {moodData.length > 0
                      ? <MoodTrendsChart moodData={moodData} />
                      : <div className="flex items-center justify-center h-full text-ink-4 text-sm">No mood data yet</div>}
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-ink-1 text-sm mb-4 flex items-center gap-2">
                    <Brain size={15} className="text-calm-500" /> Assessment Trends
                  </h3>
                  <div className="h-60">
                    {assessmentData.length > 0
                      ? <AssessmentTrendsChart assessmentData={assessmentData} />
                      : <div className="flex items-center justify-center h-full text-ink-4 text-sm">No assessment data yet</div>}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                {/* AI Insights */}
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-ink-1 text-sm mb-4 flex items-center gap-2">
                    <Zap size={15} className="text-amber-500" /> AI Insights
                  </h3>
                  {stats.insights.length > 0 ? (
                    <div className="space-y-2.5">
                      {stats.insights.map((insight, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                          className={`flex items-start gap-3 p-3 rounded-xl text-sm border ${
                            insight.type === 'positive' ? 'bg-mint-50 border-mint-100 text-mint-700'
                            : insight.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700'
                            : 'bg-brand-50 border-brand-100 text-brand-700'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            insight.type === 'positive' ? 'bg-mint-500'
                            : insight.type === 'warning' ? 'bg-amber-500'
                            : 'bg-brand-500'
                          }`} />
                          {insight.text}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-ink-4 text-sm">Record more data to unlock personalized insights.</p>
                  )}
                </div>

                {/* Top Activities */}
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-ink-1 text-sm mb-4 flex items-center gap-2">
                    <Activity size={15} className="text-mint-500" /> Top Activities
                  </h3>
                  {stats.topActivities.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topActivities.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-ink-2 text-sm w-28 flex-shrink-0 truncate">{item.activity}</span>
                          <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / stats.topActivities[0].count) * 100}%` }}
                              transition={{ delay: i * 0.1, duration: 0.5 }}
                              className="h-full rounded-full bg-gradient-brand"
                            />
                          </div>
                          <span className="text-ink-4 text-xs w-8 text-right flex-shrink-0">{item.count}×</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-ink-4 text-sm">No activities recorded yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'mood' && (
            <motion.div key="mood" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="card p-6">
                <h3 className="font-display font-semibold text-ink-1 text-sm mb-4">Detailed Mood Analysis</h3>
                <div className="h-80">
                  {moodData.length > 0 ? <MoodTrendsChart moodData={moodData} detailed /> : <div className="flex items-center justify-center h-full text-ink-4">No mood data</div>}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-display font-semibold text-ink-1 text-sm mb-4">Activity Impact on Mood</h3>
                <div className="h-80">
                  {moodData.length > 0 ? <ActivityImpactChart moodData={moodData} /> : <div className="flex items-center justify-center h-full text-ink-4">No data</div>}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'milestones' && (
            <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="card p-6">
                <h3 className="font-display font-semibold text-ink-1 text-sm mb-4">Progress & Milestones</h3>
                <div className="h-96">
                  <MilestoneTracker moodData={moodData} assessmentData={assessmentData} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/mood',       label: 'Log Mood',       icon: Smile,          iconBoxClass: 'icon-box-calm',  iconColorClass: 'text-calm-600' },
          { href: '/assessment', label: 'New Assessment',  icon: Brain,          iconBoxClass: 'icon-box-brand', iconColorClass: 'text-brand-600' },
          { href: '/chat',       label: 'AI Chat',         icon: MessageSquare,  iconBoxClass: 'icon-box-mint',  iconColorClass: 'text-mint-600' },
          { href: '/doctors',    label: 'Find Doctor',     icon: Activity,       iconBoxClass: 'icon-box-amber', iconColorClass: 'text-amber-600' },
        ].map(({ href, label, icon: Icon, iconBoxClass, iconColorClass }) => (
          <Link key={href} href={href}
            className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 group">
            <div className={`icon-box w-8 h-8 rounded-lg flex-shrink-0 ${iconBoxClass}`}>
              <Icon size={14} className={iconColorClass} />
            </div>
            <span className="text-sm text-ink-2 group-hover:text-ink-1 transition-colors font-medium">{label}</span>
            <ChevronRight size={13} className="ml-auto text-ink-5 group-hover:text-ink-3 transition-colors" />
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
