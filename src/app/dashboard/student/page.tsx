'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { DailyRoom } from '@/components/DailyRoom';

interface Enrollment {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  class: {
    id: string;
    title: string;
    subject: string;
    scheduleTime: string;
    status: string;
    feePkr: number;
    meetLink: string | null;
    instructor: { name: string };
  };
}

const enrollBadge: Record<string, string> = {
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-600 border-red-200',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Karachi',
  }) + ' PKT';
}

function ScheduleCalendar({ enrollments }: { enrollments: Enrollment[] }) {
  const approved = enrollments.filter((e) => e.status === 'APPROVED');
  const upcoming = approved
    .filter((e) => new Date(e.class.scheduleTime) > new Date())
    .sort((a, b) => new Date(a.class.scheduleTime).getTime() - new Date(b.class.scheduleTime).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
      No upcoming sessions
    </div>
  );

  return (
    <div className="space-y-3">
      {upcoming.map((e) => {
        const d = new Date(e.class.scheduleTime);
        const isLive = e.class.status === 'LIVE_NOW';
        return (
          <div key={e.id} className={`flex items-center gap-4 rounded-2xl border p-4 ${isLive ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
            <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center ${isLive ? 'bg-green-600 text-white' : 'bg-teal-950 text-white'}`}>
              <span className="text-xs font-semibold">{d.toLocaleString('en-PK', { month: 'short', timeZone: 'Asia/Karachi' })}</span>
              <span className="text-xl font-bold leading-none">{d.toLocaleString('en-PK', { day: 'numeric', timeZone: 'Asia/Karachi' })}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold text-slate-900">{e.class.title}</p>
              <p className="text-xs text-slate-500">{d.toLocaleString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} PKT · {e.class.instructor.name}</p>
            </div>
            {isLive && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StudentDashboardPage() {
  const [user, setUser] = useState<{ userId: string; email: string } | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, dataRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/dashboard/student'),
        ]);

        const me = meRes.ok ? await meRes.json() : { user: null };
        const data = dataRes.ok ? await dataRes.json() : [];

        if (!me.user || me.user.role !== 'STUDENT') {
          setAuthorized(false);
          return;
        }

        setUser(me.user);
        setAuthorized(true);
        setEnrollments(Array.isArray(data) ? data : []);
      } catch {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (authorized === null || loading) return (
    <main><SiteHeader />
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
      </div>
    </main>
  );

  if (!authorized) return (
    <main><SiteHeader />
      <div className="mx-auto max-w-xl py-24 text-center">
        <p className="text-slate-600">Please <Link href="/login" className="underline text-teal-950">login</Link> as a student to view your dashboard.</p>
      </div>
    </main>
  );

  const total = enrollments.length;
  const approved = enrollments.filter((e) => e.status === 'APPROVED').length;
  const pending = enrollments.filter((e) => e.status === 'PENDING').length;
  const liveNow = enrollments.filter((e) => e.status === 'APPROVED' && e.class.status === 'LIVE_NOW');

  const joiningEnrollment = joiningClassId ? enrollments.find((e) => e.class.id === joiningClassId) : null;

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Live video modal */}
        {joiningEnrollment?.class.meetLink && (
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> {joiningEnrollment.class.title}
              </span>
              <button onClick={() => setJoiningClassId(null)} className="rounded-full border border-slate-300 px-4 py-1 text-sm text-slate-600 hover:bg-slate-50">
                Leave session
              </button>
            </div>
            <DailyRoom roomName={joiningEnrollment.class.meetLink} />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-950/70">Student Portal</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">My Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Enrolled', value: total },
            { label: 'Approved', value: approved },
            { label: 'Pending', value: pending },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="mt-2 text-4xl font-bold text-teal-950">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Live now banner */}
        {liveNow.length > 0 && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="font-semibold text-green-800">A live session is happening now!</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {liveNow.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setJoiningClassId(e.class.id)}
                  className="inline-flex rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Join: {e.class.title} →
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Enrolled classes */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">My Classes</h2>
            {enrollments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                <p className="text-slate-400">No enrollments yet.</p>
                <Link href="/classes" className="mt-4 inline-flex rounded-full bg-teal-950 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-900">
                  Browse classes →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((e) => {
                  const isLive = e.class.status === 'LIVE_NOW';
                  return (
                    <div key={e.id} className={`rounded-2xl border p-5 ${isLive ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${enrollBadge[e.status]}`}>
                              {e.status}
                            </span>
                            {isLive && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-slate-900">{e.class.title}</h3>
                          <p className="text-sm text-slate-500">{e.class.subject} · {e.class.instructor.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{fmt(e.class.scheduleTime)}</p>
                          <p className="text-sm font-semibold text-teal-950 mt-1">{e.class.feePkr.toLocaleString()} PKR</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Link href={`/classes/${e.class.id}`} className="text-xs text-slate-400 underline">
                            View details
                          </Link>
                          {e.status === 'APPROVED' && isLive && (
                            <button
                              onClick={() => setJoiningClassId(e.class.id)}
                              className="inline-flex rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                              Join →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-6">
              <Link href="/classes" className="text-sm font-semibold text-teal-950 underline">
                Browse more classes →
              </Link>
            </div>
          </div>

          {/* Upcoming schedule */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Upcoming Schedule</h2>
            <ScheduleCalendar enrollments={enrollments} />
          </div>
        </div>
      </section>
    </main>
  );
}
