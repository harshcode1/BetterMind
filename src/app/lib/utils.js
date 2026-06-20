import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export function getScoreColor(score, max) {
  const pct = score / max;
  if (pct < 0.25) return { text: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Minimal' };
  if (pct < 0.5) return { text: 'text-amber-400', bg: 'bg-amber-500', label: 'Mild' };
  if (pct < 0.75) return { text: 'text-orange-400', bg: 'bg-orange-500', label: 'Moderate' };
  return { text: 'text-rose-400', bg: 'bg-rose-500', label: 'Severe' };
}

export function getMoodColor(mood) {
  if (mood >= 8) return '#10b981';
  if (mood >= 6) return '#06b6d4';
  if (mood >= 4) return '#f59e0b';
  if (mood >= 2) return '#f97316';
  return '#f43f5e';
}

export function getMoodEmoji(mood) {
  if (mood >= 9) return '😁';
  if (mood >= 7) return '😊';
  if (mood >= 5) return '😐';
  if (mood >= 3) return '😟';
  return '😢';
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
