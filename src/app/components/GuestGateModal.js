'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, LogIn, UserPlus, Lock } from 'lucide-react';

// Global modal shown when a guest tries to perform an action that needs a real account.
export default function GuestGateModal() {
  const { guestPrompt, closeGuestPrompt, exitGuestMode } = useAuth();
  const router = useRouter();

  const go = (path) => {
    closeGuestPrompt?.();
    // Leave guest mode and head to the auth flow.
    exitGuestMode?.(path);
  };

  return (
    <AnimatePresence>
      {guestPrompt && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-ink-1/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeGuestPrompt?.()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            {/* Header band */}
            <div className="relative bg-gradient-to-br from-brand-600 to-calm-600 px-6 pt-7 pb-6 text-center">
              <button onClick={() => closeGuestPrompt?.()}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <X size={15} />
              </button>
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                <Lock size={22} className="text-white" />
              </div>
              <h2 className="font-display font-bold text-xl text-white">Sign in to {guestPrompt.action}</h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-ink-3 text-center mb-5">
                You&apos;re exploring BetterMind in <span className="font-semibold text-brand-600">guest mode</span>.
                Create a free account to save your progress, track your real data, and unlock every feature.
              </p>

              <div className="space-y-2.5">
                <button onClick={() => go('/signup')}
                  className="btn-primary w-full justify-center gap-2 py-2.5">
                  <UserPlus size={15} /> Create free account
                </button>
                <button onClick={() => go('/login')}
                  className="btn-soft w-full justify-center gap-2 py-2.5">
                  <LogIn size={15} /> Sign in
                </button>
                <button onClick={() => closeGuestPrompt?.()}
                  className="w-full text-center text-sm text-ink-4 hover:text-ink-2 transition-colors py-1.5">
                  Keep exploring as guest
                </button>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-xs text-ink-4 mt-4">
                <Sparkles size={11} className="text-mint-500" /> Demo data shown — nothing is saved in guest mode
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
