'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './contexts/AuthContext';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, ArrowRight, Shield, Activity, MessageSquare,
  Users, Star, ChevronDown, Zap, Heart, TrendingUp, Lock,
  CheckCircle2, PlayCircle, Eye
} from 'lucide-react';

/* ── Animated counter ──────────────────────────────────────── */
function Counter({ target, suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Soft hero illustration ─────────────────────────────────── */
function HeroIllustration() {
  return (
    <div className="relative w-full max-w-sm mx-auto select-none">
      {/* Soft background blobs */}
      <div className="absolute -top-8 -left-8 w-56 h-56 rounded-full bg-brand-100 opacity-60 animate-float" style={{ animationDuration: '9s' }} />
      <div className="absolute -bottom-6 -right-6 w-48 h-48 rounded-full bg-mint-100 opacity-50 animate-float-slow" style={{ animationDuration: '11s', animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-calm-100 opacity-40 animate-float" style={{ animationDuration: '13s', animationDelay: '-6s' }} />

      {/* Main card stack */}
      <div className="relative z-10 space-y-3">
        {/* Mood card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="card p-4 flex items-center gap-3"
        >
          <div className="icon-box icon-box-brand w-10 h-10 rounded-xl text-xl">😊</div>
          <div className="flex-1">
            <p className="text-xs text-ink-4 font-medium">Today&apos;s mood</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: '75%' }}
                  transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-brand"
                />
              </div>
              <span className="text-xs font-bold text-brand-600">7.5</span>
            </div>
          </div>
        </motion.div>

        {/* AI insight card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
          className="card p-4"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-calm-100 flex items-center justify-center flex-shrink-0">
              <Brain size={14} className="text-calm-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-1 mb-1">AI Insight</p>
              <p className="text-xs text-ink-3 leading-relaxed">Your mood improves 40% on days with exercise. Keep it up! 🎉</p>
            </div>
          </div>
        </motion.div>

        {/* Assessment card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
          className="card p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-ink-4">PHQ-9 Score</p>
            <p className="text-lg font-bold text-ink-1 font-display">4 <span className="text-xs font-normal text-mint-600">Minimal</span></p>
          </div>
          <div className="icon-box icon-box-mint">
            <CheckCircle2 size={20} className="text-mint-600" />
          </div>
        </motion.div>

        {/* Doctor card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }}
          className="card p-3.5 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">P</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ink-1 truncate">Dr. Priya Mehta</p>
            <p className="text-2xs text-ink-4">Tomorrow · 10:00 AM</p>
          </div>
          <span className="badge badge-mint text-2xs">Confirmed</span>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Feature card ─────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, description, colorClass, iconBoxClass, delay, link }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
    >
      <Link href={link} className="block h-full card p-6 group">
        <div className={`icon-box ${iconBoxClass} mb-4 group-hover:scale-110 transition-transform duration-200`}>
          <Icon size={20} className={colorClass} />
        </div>
        <h3 className="font-display font-semibold text-base text-ink-1 mb-2">{title}</h3>
        <p className="text-ink-3 text-sm leading-relaxed mb-4">{description}</p>
        <div className={`flex items-center gap-1 text-sm font-semibold ${colorClass}`}>
          Explore <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Step card ────────────────────────────────────────────── */
function StepCard({ number, title, description, delay, iconBg }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      className="flex flex-col items-center text-center"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 font-display font-bold text-lg text-white shadow-brand ${iconBg}`}>
        {number}
      </div>
      <h3 className="font-display font-semibold text-base text-ink-1 mb-2">{title}</h3>
      <p className="text-ink-3 text-sm leading-relaxed max-w-[220px]">{description}</p>
    </motion.div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export default function Home() {
  const { user, isDoctor, isAdmin, isGuest, enterGuestMode } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/signup';
    if (isAdmin?.()) return '/admin/dashboard';
    if (isDoctor?.()) return '/doctor/dashboard';
    return '/dashboard';
  };

  const features = [
    {
      icon: Activity, title: 'Mood Tracking',
      description: 'Log your daily mood and discover hidden patterns over time with beautiful arc-slider and AI-powered insights.',
      colorClass: 'text-brand-600', iconBoxClass: 'icon-box-brand', delay: 0.05, link: '/mood',
    },
    {
      icon: Brain, title: 'Clinical Assessments',
      description: 'PHQ-9 and GAD-7 standardized assessments with detailed score breakdowns and trend analytics.',
      colorClass: 'text-calm-600', iconBoxClass: 'icon-box-calm', delay: 0.1, link: '/assessment',
    },
    {
      icon: MessageSquare, title: 'AI Chat Support',
      description: 'GPT-4o powered mental health assistant with memory of your assessment history and mood context.',
      colorClass: 'text-mint-600', iconBoxClass: 'icon-box-mint', delay: 0.15, link: '/chat',
    },
    {
      icon: Users, title: 'Verified Doctors',
      description: 'Browse licensed therapists and psychiatrists. Book appointments that sync directly to Google Calendar.',
      colorClass: 'text-amber-600', iconBoxClass: 'icon-box-amber', delay: 0.2, link: '/doctors',
    },
    {
      icon: Shield, title: 'Bank-Grade Security',
      description: 'AES-256-GCM encrypted data, TOTP two-factor authentication, and JWT-secured sessions.',
      colorClass: 'text-rose-500', iconBoxClass: 'icon-box-rose', delay: 0.25, link: '/settings/security',
    },
    {
      icon: TrendingUp, title: 'Progress Dashboard',
      description: 'Interactive charts, milestone tracking, and correlations between mood, sleep, and activities.',
      colorClass: 'text-brand-600', iconBoxClass: 'icon-box-brand', delay: 0.3, link: '/dashboard',
    },
  ];

  const stats = [
    { value: 12000, suffix: '+', label: 'Assessments completed' },
    { value: 500,   suffix: '+', label: 'Verified doctors' },
    { value: 98,    suffix: '%', label: 'User satisfaction' },
    { value: 50000, suffix: '+', label: 'Mood entries logged' },
  ];

  const testimonials = [
    { name: 'Sarah K.', role: 'Patient', text: 'BetterMind helped me understand my anxiety patterns. The mood tracking is unlike anything I\'ve used before.', stars: 5 },
    { name: 'Dr. Priya M.', role: 'Psychiatrist', text: 'As a doctor on this platform, the appointment management and patient insights are incredibly well-designed.', stars: 5 },
    { name: 'James L.', role: 'Patient', text: 'The AI chat actually understands context from my assessments. It\'s not just generic advice — it knows me.', stars: 5 },
  ];

  return (
    <div className="overflow-hidden">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-hero overflow-hidden">
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-dot-pattern bg-dot-md opacity-60 pointer-events-none" />

        {/* Soft blobs */}
        <div className="blob blob-brand w-[500px] h-[500px] -top-24 -right-24 opacity-50" />
        <div className="blob blob-mint w-[400px] h-[400px] bottom-0 -left-20 opacity-40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left copy */}
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <span className="badge badge-brand mb-6 inline-flex">
                  <Sparkles size={11} /> Powered by GPT-4o-mini
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="font-display font-bold leading-tight mb-5 text-ink-1"
                style={{ fontSize: 'clamp(2.4rem, 5vw, 3.75rem)' }}
              >
                Mental Health,<br />
                <span className="gradient-text">Reimagined with AI</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16 }}
                className="text-ink-3 text-lg leading-relaxed mb-8 max-w-lg"
              >
                Track mood, take clinical assessments, chat with AI, and connect with verified doctors — all in one calm, beautiful platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.24 }}
                className="flex flex-col sm:flex-row gap-3 mb-8"
              >
                <Link href={getDashboardLink()} className="btn-primary gap-2 text-base py-3.5 px-7">
                  <Zap size={16} />
                  {user ? 'Go to Dashboard' : 'Start for Free'}
                </Link>
                {!user && !isGuest ? (
                  <button onClick={() => enterGuestMode('/dashboard')} className="btn-secondary gap-2 text-base py-3.5 px-7">
                    <Eye size={15} /> Explore as Guest
                  </button>
                ) : (
                  <Link href="/doctors" className="btn-secondary gap-2 text-base py-3.5 px-7">
                    Find a Doctor <ArrowRight size={15} />
                  </Link>
                )}
              </motion.div>

              {!user && !isGuest && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
                  className="text-xs text-ink-4 -mt-4 mb-8 flex items-center gap-1.5"
                >
                  <Eye size={11} className="text-brand-400" />
                  No sign-up needed — explore the full platform with demo data
                </motion.p>
              )}

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-5"
              >
                {[
                  { icon: Shield, text: 'End-to-end encrypted', color: 'text-brand-500' },
                  { icon: Lock,   text: '2FA security',          color: 'text-mint-500' },
                  { icon: Heart,  text: 'HIPAA-aligned',         color: 'text-rose-400' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs text-ink-4 font-medium">
                    <Icon size={12} className={color} /> {text}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:flex justify-center"
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-ink-4"
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown size={15} className="animate-bounce" />
        </motion.div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <div className="font-display font-bold text-4xl mb-1 gradient-text">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-ink-4 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section className="py-24 bg-surface-1 relative">
        <div className="absolute inset-0 bg-dot-pattern bg-dot-lg opacity-40 pointer-events-none" />
        <div className="relative section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="badge badge-brand mb-4 inline-flex">Everything you need</span>
            <h2 className="font-display font-bold text-3xl text-ink-1 mb-3">Built for real mental wellness</h2>
            <p className="text-ink-3 max-w-xl mx-auto text-base">Not another journal app. BetterMind combines clinical tools, AI intelligence, and professional care.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="badge badge-mint mb-4 inline-flex">Simple process</span>
            <h2 className="font-display font-bold text-3xl text-ink-1 mb-3">Up and running in minutes</h2>
          </motion.div>

          <div className="relative grid md:grid-cols-3 gap-12">
            <div className="hidden md:block absolute top-7 left-[calc(33%+28px)] right-[calc(33%+28px)] h-px bg-gradient-to-r from-brand-200 to-mint-200" />
            <StepCard number="01" title="Sign up & assess" description="Create your account and take PHQ-9 + GAD-7 assessments to establish your baseline." delay={0} iconBg="bg-gradient-brand" />
            <StepCard number="02" title="Track daily" description="Log mood, activities, and notes. Watch the AI spot patterns you'd never notice yourself." delay={0.12} iconBg="bg-gradient-mint" />
            <StepCard number="03" title="Get real help" description="Connect with verified doctors and book appointments that sync to Google Calendar." delay={0.24} iconBg="bg-gradient-warm" />
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════ */}
      <section className="py-24 bg-surface-1">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display font-bold text-3xl text-ink-1 mb-3">Loved by patients & doctors</h2>
            <div className="flex justify-center gap-1 mb-1.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" className="text-amber-400" />)}
            </div>
            <p className="text-ink-4 text-sm">4.9 / 5 from 2,400+ reviews</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                className="card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} size={13} fill="#f59e0b" className="text-amber-400" />)}
                </div>
                <p className="text-ink-2 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-brand flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-ink-1 text-sm font-semibold">{t.name}</p>
                    <p className="text-ink-4 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-brand-600 to-calm-600">
        {/* Dot overlay */}
        <div className="absolute inset-0 bg-dot-pattern bg-dot-md opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white opacity-5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white opacity-5 translate-y-1/2 -translate-x-1/2" />

        <div className="relative section-sm text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}>
              Your mental health<br />deserves the best care.
            </h2>
            <p className="text-brand-200 mb-8 text-base max-w-md mx-auto">
              Join thousands already on their journey to better mental wellness.
            </p>
            <Link
              href={getDashboardLink()}
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold rounded-full px-8 py-4 text-base shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
            >
              <Sparkles size={17} />
              {user ? 'Back to Dashboard' : "Get Started — It's Free"}
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
