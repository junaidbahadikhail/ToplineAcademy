'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { LiveKitVideoRoom } from '@/components/LiveKitRoom';

interface ClassDetail {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  instructor: { name: string };
  scheduleTime: string;
  timezone: string;
  meetLink: string | null;
  videoUrl: string | null;
  feePkr: number;
  type: string;
  status: string;
  maxStudents: number;
  isDemo?: boolean;
}

interface MeetingNote {
  summary: string | null;
  keyTopics: string[];
  actionItems: string[];
  importantNotes: string[];
  quizQuestions: string[];
  notionPageId: string | null;
  createdAt: string;
}

type EnrollStatus = 'none' | 'pending' | 'approved' | 'rejected';

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  }) + ' PKT';
}

function ClassDetailInner({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [enrollStatus, setEnrollStatus] = useState<EnrollStatus>(
    searchParams.get('enrolled') === '1' ? 'pending' : 'none'
  );
  const [joining, setJoining] = useState(false);
  const [lkToken, setLkToken] = useState<string | null>(null);
  const [lkServerUrl, setLkServerUrl] = useState<string | null>(null);
  const [lkRoomName, setLkRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetingNote, setMeetingNote] = useState<MeetingNote | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, meRes, enrollRes, noteRes] = await Promise.all([
          fetch(`/api/classes/${params.id}`),
          fetch('/api/auth/me'),
          fetch('/api/dashboard/student'),
          fetch(`/api/classes/${params.id}/recording`),
        ]);

        const classData = classRes.ok ? await classRes.json() : null;
        const meData = meRes.ok ? await meRes.json() : { user: null };
        const enrollData = enrollRes.ok ? await enrollRes.json() : [];
        const noteData = noteRes.ok ? await noteRes.json() : null;

        setCls(classData?.error ? null : classData);
        setRole(meData.user?.role ?? null);
        if (noteData?.summary) setMeetingNote(noteData);

        if (Array.isArray(enrollData)) {
          const found = enrollData.find((e: { class: { id: string }; status: string }) => e.class.id === params.id);
          if (found) setEnrollStatus(found.status.toLowerCase() as EnrollStatus);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const joinSession = async () => {
    setError(null);
    const res = await fetch(`/api/classes/${params.id}/join`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Unable to join session.');
      return;
    }
    setLkToken(data.token ?? null);
    setLkServerUrl(data.serverUrl ?? null);
    setLkRoomName(data.roomName ?? null);
    setJoining(true);
  };


  if (loading) return (
    <main><SiteHeader />
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
      </div>
    </main>
  );

  if (!cls) return (
    <main><SiteHeader />
      <div className="mx-auto max-w-xl py-24 text-center text-slate-500">Class not found.</div>
    </main>
  );

  const isLive = cls.status === 'LIVE_NOW';
  const canJoin = joining && !!lkToken && !!lkServerUrl;

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Live video */}
        {canJoin && lkToken && lkServerUrl && (
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live session
              </span>
              <button
                onClick={() => { setJoining(false); setLkToken(null); setLkServerUrl(null); setLkRoomName(null); }}
                className="text-sm text-slate-500 underline"
              >
                Leave
              </button>
            </div>
            <LiveKitVideoRoom token={lkToken!} serverUrl={lkServerUrl!} />
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {isLive && (
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE NOW
                </span>
              )}
              <p className="text-sm font-semibold uppercase tracking-widest text-teal-950/70">{cls.subject}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{cls.title}</h1>
            </div>
            <p className="text-3xl font-bold text-teal-950">
              {cls.feePkr.toLocaleString()}<span className="text-base font-normal"> PKR</span>
            </p>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="space-y-3 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Instructor:</span> {cls.instructor.name}</p>
              <p><span className="font-semibold text-slate-800">Schedule:</span> {fmt(cls.scheduleTime)}</p>
              <p><span className="font-semibold text-slate-800">Type:</span> {cls.type === 'LIVE' ? 'Live session' : 'Recorded'}</p>
              <p><span className="font-semibold text-slate-800">Max students:</span> {cls.maxStudents}</p>
              <p><span className="font-semibold text-slate-800">Status:</span> {cls.status.replace('_', ' ')}</p>
            </div>

            {/* Enrollment panel */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="font-semibold text-slate-800">Enrollment</p>

              {/* Not logged in */}
              {role === null && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-500">Sign in or create an account to enroll in this class.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/login?redirect=/classes/${params.id}`} className="inline-flex rounded-full bg-teal-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-900">
                      Login
                    </Link>
                    <Link href="/register" className="inline-flex rounded-full border border-teal-950 px-5 py-2.5 text-sm font-semibold text-teal-950 hover:bg-teal-50">
                      Create account
                    </Link>
                  </div>
                </div>
              )}

              {/* Student — not yet enrolled */}
              {role === 'STUDENT' && enrollStatus === 'none' && (
                <div className="mt-4 space-y-4">
                  {cls.isDemo && (
                    <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3.5">
                      <p className="text-xs text-teal-700">This is a demo preview class. Your enrollment will be submitted for admin review.</p>
                    </div>
                  )}
                  <p className="text-sm text-slate-600">
                    Fee: <strong>PKR {cls.feePkr.toLocaleString()}</strong>
                    {' '}· Pay via bank transfer, EasyPaisa, or card — then submit your proof.
                  </p>
                  <Link
                    href={`/classes/${params.id}/payment`}
                    className="inline-flex rounded-full bg-teal-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-900"
                  >
                    Enroll now →
                  </Link>
                </div>
              )}

              {/* Student — pending approval */}
              {role === 'STUDENT' && enrollStatus === 'pending' && (
                <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-semibold text-amber-800">Waiting for approval</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Your enrollment has been submitted. Admin will review and approve within 24 hours.
                    Check your dashboard for updates.
                  </p>
                  <Link href="/dashboard/student" className="mt-3 inline-flex text-xs text-amber-800 underline">
                    View dashboard →
                  </Link>
                </div>
              )}

              {/* Student — rejected */}
              {role === 'STUDENT' && enrollStatus === 'rejected' && (
                <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-4">
                  <p className="text-sm font-semibold text-red-700">Enrollment rejected</p>
                  <p className="mt-1 text-sm text-red-600">Contact support for more information.</p>
                </div>
              )}

              {/* Student — approved (upcoming or live) */}
              {role === 'STUDENT' && enrollStatus === 'approved' && !joining && (
                <div className={`mt-4 rounded-2xl border p-4 ${isLive ? 'bg-green-50 border-green-200' : 'bg-teal-50 border-teal-200'}`}>
                  <p className={`text-sm font-semibold ${isLive ? 'text-green-700' : 'text-teal-800'}`}>
                    {isLive ? 'Session is live now!' : 'You are enrolled'}
                  </p>
                  {!isLive && (
                    <p className="mt-1 text-sm text-teal-700">
                      Starts {fmt(cls.scheduleTime)}
                    </p>
                  )}
                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                  <button
                    onClick={joinSession}
                    className={`mt-3 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white ${isLive ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-950 hover:bg-teal-900'}`}
                  >
                    {isLive ? 'Join live session →' : 'Join the class →'}
                  </button>
                </div>
              )}

              {/* Demo class — LIVE_NOW — any logged-in user can try it */}
              {cls.isDemo && isLive && role === 'STUDENT' && enrollStatus !== 'approved' && !joining && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-3">This demo session is live right now. Join without enrollment to preview the classroom.</p>
                  <button
                    onClick={joinSession}
                    className="inline-flex rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Join demo session →
                  </button>
                </div>
              )}

              {/* Instructor / Admin */}
              {(role === 'INSTRUCTOR' || role === 'ADMIN') && (
                <div className="mt-4">
                  <Link href="/dashboard/instructor" className="inline-flex rounded-full border border-teal-950 px-5 py-2.5 text-sm font-semibold text-teal-950 hover:bg-teal-50">
                    Manage in dashboard →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {cls.description && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-semibold text-slate-900">Course overview</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{cls.description}</p>
            </div>
          )}

          {/* Recorded class video player — visible to approved students and admins */}
          {cls.type === 'RECORDED' && cls.videoUrl && (role === 'ADMIN' || enrollStatus === 'approved') && (
            <div className="mt-8">
              <h2 className="mb-4 font-semibold text-slate-900">Recorded Session</h2>
              {cls.videoUrl.includes('youtube.com') || cls.videoUrl.includes('youtu.be') || cls.videoUrl.includes('vimeo.com') ? (
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-black" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={cls.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={cls.title}
                  />
                </div>
              ) : (
                <video
                  src={cls.videoUrl}
                  controls
                  className="w-full rounded-3xl border border-slate-200 bg-black"
                  style={{ maxHeight: '560px' }}
                >
                  Your browser does not support video playback.
                </video>
              )}
            </div>
          )}

          {meetingNote && (
            <div className="mt-8 space-y-4">
              <h2 className="font-semibold text-slate-900 text-lg">Session Notes</h2>

              {meetingNote.summary && (
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-2">Summary</p>
                  <p className="text-sm text-teal-900 leading-relaxed">{meetingNote.summary}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {meetingNote.keyTopics.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Key Topics</p>
                    <ul className="space-y-1.5">
                      {meetingNote.keyTopics.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {meetingNote.actionItems.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Homework / Action Items</p>
                    <ul className="space-y-1.5">
                      {meetingNote.actionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-0.5 text-teal-600">☐</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {meetingNote.importantNotes.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-3">Important Notes</p>
                  <ul className="space-y-1.5">
                    {meetingNote.importantNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {meetingNote.quizQuestions.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Review Questions</p>
                  <ol className="space-y-2">
                    {meetingNote.quizQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-slate-700">
                        <span className="font-semibold text-teal-950">{i + 1}.</span> {q}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <main><SiteHeader />
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
        </div>
      </main>
    }>
      <ClassDetailInner params={params} />
    </Suspense>
  );
}
