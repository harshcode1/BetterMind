'use client';

import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ArrowRight } from 'lucide-react';

// Thin sticky banner shown to all non-authenticated visitors.
// Guest mode is always on when not signed in — no opt-in needed.
export default function GuestBanner() {
  const { isGuest, user } = useAuth();
  const pathname = usePathname();

  // Hide on landing, login, and signup pages — they already have prominent CTAs
  const hiddenPaths = ['/', '/login', '/signup', '/signup/doctor'];
  const show = isGuest && !user && !hiddenPaths.includes(pathname);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="sticky top-16 z-40 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-brand-600 to-calm-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
              <Eye size={14} className="flex-shrink-0 text-white/80" />
              <p className="text-xs sm:text-sm flex-1 min-w-0 text-white/90">
                <span className="font-semibold text-white">Demo mode</span>
                <span className="hidden sm:inline"> — you&apos;re viewing sample data. Sign in to track your own progress.</span>
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href="/login"
                  className="text-white/80 hover:text-white text-xs font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 bg-white text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
                >
                  Create account <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
