import type { Metadata } from 'next';
import './globals.css';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Topline Academy',
  description: 'Pakistan online classroom for AI and technology courses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,126,126,0.08),_transparent_30%)]">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
