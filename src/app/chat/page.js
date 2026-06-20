'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, ChevronLeft, MessageCircle, Stethoscope, Heart, HelpCircle, ExternalLink } from 'lucide-react';
import { demoChat } from '../lib/demoData';

const CATEGORIES = [
  { name: 'Mental Health', icon: Brain,       colorClass: 'text-brand-600',  boxClass: 'icon-box-brand',  badgeClass: 'badge-brand',  symptoms: ['Anxiety', 'Depression', 'Stress', 'Insomnia', 'Mood Swings', 'Panic'] },
  { name: 'Physical',      icon: Heart,       colorClass: 'text-rose-500',   boxClass: 'icon-box-rose',   badgeClass: 'badge-rose',   symptoms: ['Headache', 'Fatigue', 'Pain', 'Dizziness'] },
  { name: 'Other',         icon: HelpCircle,  colorClass: 'text-mint-600',   boxClass: 'icon-box-mint',   badgeClass: 'badge-mint',   symptoms: ["I'm not sure / Other symptoms"] },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 max-w-xs">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-brand">
        <Brain size={12} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-surface-2 border border-surface-border">
        <div className="flex items-center gap-1 h-4">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-400"
              animate={{ y: [0, -5, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const { user, loading: authLoading, isGuest, requireRealUser } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!authLoading && !user && !isGuest) router.push('/login?redirect=/chat'); }, [user, authLoading, isGuest]);

  useEffect(() => {
    if (user) {
      fetch('/api/chat').then(r => r.json()).then(d => { if (d.messages) setMessages(d.messages); }).catch(() => {});
    } else if (isGuest) {
      setMessages(demoChat());
    }
  }, [user, isGuest]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text?.trim()) return;
    // Guests can preview the conversation but can't send live messages.
    if (!requireRealUser('chat with the AI assistant')) return;
    setLoading(true);
    setSelectedCategory(null); setShowSymptoms(false); setInput('');
    setMessages(prev => [...prev, { text: text.trim(), sender: 'user' }]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { text: data.message, sender: 'bot', recommendation: data.recommendation }]);
    } catch {
      setMessages(prev => [...prev, { text: 'Sorry, something went wrong. Please try again.', sender: 'bot' }]);
    } finally { setLoading(false); }
  };

  const handleInputSend = () => { if (input.trim()) sendMessage(input); };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <div className="w-9 h-9 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!user && !isGuest) return null;

  return (
    <div className="min-h-screen flex flex-col bg-surface-1">

      {/* Chat header */}
      <div className="px-4 py-3 flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-brand shadow-brand">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-ink-1 text-sm leading-tight">MindCare AI</h1>
            <p className="text-xs text-mint-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse inline-block" /> Online · Powered by GPT-4o-mini
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !loading && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="icon-box icon-box-brand w-16 h-16 rounded-2xl animate-float">
                <MessageCircle size={28} className="text-brand-500" />
              </div>
              <h2 className="font-display font-bold text-ink-1 text-xl">How can I help you today?</h2>
              <p className="text-ink-3 text-sm max-w-sm">Select a symptom category below or type your concern directly. Everything is private.</p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-brand">
                    <Brain size={12} className="text-white" />
                  </div>
                )}
                <div className={`max-w-sm lg:max-w-md xl:max-w-lg flex flex-col gap-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-brand text-white rounded-br-sm shadow-brand'
                      : 'bg-white text-ink-2 border border-surface-border rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.recommendation && (
                    <div className="card p-4 rounded-xl text-xs space-y-2 w-full">
                      <div className="flex items-center gap-2 text-brand-600 font-semibold">
                        <Stethoscope size={12} /> Recommended Specialist
                      </div>
                      <p className="text-ink-2">{msg.recommendation.specialist}</p>
                      {msg.recommendation.resources?.length > 0 && (
                        <>
                          <p className="text-ink-4 font-medium">Helpful resources:</p>
                          <ul className="space-y-1">
                            {msg.recommendation.resources.map((r, ri) => (
                              <li key={ri} className="text-ink-3 flex items-start gap-1.5">
                                <span className="text-brand-400 mt-0.5">•</span> {r}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 bg-white/80 backdrop-blur-md border-t border-surface-border">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Category / symptom pills */}
          <AnimatePresence>
            {!showSymptoms && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-2 flex-wrap">
                {CATEGORIES.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <button key={i} onClick={() => { setSelectedCategory(i); setShowSymptoms(true); }}
                      disabled={loading}
                      className={`chip disabled:opacity-50 ${cat.badgeClass.replace('badge-', 'hover:border-') === 'hover:border-brand' ? 'hover:border-brand-300' : ''}`}>
                      <Icon size={11} /> {cat.name}
                    </button>
                  );
                })}
              </motion.div>
            )}
            {showSymptoms && selectedCategory !== null && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-2 flex-wrap">
                <button onClick={() => { setShowSymptoms(false); setSelectedCategory(null); }}
                  className="chip">
                  <ChevronLeft size={11} /> Back
                </button>
                {CATEGORIES[selectedCategory].symptoms.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(`I'm experiencing ${s.toLowerCase()}`)} disabled={loading}
                    className={`chip active disabled:opacity-50`}>
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text input */}
          <div className="flex items-center gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInputSend(); } }}
              placeholder="Type your concern or select a symptom above..."
              disabled={loading}
              className="input flex-1 text-sm"
            />
            <motion.button onClick={handleInputSend} disabled={loading || !input.trim()}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center bg-gradient-brand shadow-brand transition-all disabled:opacity-40">
              <Send size={15} className="text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
