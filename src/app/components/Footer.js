import Link from 'next/link';
import { Brain, GitBranch, X, ExternalLink, Heart, Sparkles, Shield } from 'lucide-react';

const Footer = () => {
  const cols = [
    {
      heading: 'Features',
      links: [
        { label: 'Mood Tracker',   href: '/mood' },
        { label: 'Assessments',    href: '/assessment' },
        { label: 'AI Chat',        href: '/chat' },
        { label: 'Find Doctors',   href: '/doctors' },
        { label: 'Dashboard',      href: '/dashboard' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Resource Library', href: '/resources' },
        { label: 'Crisis Support',   href: '/resources#crisis' },
        { label: 'Mental Health Blog', href: '/resources' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Privacy Policy',  href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Security',        href: '/settings/security' },
        { label: 'Contact Us',      href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-surface-2 border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-brand shadow-brand">
                <Brain size={17} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg text-ink-1">BetterMind</span>
            </div>
            <p className="text-ink-3 text-sm leading-relaxed mb-5">
              Your AI-powered mental health companion. Built with care, secured with purpose.
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-ink-4">
                <Sparkles size={11} className="text-brand-500" /> Powered by GPT-4o-mini
              </div>
              <div className="flex items-center gap-1.5 text-xs text-ink-4">
                <Shield size={11} className="text-mint-500" /> AES-256-GCM encrypted
              </div>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <h4 className="font-display font-semibold text-ink-1 text-sm mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-ink-3 text-sm hover:text-brand-600 transition-colors duration-150">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-border">
          <p className="text-ink-4 text-sm flex items-center gap-1.5">
            © 2025 BetterMind. Built with <Heart size={12} fill="#f43f5e" className="text-rose-500" /> for mental wellness.
          </p>
          <div className="flex items-center gap-2">
            {[GitBranch, X, ExternalLink].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-4 hover:text-brand-600 hover:bg-brand-50 border border-surface-border transition-all duration-150"
              >
                <Icon size={13} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
