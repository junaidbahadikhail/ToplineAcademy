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
        <Link href="/" className="flex items-center gap-3 text-teal-950">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-950 text-lg font-bold text-white shadow-sm">
            TL
          </span>
          <div>
            <p className="text-lg font-semibold">Topline Academy</p>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Pakistan online classroom</p>
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
