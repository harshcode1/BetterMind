import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GuestBanner from './components/GuestBanner';
import GuestGateModal from './components/GuestGateModal';
import { AuthProvider } from './contexts/AuthContext';
import "./globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['300','400','500','600','700'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','500'] });

export const metadata = {
  title: 'BetterMind | AI Mental Health Platform',
  description: 'Your AI-powered mental health companion — mood tracking, clinical assessments, and verified doctors.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="flex flex-col min-h-screen bg-surface-1 text-ink-1">
        <AuthProvider>
          <Navbar />
          <GuestBanner />
          <main className="flex-grow">{children}</main>
          <Footer />
          <GuestGateModal />
        </AuthProvider>
      </body>
    </html>
  );
}
