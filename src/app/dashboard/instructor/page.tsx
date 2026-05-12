'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { DailyRoom } from '@/components/DailyRoom';

interface ClassItem {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  scheduleTime: string;
  status: string;
  feePkr: number;
  maxStudents: number;
  meetLink: string | null;
  _count: { enrollments: number };
  enrollments: { id: string }[];
  meetingNote: { summary: string | null; keyTopics: string[]; recordingId: string | null } | null;
}

interface RecordingState {
  recordingId: string | null;
  phase: 'idle' | 'recording' | 'stopped' | 'processing' | 'done';
  summary?: string;
  error?: string;
}

interface AttendanceStudent {
  id: string;
  enrollmentId: string;
  name: string;
  email: string;
  attended: boolean;
  saved: boolean;
}

const statusColor: Record<string, string> = {
  UPCOMING: 'bg-blue-50 text-blue-700 border-blue-200',
  LIVE_NOW: 'bg-green-100 text-green-700 border-green-200',
  ENDED: 'bg-slate-100 text-slate-500 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Karachi',
  }) + ' PKT';
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function InstructorDashboardPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [instructorName, setInstructorName] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveClassId, setLiveClassId] = useState<string | null>(null);
  const [liveRoomConfig, setLiveRoomConfig] = useState<{ roomUrl?: string; roomName: string; domain: string; jwt?: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', subject: '', description: '', scheduleTime: '', maxStudents: '', feePkr: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', subject: '', description: '', scheduleTime: '', maxStudents: '25', feePkr: '3000' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Record<string, RecordingState>>({});
  const [attendanceOpen, setAttendanceOpen] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStudent[]>>({});
  const [attendanceSaving, setAttendanceSaving] = useState<string | null>(null);

  const fetchClasses = () => {
    fetch('/api/dashboard/instructor')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ClassItem[]) => {
        setClasses(Array.isArray(data) ? data : []);
        setLoading(false);
        setRecordings((prev) => {
          const next = { ...prev };
          for (const cls of data) {
            if (cls.meetingNote?.summary && !next[cls.id]) {
              next[cls.id] = {
                recordingId: cls.meetingNote.recordingId,
                phase: 'done',
                summary: cls.meetingNote.summary,
              };
            }
          }
          return next;
        });
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((me) => {
        if (!me.user || (me.user.role !== 'INSTRUCTOR' && me.user.role !== 'ADMIN')) {
          setAuthorized(false);
          return;
        }
        setInstructorName(me.user.name ?? null);
        setAuthorized(true);
        fetchClasses();
      })
      .catch(() => setAuthorized(false));
  }, []);

  const startEdit = (cls: ClassItem) => {
    setEditingId(cls.id);
    setEditForm({
      title: cls.title,
      subject: cls.subject,
      description: cls.description || '',
      scheduleTime: toDatetimeLocal(cls.scheduleTime),
      maxStudents: String(cls.maxStudents),
      feePkr: String(cls.feePkr),
    });
  };

  const saveEdit = async (id: string) => {
    setActionLoading(id + '-edit');
    await fetch(`/api/classes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title,
        subject: editForm.subject,
        description: editForm.description,
        scheduleTime: new Date(editForm.scheduleTime + ':00+05:00').toISOString(),
        maxStudents: Number(editForm.maxStudents),
        feePkr: Number(editForm.feePkr),
      }),
    });
    setEditingId(null);
    setActionLoading(null);
    fetchClasses();
  };

  const openVideo = async (classId: string) => {
    const res = await fetch(`/api/classes/${classId}/join`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setLiveClassId(classId);
      setLiveRoomConfig({ roomUrl: data.roomUrl ?? undefined, roomName: data.roomName, domain: data.domain ?? 'meet.jit.si', jwt: data.token ?? undefined });
    }
  };

  const controlSession = async (id: string, action: 'start' | 'end') => {
    setActionLoading(id + '-session');
    await fetch(`/api/classes/${id}/session`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (action === 'start') {
      await openVideo(id);
    } else if (liveClassId === id) {
      setLiveClassId(null);
      setLiveRoomConfig(null);
    }
    setActionLoading(null);
    fetchClasses();
  };

  const recordingAction = async (classId: string, action: 'start' | 'stop' | 'process') => {
    setRecordings((prev) => ({
      ...prev,
      [classId]: {
        ...prev[classId],
        recordingId: prev[classId]?.recordingId ?? null,
        phase: action === 'start' ? 'recording' : action === 'stop' ? 'stopped' : 'processing',
        error: undefined,
      },
    }));
    try {
      const res = await fetch(`/api/classes/${classId}/recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      if (action === 'start') {
        setRecordings((prev) => ({ ...prev, [classId]: { recordingId: data.recordingId, phase: 'recording' } }));
      } else if (action === 'stop') {
        setRecordings((prev) => ({ ...prev, [classId]: { ...prev[classId], phase: 'stopped' } }));
      } else {
        setRecordings((prev) => ({
          ...prev,
          [classId]: { ...prev[classId], phase: 'done', summary: data.summary },
        }));
      }
    } catch (err: unknown) {
      setRecordings((prev) => ({
        ...prev,
        [classId]: { ...prev[classId], phase: prev[classId]?.phase === 'processing' ? 'stopped' : 'idle', error: (err as Error).message },
      }));
    }
  };

  const openAttendance = async (classId: string) => {
    if (attendanceOpen === classId) { setAttendanceOpen(null); return; }
    setAttendanceOpen(classId);
    if (attendanceData[classId]) return;
    const res = await fetch(`/api/attendance/${classId}`);
    if (!res.ok) return;
    const rows = await res.json() as Array<{
      id: string;
      student: { id: string; name: string; email: string };
      attendance: { attended: boolean } | null;
    }>;
    setAttendanceData((prev) => ({
      ...prev,
      [classId]: rows.map((r) => ({
        id: r.student.id,
        enrollmentId: r.id,
        name: r.student.name,
        email: r.student.email,
        attended: r.attendance?.attended ?? false,
        saved: !!r.attendance,
      })),
    }));
  };

  const toggleAttended = (classId: string, enrollmentId: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [classId]: (prev[classId] ?? []).map((s) =>
        s.enrollmentId === enrollmentId ? { ...s, attended: !s.attended } : s
      ),
    }));
  };

  const saveAttendance = async (classId: string) => {
    setAttendanceSaving(classId);
    const records = (attendanceData[classId] ?? []).map((s) => ({
      enrollmentId: s.enrollmentId,
      attended: s.attended,
    }));
    await fetch(`/api/attendance/${classId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    setAttendanceData((prev) => ({
      ...prev,
      [classId]: (prev[classId] ?? []).map((s) => ({ ...s, saved: true })),
    }));
    setAttendanceSaving(null);
  };

  const createClass = async () => {
    setCreateLoading(true);
    setCreateError(null);
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...createForm,
        scheduleTime: new Date(createForm.scheduleTime + ':00+05:00').toISOString(),
        maxStudents: Number(createForm.maxStudents),
        feePkr: Number(createForm.feePkr),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error); } else {
      setShowCreate(false);
      setCreateForm({ title: '', subject: '', description: '', scheduleTime: '', maxStudents: '25', feePkr: '3000' });
      fetchClasses();
    }
    setCreateLoading(false);
  };

  if (authorized === null || (authorized && loading && classes.length === 0)) return (
    <main className="min-h-screen bg-slate-50"><SiteHeader />
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
      </div>
    </main>
  );

  if (!authorized) return (
    <main className="min-h-screen bg-slate-50"><SiteHeader />
      <div className="mx-auto max-w-xl py-24 text-center">
        <p className="text-slate-600">Please <Link href="/login" className="underline text-teal-950">login</Link> as an instructor.</p>
      </div>
    </main>
  );

  const liveClass = liveClassId ? classes.find((c) => c.id === liveClassId) : null;
  const totalStudents = classes.reduce((s, c) => s + c.enrollments.length, 0);
  const liveCount = classes.filter((c) => c.status === 'LIVE_NOW').length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const nameParts = instructorName?.split(' ') ?? [];
  const firstName = nameParts.find((p) => p !== 'Ms.' && p !== 'Mr.' && p !== 'Dr.' && p.length > 1) ?? nameParts[0] ?? 'Instructor';

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Live video */}
        {liveClassId && liveRoomConfig && (
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Broadcasting: {classes.find((c) => c.id === liveClassId)?.title ?? 'Live session'}
              </span>
              <button
                onClick={() => { if (liveClassId) controlSession(liveClassId, 'end'); }}
                className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                End session
              </button>
            </div>
            <DailyRoom
              roomUrl={liveRoomConfig.roomUrl}
              roomName={liveRoomConfig.roomUrl ? undefined : liveRoomConfig.roomName}
              domain={liveRoomConfig.domain}
              token={liveRoomConfig.jwt}
              userName={instructorName ?? undefined}
              isInstructor
            />
          </div>
        )}

        {/* Coursera-style greeting header */}
        <div className="mb-8 rounded-2xl bg-teal-950 p-8 text-white">
          <p className="text-teal-300 text-sm font-medium">{greeting},</p>
          <h1 className="mt-1 text-3xl font-bold">{firstName}!</h1>
          <p className="mt-2 text-teal-200 text-sm">
            {classes.length} class{classes.length !== 1 ? 'es' : ''} · {totalStudents} enrolled student{totalStudents !== 1 ? 's' : ''}
            {liveCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-300">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />{liveCount} live now
              </span>
            )}
          </p>
          <div className="mt-5">
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="inline-flex rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-teal-950 hover:bg-amber-300 transition"
            >
              {showCreate ? 'Cancel' : '+ Create class'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'My Classes', value: classes.length, icon: '📚' },
            { label: 'Enrolled Students', value: totalStudents, icon: '👥' },
            { label: 'Live Now', value: liveCount, icon: '🔴' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="text-3xl font-bold text-teal-950">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Create class form */}
        {showCreate && (
          <div className="mb-8 rounded-2xl border border-teal-200 bg-teal-50 p-6">
            <h2 className="mb-4 font-semibold text-teal-900">New Class</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Title', key: 'title', type: 'text', placeholder: 'e.g. AI Fundamentals' },
                { label: 'Subject', key: 'subject', type: 'text', placeholder: 'e.g. Artificial Intelligence' },
                { label: 'Schedule (PKT)', key: 'scheduleTime', type: 'datetime-local', placeholder: '' },
                { label: 'Max students', key: 'maxStudents', type: 'number', placeholder: '25' },
                { label: 'Fee (PKR)', key: 'feePkr', type: 'number', placeholder: '3000' },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="text-sm font-medium text-slate-700">{f.label}</span>
                  <input
                    type={f.type}
                    value={(createForm as Record<string, string>)[f.key]}
                    onChange={(e) => setCreateForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-950 focus:outline-none"
                  />
                </label>
              ))}
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-950 focus:outline-none"
                />
              </label>
            </div>
            {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}
            <button
              onClick={createClass}
              disabled={createLoading}
              className="mt-4 rounded-full bg-teal-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
            >
              {createLoading ? 'Creating…' : 'Create class'}
            </button>
          </div>
        )}

        {/* Classes list */}
        <h2 className="mb-4 text-lg font-semibold text-slate-900">My Classes</h2>

        {loading && (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
          </div>
        )}

        {!loading && classes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
            No classes yet. Create your first class above.
          </div>
        )}

        <div className="space-y-4">
          {classes.map((cls) => {
            const isLive = cls.status === 'LIVE_NOW';
            const isEditing = editingId === cls.id;
            const sessionBusy = actionLoading === cls.id + '-session';
            const editBusy = actionLoading === cls.id + '-edit';

            return (
              <div key={cls.id} className={`rounded-2xl border p-6 ${isLive ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
                {isEditing ? (
                  <div>
                    <h3 className="mb-4 font-semibold text-slate-900">Edit Class</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {([
                        { label: 'Title', key: 'title', type: 'text' },
                        { label: 'Subject', key: 'subject', type: 'text' },
                        { label: 'Schedule (PKT)', key: 'scheduleTime', type: 'datetime-local' },
                        { label: 'Max students', key: 'maxStudents', type: 'number' },
                        { label: 'Fee (PKR)', key: 'feePkr', type: 'number' },
                      ] as const).map((f) => (
                        <label key={f.key} className="block">
                          <span className="text-sm font-medium text-slate-700">{f.label}</span>
                          <input
                            type={f.type}
                            value={editForm[f.key]}
                            onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-950 focus:outline-none"
                          />
                        </label>
                      ))}
                      <label className="block sm:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Description</span>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                          rows={2}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-950 focus:outline-none"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => saveEdit(cls.id)}
                        disabled={editBusy}
                        className="rounded-full bg-teal-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
                      >
                        {editBusy ? 'Saving…' : 'Save changes'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor[cls.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {isLive ? '● LIVE NOW' : cls.status}
                        </span>
                        <span className="text-xs text-slate-400">{cls._count.enrollments} enrolled · {cls.enrollments.length} approved</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 truncate">{cls.title}</h3>
                      <p className="text-sm text-slate-500">{cls.subject}</p>
                      <p className="mt-1 text-sm text-slate-600">{fmt(cls.scheduleTime)}</p>
                      <p className="text-sm font-semibold text-teal-950 mt-1">{cls.feePkr.toLocaleString()} PKR · max {cls.maxStudents} students</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-start">
                      <Link href={`/classes/${cls.id}`} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        View page
                      </Link>
                      {cls.status !== 'ENDED' && cls.status !== 'CANCELLED' && (
                        <button
                          onClick={() => startEdit(cls)}
                          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Edit schedule
                        </button>
                      )}
                      {!isLive && cls.status === 'UPCOMING' && (
                        <button
                          onClick={() => controlSession(cls.id, 'start')}
                          disabled={sessionBusy}
                          className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          {sessionBusy ? '…' : 'Start session'}
                        </button>
                      )}
                      {isLive && (
                        <>
                          <button
                            onClick={() => openVideo(cls.id)}
                            className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Open video
                          </button>
                          {recordings[cls.id]?.phase !== 'recording' ? (
                            <button
                              onClick={() => recordingAction(cls.id, 'start')}
                              className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600 flex items-center gap-1"
                            >
                              <span className="h-2 w-2 rounded-full bg-white inline-block" /> Record
                            </button>
                          ) : (
                            <button
                              onClick={() => recordingAction(cls.id, 'stop')}
                              className="rounded-full bg-slate-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 flex items-center gap-1"
                            >
                              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse inline-block" /> Stop REC
                            </button>
                          )}
                          <button
                            onClick={() => { controlSession(cls.id, 'end'); }}
                            disabled={sessionBusy}
                            className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {sessionBusy ? '…' : 'End session'}
                          </button>
                        </>
                      )}
                      {cls.status === 'ENDED' && (
                        <button
                          onClick={() => openAttendance(cls.id)}
                          className="rounded-full border border-teal-950 px-4 py-1.5 text-xs font-semibold text-teal-950 hover:bg-teal-50"
                        >
                          {attendanceOpen === cls.id ? 'Close attendance' : 'Mark attendance'}
                        </button>
                      )}
                      {cls.status === 'ENDED' && recordings[cls.id]?.phase === 'stopped' && (
                        <button
                          onClick={() => recordingAction(cls.id, 'process')}
                          className="rounded-full bg-teal-950 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-900"
                        >
                          Generate notes
                        </button>
                      )}
                      {cls.status === 'ENDED' && recordings[cls.id]?.phase === 'processing' && (
                        <span className="rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold text-amber-700 flex items-center gap-1">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-700 border-t-transparent inline-block" /> Processing…
                        </span>
                      )}
                      {recordings[cls.id]?.phase === 'done' && (
                        <span className="rounded-full bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-800">
                          Notes saved
                        </span>
                      )}
                    </div>
                    {recordings[cls.id]?.error && (
                      <p className="mt-2 w-full text-xs text-red-600">{recordings[cls.id]?.error}</p>
                    )}
                    {recordings[cls.id]?.phase === 'done' && recordings[cls.id]?.summary && (
                      <div className="mt-3 w-full rounded-xl bg-teal-50 border border-teal-200 p-3">
                        <p className="text-xs font-semibold text-teal-800 mb-1">Session Summary</p>
                        <p className="text-xs text-teal-700">{recordings[cls.id]?.summary}</p>
                      </div>
                    )}

                    {/* Attendance panel */}
                    {attendanceOpen === cls.id && (
                      <div className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-800 mb-3">Attendance — {cls.title}</p>
                        {!attendanceData[cls.id] ? (
                          <p className="text-xs text-slate-400">Loading…</p>
                        ) : attendanceData[cls.id].length === 0 ? (
                          <p className="text-xs text-slate-400">No approved students in this class.</p>
                        ) : (
                          <>
                            <div className="space-y-2 mb-4">
                              {attendanceData[cls.id].map((s) => (
                                <div key={s.enrollmentId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                                    <p className="text-xs text-slate-400">{s.email}</p>
                                  </div>
                                  <button
                                    onClick={() => toggleAttended(cls.id, s.enrollmentId)}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                      s.attended
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    {s.attended ? 'Present' : 'Absent'}
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => saveAttendance(cls.id)}
                              disabled={attendanceSaving === cls.id}
                              className="rounded-full bg-teal-950 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
                            >
                              {attendanceSaving === cls.id ? 'Saving…' : 'Save attendance'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
