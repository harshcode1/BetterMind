'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ArrowRight, X } from 'lucide-react';

// Thin sticky banner shown whenever the viewer is browsing in guest mode.
export default function GuestBanner() {
  const { isGuest, user, exitGuestMode } = useAuth();
  const router = useRouter();

  // Never show for real users.
  const show = isGuest && !user;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="sticky top-16 z-40 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-brand-600 to-calm-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
              <Eye size={14} className="flex-shrink-0 text-white/90" />
              <p className="text-xs sm:text-sm flex-1 min-w-0">
                <span className="font-semibold">Guest mode</span>
                <span className="hidden sm:inline text-white/80"> — you&apos;re viewing demo data. Sign in to track your own progress.</span>
              </p>
              <button
                onClick={() => exitGuestMode('/signup')}
                className="flex-shrink-0 flex items-center gap-1.5 bg-white text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
              >
                Create account <ArrowRight size={12} />
              </button>
              <button
                onClick={() => exitGuestMode('/')}
                title="Exit guest mode"
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
