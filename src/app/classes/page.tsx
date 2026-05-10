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

const statusColor: Record<string, string> = {
  UPCOMING: 'bg-blue-50 text-blue-700 border-blue-200',
  LIVE_NOW: 'bg-green-50 text-green-700 border-green-200 animate-pulse',
  ENDED: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-red-50 text-red-600',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  }) + ' PKT';
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/classes')
      .then((r) => r.json())
      .then((data) => { setClasses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-950/70">Class catalog</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Upcoming classes</h1>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {classes.map((cls) => (
            <article key={cls.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor[cls.status] ?? ''}`}>
                    {cls.status === 'LIVE_NOW' ? '● LIVE NOW' : cls.status}
                  </span>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{cls.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{cls.subject}</p>
                </div>
                <p className="shrink-0 text-xl font-bold text-teal-950">
                  {cls.feePkr.toLocaleString()}<span className="text-sm font-normal"> PKR</span>
                </p>
              </div>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>Instructor: <span className="font-medium">{cls.instructor.name}</span></p>
                <p>Schedule: <span className="font-medium">{fmt(cls.schedule)}</span></p>
                <p>Type: <span className="font-medium">{cls.type === 'LIVE' ? 'Live session' : 'Recorded'}</span></p>
              </div>
              <div className="mt-6 flex-1 flex items-end">
                <Link
                  href={`/classes/${cls.id}`}
                  className="inline-flex rounded-full bg-teal-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900"
                >
                  View details →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!loading && classes.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center text-slate-400">
            No classes available right now.
          </div>
        )}
      </section>
    </main>
  );
}
