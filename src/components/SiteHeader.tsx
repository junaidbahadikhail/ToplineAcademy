'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SessionUser {
  userId: string;
  email: string;
  role: string;
}

export function SiteHeader() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data?.user ?? null);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const dashboardHref =
    user?.role === 'ADMIN'
      ? '/admin'
      : user?.role === 'INSTRUCTOR'
      ? '/dashboard/instructor'
      : '/dashboard/student';

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          {/* Abstract AI-inspired logo mark */}
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <rect width="44" height="44" rx="12" fill="#0F3D3D"/>
            {/* Neural network nodes */}
            <circle cx="22" cy="10" r="3" fill="#F59E0B"/>
            <circle cx="10" cy="22" r="2.5" fill="#5EEAD4"/>
            <circle cx="34" cy="22" r="2.5" fill="#5EEAD4"/>
            <circle cx="14" cy="34" r="2.5" fill="#5EEAD4"/>
            <circle cx="30" cy="34" r="2.5" fill="#5EEAD4"/>
            <circle cx="22" cy="24" r="4" fill="#F59E0B"/>
            {/* Connections */}
            <line x1="22" y1="13" x2="22" y2="20" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12.2" y1="22" x2="18" y2="23" stroke="#5EEAD4" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8"/>
            <line x1="31.8" y1="22" x2="26" y2="23" stroke="#5EEAD4" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8"/>
            <line x1="16" y1="32.5" x2="19.5" y2="27" stroke="#5EEAD4" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8"/>
            <line x1="28" y1="32.5" x2="24.5" y2="27" stroke="#5EEAD4" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8"/>
            {/* Orbit ring */}
            <circle cx="22" cy="22" r="11" stroke="#5EEAD4" strokeWidth="0.75" strokeOpacity="0.25" strokeDasharray="3 3"/>
          </svg>
          <div>
            <p className="text-lg font-bold text-teal-950 leading-tight">Topline Academy</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-medium">Pakistan · AI Classroom</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-teal-950"
          >
            Home
          </Link>
          <Link
            href="/classes"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-teal-950"
          >
            Classes
          </Link>

          {checked && !user && (
            <>
              <Link
                href="/register"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-teal-950"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-teal-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-900"
              >
                Login
              </Link>
            </>
          )}

          {checked && user && (
            <>
              <Link
                href={dashboardHref}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-teal-950"
              >
                Dashboard
              </Link>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                {user.role === 'ADMIN' ? 'Admin' : user.role === 'INSTRUCTOR' ? 'Instructor' : 'Student'}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
