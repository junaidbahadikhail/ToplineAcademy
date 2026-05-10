'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { DailyRoom } from '@/components/DailyRoom';

interface ClassDetail {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  instructor: { name: string };
  scheduleTime: string;
  timezone: string;
  meetLink: string | null;
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

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [enrollStatus, setEnrollStatus] = useState<EnrollStatus>('none');
  const [joining, setJoining] = useState(false);
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [joinRoomName, setJoinRoomName] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
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
    setJoinToken(data.token);
    setJoinRoomName(data.roomName);
    setJoining(true);
  };

  const router = useRouter();

  const enroll = async () => {
    if (role !== 'STUDENT') {
      router.push(`/login?redirect=/classes/${params.id}`);
      return;
    }

    if (!proofFile) {
      setError('Please upload your payment screenshot before submitting.');
      return;
    }

    setEnrolling(true);
    setError(null);

    // Step 1: get signed upload URL from server
    const uploadRes = await fetch('/api/storage/payment-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: params.id, filename: proofFile.name }),
    });

    if (!uploadRes.ok) {
      const d = await uploadRes.json();
      setError(d.error || 'Failed to prepare upload.');
      setEnrolling(false);
      return;
    }

    const { signedUrl, path } = await uploadRes.json();

    // Step 2: PUT file directly to Supabase Storage
    const putRes = await fetch(signedUrl, {
      method: 'PUT',
      body: proofFile,
      headers: { 'Content-Type': proofFile.type || 'application/octet-stream' },
    });

    if (!putRes.ok) {
      setError('Upload failed. Please try again with a smaller image (under 5 MB).');
      setEnrolling(false);
      return;
    }

    // Step 3: create enrollment with proof path
    const res = await fetch(`/api/classes/${params.id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentProofUrl: path }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        router.push(`/login?redirect=/classes/${params.id}`);
        setEnrolling(false);
        return;
      }
      setError(data.error || 'Unable to enroll.');
    } else {
      setEnrollStatus('pending');
      setProofFile(null);
    }
    setEnrolling(false);
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
  const canJoin = joining && !!joinToken && !!joinRoomName;

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Live video */}
        {canJoin && joinRoomName && (
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live session
              </span>
              <button
                onClick={() => { setJoining(false); setJoinToken(null); setJoinRoomName(null); }}
                className="text-sm text-slate-500 underline"
              >
                Leave
              </button>
            </div>
            <DailyRoom roomName={joinRoomName} token={joinToken ?? undefined} />
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

              {cls.isDemo ? (
                <div className="mt-4 rounded-2xl bg-teal-50 border border-teal-200 p-4">
                  <p className="text-sm font-semibold text-teal-800">Demo class</p>
                  <p className="mt-1 text-sm text-teal-700">This is a preview. Register on Topline Academy to enroll in real classes.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/register" className="inline-flex rounded-full bg-teal-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-900">
                      Create account
                    </Link>
                    <Link href="/classes" className="inline-flex rounded-full border border-teal-950 px-5 py-2.5 text-sm font-semibold text-teal-950 hover:bg-teal-50">
                      Browse real classes
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {role === null && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-slate-500">Sign in or create an account to enroll in this class.</p>
                      <div className="flex flex-wrap gap-3">
                        <Link href="/login" className="inline-flex rounded-full bg-teal-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-900">
                          Login
                        </Link>
                        <Link href="/register" className="inline-flex rounded-full border border-teal-950 px-5 py-2.5 text-sm font-semibold text-teal-950 hover:bg-teal-50">
                          Create account
                        </Link>
                      </div>
                    </div>
                  )}

                  {role === 'STUDENT' && enrollStatus === 'none' && (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-800">How to enroll</p>
                        <ol className="mt-2 space-y-1 text-sm text-amber-700 list-decimal list-inside">
                          <li>Transfer <strong>PKR {cls.feePkr.toLocaleString()}</strong> via EasyPaisa, JazzCash, or bank transfer</li>
                          <li>Take a screenshot of your payment confirmation</li>
                          <li>Upload it below and submit — admin will approve within 24 hours</li>
                        </ol>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Payment screenshot <span className="text-red-500">*</span></p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                          onChange={(e) => { setProofFile(e.target.files?.[0] ?? null); setError(null); }}
                          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-teal-950 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-900 cursor-pointer"
                        />
                        {proofFile && (
                          <p className="mt-1 text-xs text-teal-700">Selected: {proofFile.name}</p>
                        )}
                      </div>
                      {error && <p className="text-sm text-red-600">{error}</p>}
                      <button
                        onClick={enroll}
                        disabled={enrolling || !proofFile}
                        className="inline-flex rounded-full bg-teal-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {enrolling ? 'Submitting…' : 'Submit enrollment'}
                      </button>
                    </div>
                  )}

                  {role === 'STUDENT' && enrollStatus === 'pending' && (
                    <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                      <p className="text-sm font-semibold text-amber-800">Enrollment pending</p>
                      <p className="mt-1 text-sm text-amber-700">Admin will review your enrollment. Check your dashboard for updates.</p>
                    </div>
                  )}

                  {role === 'STUDENT' && enrollStatus === 'rejected' && (
                    <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-4">
                      <p className="text-sm font-semibold text-red-700">Enrollment rejected</p>
                      <p className="mt-1 text-sm text-red-600">Contact support for more information.</p>
                    </div>
                  )}

                  {role === 'STUDENT' && enrollStatus === 'approved' && !isLive && (
                    <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-4">
                      <p className="text-sm font-semibold text-green-700">You are enrolled</p>
                      <p className="mt-1 text-sm text-green-600">You can join when the session goes live.</p>
                      <Link href="/dashboard/student" className="mt-3 inline-flex text-sm underline text-green-700">View in dashboard →</Link>
                    </div>
                  )}

                  {role === 'STUDENT' && enrollStatus === 'approved' && isLive && !joining && (
                    <div className="mt-4">
                      <p className="text-sm text-green-700 font-semibold mb-3">Session is live!</p>
                      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                      <button
                        onClick={joinSession}
                        className="inline-flex rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Join live session →
                      </button>
                    </div>
                  )}

                  {(role === 'INSTRUCTOR' || role === 'ADMIN') && (
                    <div className="mt-4">
                      <Link href="/dashboard/instructor" className="inline-flex rounded-full border border-teal-950 px-5 py-2.5 text-sm font-semibold text-teal-950 hover:bg-teal-50">
                        Manage in dashboard →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {cls.description && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-semibold text-slate-900">Course overview</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{cls.description}</p>
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
