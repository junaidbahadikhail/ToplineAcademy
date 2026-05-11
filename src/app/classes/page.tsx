'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

interface ClassItem {
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

const TYPE_FILTERS = ['All', 'Live', 'Recorded'];

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setClasses(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const subjects = ['All', ...Array.from(new Set(classes.map(c => c.subject)))];

  const filtered = classes.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase()) || c.instructor.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || (typeFilter === 'Live' ? c.type === 'LIVE' : c.type === 'RECORDED');
    return matchSearch && matchType;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900">All Classes</h1>
          <p className="mt-1 text-slate-500 text-sm">{classes.length} classes available for Pakistani students</p>

          {/* Search */}
          <div className="mt-5 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search classes, subjects, instructors…"
                className="w-full rounded-full border border-slate-300 bg-slate-50 pl-9 pr-4 py-2.5 text-sm focus:border-teal-700 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {TYPE_FILTERS.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    typeFilter === t
                      ? 'bg-teal-950 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Subject chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setSearch(s === 'All' ? '' : s)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 hover:border-teal-700 hover:text-teal-800 transition"
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-slate-500 mb-5">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        )}

        {/* Course grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(cls => (
            <Link
              key={cls.id}
              href={`/classes/${cls.id}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
            >
              {/* Colored header */}
              <div className={`h-28 bg-gradient-to-br ${cardGradient(cls.subject)} relative flex items-end p-4`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    cls.status === 'LIVE_NOW'
                      ? 'bg-green-400 text-green-950'
                      : cls.type === 'LIVE'
                      ? 'bg-white/25 text-white'
                      : 'bg-white/20 text-white'
                  }`}>
                    {cls.status === 'LIVE_NOW' ? '● LIVE NOW' : cls.type === 'LIVE' ? '📹 Live' : '🎬 Recorded'}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-1.5">{cls.subject}</p>
                <h2 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-teal-900 transition">
                  {cls.title}
                </h2>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>👤 {cls.instructor.name}</p>
                  <p>🗓 {fmt(cls.schedule)}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-base font-bold text-teal-950">
                    PKR {cls.feePkr.toLocaleString()}
                  </span>
                  <span className="inline-flex rounded-full bg-teal-950 px-4 py-1.5 text-xs font-semibold text-white group-hover:bg-teal-800 transition">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-400">
            No classes match your search.
          </div>
        )}
      </div>
    </main>
  );
}
