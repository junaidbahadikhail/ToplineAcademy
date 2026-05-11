'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

interface ClassCard {
  id: string;
  title: string;
  subject: string;
  instructor: { name: string };
  schedule: string;
  feePkr: number;
  type: string;
  status: string;
}

const subjectGradient: Record<string, string> = {
  'AI Foundations': 'from-violet-600 to-violet-800',
  'Python for Data Science': 'from-blue-600 to-blue-800',
  'Digital Marketing': 'from-orange-500 to-orange-700',
  'Web Development': 'from-cyan-600 to-cyan-800',
  'English Language': 'from-emerald-600 to-emerald-800',
  'Mathematics': 'from-red-600 to-red-800',
  'Graphic Design': 'from-pink-600 to-pink-800',
  'Accounting': 'from-teal-600 to-teal-800',
  'Physics': 'from-indigo-600 to-indigo-800',
  'Urdu': 'from-amber-600 to-amber-800',
};

function cardGradient(subject: string) {
  return subjectGradient[subject] ?? 'from-teal-600 to-teal-900';
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi',
  }) + ' PKT';
}

const subjects = ['All', 'Live', 'Recorded', 'Mathematics', 'Web Development', 'English Language', 'Physics'];

export default function HomePage() {
  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [filter, setFilter] = useState('All');
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/classes').then(r => r.ok ? r.json() : []).then(setClasses).catch(() => {});
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.user?.name) setUserName(d.user.name.split(' ')[0]); }).catch(() => {});
  }, []);

  const filtered = classes.filter(c => {
    if (filter === 'All') return true;
    if (filter === 'Live') return c.type === 'LIVE';
    if (filter === 'Recorded') return c.type === 'RECORDED';
    return c.subject === filter;
  }).slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-teal-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              {userName ? (
                <p className="text-teal-300 text-sm font-medium mb-2">Welcome back, {userName}!</p>
              ) : null}
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
                Learn from Pakistan&apos;s<br />best instructors
              </h1>
              <p className="mt-5 max-w-xl text-lg text-teal-200 leading-relaxed">
                Live classes, recorded sessions, and expert instructors — all in one platform designed for Pakistani students.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/classes" className="inline-flex rounded-full bg-amber-400 px-7 py-3 text-sm font-bold text-teal-950 hover:bg-amber-300 transition">
                  Browse Classes
                </Link>
                {!userName && (
                  <Link href="/register" className="inline-flex rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
                    Create Free Account
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-3 w-72">
              {[
                { n: '500+', l: 'Students' },
                { n: '10+', l: 'Subjects' },
                { n: '50+', l: 'Classes' },
                { n: '100%', l: 'PKT Time' },
              ].map(s => (
                <div key={s.l} className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur">
                  <p className="text-2xl font-bold text-amber-400">{s.n}</p>
                  <p className="text-xs text-teal-200 mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Classes section */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Classes</h2>
            <p className="text-sm text-slate-500 mt-1">{classes.length} classes available</p>
          </div>
          <Link href="/classes" className="text-sm font-semibold text-teal-700 hover:text-teal-900">
            View all →
          </Link>
        </div>

        {/* Subject filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                filter === s
                  ? 'bg-teal-950 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Course grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(cls => (
            <Link key={cls.id} href={`/classes/${cls.id}`} className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
              {/* Card header */}
              <div className={`h-32 bg-gradient-to-br ${cardGradient(cls.subject)} flex items-end p-4`}>
                <div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    cls.status === 'LIVE_NOW'
                      ? 'bg-green-400 text-green-950'
                      : 'bg-white/20 text-white'
                  }`}>
                    {cls.status === 'LIVE_NOW' ? '● LIVE NOW' : cls.type === 'LIVE' ? 'Live' : 'Recorded'}
                  </span>
                </div>
              </div>
              {/* Card body */}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-1">{cls.subject}</p>
                <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-teal-900 transition">
                  {cls.title}
                </h3>
                <p className="mt-2 text-xs text-slate-500">{cls.instructor.name}</p>
                <p className="mt-1 text-xs text-slate-400">{fmt(cls.schedule)}</p>
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
                  <span className="text-base font-bold text-teal-950">
                    PKR {cls.feePkr.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-teal-700 group-hover:text-teal-900">
                    View details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400">
            No classes found for this filter.
          </div>
        )}
      </section>

      {/* Why Topline */}
      <section className="bg-white border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Why Topline Academy?</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🎓', title: 'Expert Instructors', desc: 'Verified Pakistani educators with real-world experience' },
              { icon: '📱', title: 'Mobile Friendly', desc: 'Optimized for 4G and Chrome on Android' },
              { icon: '🕐', title: 'PKT Scheduling', desc: 'All classes scheduled in Pakistan Standard Time' },
              { icon: '💳', title: 'Local Payments', desc: 'Pay via EasyPaisa, JazzCash, or bank transfer' },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-6 text-center">
                <p className="text-3xl mb-3">{f.icon}</p>
                <p className="font-semibold text-slate-900 mb-1">{f.title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-950 text-teal-200 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white text-lg">Topline Academy</p>
            <p className="text-xs text-teal-400 mt-0.5">Pakistan Online Classroom</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/classes" className="hover:text-white transition">Classes</Link>
            <Link href="/register" className="hover:text-white transition">Register</Link>
            <Link href="/login" className="hover:text-white transition">Login</Link>
          </div>
          <p className="text-xs text-teal-500 w-full text-right">© 2026 Topline Academy · Pakistan</p>
        </div>
      </footer>
    </main>
  );
}
