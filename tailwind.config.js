/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — Indigo (trust, calm, depth)
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Mint / Emerald (growth, healing)
        mint: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // Calm — Lavender / Violet (serenity)
        calm: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        // Warm — Peach / Orange (compassion, support)
        warm: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
        },
        // Rose (alerts, urgent)
        rose: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        // Amber (warnings, streaks)
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
        },
        // Surface / neutral system
        surface: {
          0:   '#ffffff',
          1:   '#fafbff',
          2:   '#f4f6fd',
          3:   '#eef1f8',
          border: '#e8edf5',
          'border-strong': '#d1d9e6',
        },
        // Text system
        ink: {
          1: '#0f172a',
          2: '#334155',
          3: '#64748b',
          4: '#94a3b8',
          5: '#cbd5e1',
        },
        // Violet kept for backward compat
        violet: {
          50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe',
          300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6',
          600: '#7c3aed', 700: '#6d28d9',
        },
        // Slate
        slate: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
        },
        emerald: {
          50: '#ecfdf5', 100: '#d1fae5', 400: '#34d399', 500: '#10b981', 600: '#059669',
        },
        cyan: {
          50: '#ecfeff', 400: '#22d3ee', 500: '#06b6d4',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px', letterSpacing: '0.04em' }],
      },
      lineHeight: {
        'relaxed': '1.7',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand':  'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'gradient-mint':   'linear-gradient(135deg, #10b981, #34d399)',
        'gradient-warm':   'linear-gradient(135deg, #f97316, #fb923c)',
        'gradient-hero':   'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ecfdf5 100%)',
        'dot-pattern':     'radial-gradient(rgba(99,102,241,0.12) 1px, transparent 1px)',
        'dot-pattern-sm':  'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)',
        'grid-light':      'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-sm':   '20px 20px',
        'dot-md':   '28px 28px',
        'dot-lg':   '40px 40px',
        'grid-sm':  '32px 32px',
        'grid-md':  '48px 48px',
      },
      boxShadow: {
        // Soft elevation shadows (no glows)
        'xs':    '0 1px 2px rgba(15,23,42,0.04)',
        'sm':    '0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'md':    '0 4px 16px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
        'lg':    '0 8px 32px rgba(15,23,42,0.10), 0 4px 8px rgba(15,23,42,0.04)',
        'xl':    '0 16px 48px rgba(15,23,42,0.12), 0 8px 16px rgba(15,23,42,0.06)',
        '2xl':   '0 24px 64px rgba(15,23,42,0.14), 0 12px 24px rgba(15,23,42,0.08)',
        // Brand-tinted shadow (CTA buttons only)
        'brand':       '0 4px 16px rgba(99,102,241,0.30)',
        'brand-lg':    '0 8px 32px rgba(99,102,241,0.35)',
        'brand-hover': '0 8px 24px rgba(99,102,241,0.40)',
        'mint':        '0 4px 16px rgba(16,185,129,0.25)',
        'warm':        '0 4px 16px rgba(249,115,22,0.25)',
        'calm':        '0 4px 16px rgba(139,92,246,0.25)',
        // Card
        'card':        '0 4px 16px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)',
        'card-hover':  '0 8px 32px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06)',
        // Inset
        'inner': 'inset 0 2px 4px rgba(15,23,42,0.04)',
      },
      borderRadius: {
        '2xl':  '1rem',
        '3xl':  '1.25rem',
        '4xl':  '2rem',
        '5xl':  '2.5rem',
      },
      animation: {
        // Gentle float (therapeutic pacing)
        'float':        'float 7s ease-in-out infinite',
        'float-slow':   'float 11s ease-in-out infinite',
        'float-fast':   'float 5s ease-in-out infinite',
        // Pulse variants
        'pulse-slow':   'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-brand':  'pulse-brand 3s ease-in-out infinite',
        // Shimmer for skeletons
        'shimmer':      'shimmer 2s linear infinite',
        // Fade animations
        'fade-up':      'fade-up 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'fade-in':      'fade-in 0.4s ease-out forwards',
        'fade-down':    'fade-down 0.4s ease-out forwards',
        // Breathing (ambient)
        'breathe':      'breathe 5s ease-in-out infinite',
        // Spin
        'spin-slow':    'spin 8s linear infinite',
        // Bounce
        'bounce-soft':  'bounce-soft 2s ease-in-out infinite',
        // Count up
        'count-up':     'fade-up 0.8s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        // Slide
        'slide-up':     'slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-down':   'slide-down 0.25s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-14px)' },
        },
        'pulse-brand': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-down': {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)',   opacity: '0.7' },
          '50%':      { transform: 'scale(1.08)', opacity: '1' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'calm':   'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
};
