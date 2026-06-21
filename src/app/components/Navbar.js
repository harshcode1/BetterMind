'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Menu, X, ChevronDown, Shield, LogOut, Sparkles, Eye, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout, loading, isDoctor, isAdmin, isGuest } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
  };

  const patientLinks = [
    { href: '/dashboard',    label: 'Dashboard' },
    { href: '/mood',         label: 'Mood' },
    { href: '/assessment',   label: 'Assess' },
    { href: '/chat',         label: 'AI Chat' },
    { href: '/doctors',      label: 'Doctors' },
    { href: '/appointments', label: 'Appointments' },
    { href: '/resources',    label: 'Resources' },
  ];
  const doctorLinks = [
    { href: '/doctor/dashboard', label: 'Dashboard' },
    { href: '/resources',        label: 'Resources' },
  ];
  const adminLinks = [
    { href: '/admin/dashboard', label: 'Admin Panel' },
    { href: '/resources',       label: 'Resources' },
  ];
  const guestLinks = [
    { href: '/',          label: 'Home' },
    { href: '/resources', label: 'Resources' },
  ];

  // Guests get the full patient experience (with demo data) so they can explore everything.
  const navLinks = user
    ? (isAdmin?.() ? adminLinks : isDoctor?.() ? doctorLinks : patientLinks)
    : isGuest ? patientLinks : guestLinks;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid #e8edf5' : '1px solid transparent',
          boxShadow: scrolled ? '0 2px 12px rgba(15,23,42,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-brand shadow-brand group-hover:shadow-brand-lg transition-shadow duration-200">
                <Brain size={17} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg text-ink-1 tracking-tight">BetterMind</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                    style={{ color: active ? '#4f46e5' : '#64748b' }}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg bg-brand-50"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 hover:text-ink-2 transition-colors">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">
              {!loading && (
                user ? (
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-2 transition-colors duration-150"
                    >
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-brand">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-mint-500 rounded-full border-2 border-white" />
                      </div>
                      <span className="text-sm font-medium text-ink-2">{user.name?.split(' ')[0]}</span>
                      <ChevronDown size={13} className={`text-ink-4 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden bg-white border border-surface-border shadow-lg"
                        >
                          <div className="px-4 py-3 border-b border-surface-border bg-surface-2">
                            <p className="text-2xs text-ink-4 uppercase tracking-wider font-medium">Signed in as</p>
                            <p className="text-sm font-semibold text-ink-1 truncate mt-0.5">{user.email}</p>
                          </div>
                          <div className="p-1.5">
                            <Link
                              href="/settings/profile"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-ink-2 hover:bg-surface-2 hover:text-ink-1 transition-colors"
                            >
                              <User size={14} className="text-brand-500" /> My Profile
                            </Link>
                            <Link
                              href="/settings/security"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-ink-2 hover:bg-surface-2 hover:text-ink-1 transition-colors"
                            >
                              <Shield size={14} className="text-brand-500" /> Security Settings
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <LogOut size={14} /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isGuest && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 border border-brand-100">
                        <Eye size={11} /> Guest
                      </span>
                    )}
                    <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-ink-3 hover:text-ink-1 hover:bg-surface-2 transition-colors">
                      Sign In
                    </Link>
                    <Link href="/signup" className="btn-primary text-sm gap-1.5">
                      <Sparkles size={14} /> Get Started
                    </Link>
                  </div>
                )
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-ink-3 hover:text-ink-1 hover:bg-surface-2 transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 md:hidden bg-white"
            style={{ paddingTop: '64px' }}
          >
            <div className="p-5 flex flex-col gap-1">
              {navLinks.map((link, i) => {
                const active = pathname === link.href;
                return (
                  <motion.div key={link.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link
                      href={link.href}
                      className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        color: active ? '#4f46e5' : '#64748b',
                        background: active ? '#eef2ff' : 'transparent',
                      }}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="mt-4 pt-4 border-t border-surface-border">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-brand flex-shrink-0">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-1">{user.name}</p>
                        <p className="text-xs text-ink-4">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/settings/security" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-ink-2 hover:bg-surface-2 transition-colors">
                      <Shield size={14} className="text-brand-500" /> Security Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-rose-500 hover:bg-rose-50 transition-colors">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <Link href="/login" className="btn-secondary text-center block">Sign In</Link>
                    <Link href="/signup" className="btn-primary text-center block">Get Started</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
