import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/95 py-10 shadow-inner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-teal-950">Topline Academy</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              A lightweight online classroom for live events, attendance, payments, and student dashboards.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/classes" className="text-sm font-medium text-slate-700 hover:text-teal-950">
              Classes
            </Link>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Topline Academy. Built for fast student onboarding in Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}
