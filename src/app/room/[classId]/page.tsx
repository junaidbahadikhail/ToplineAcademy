'use client';

import '@livekit/components-styles';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useParticipants,
  useRoomInfo,
} from '@livekit/components-react';

interface ClassInfo {
  title: string;
  subject: string;
  status: string;
  instructor: { name: string };
}

function RoomTopBar({
  classInfo,
  role,
  classId,
  onLeave,
}: {
  classInfo: ClassInfo | null;
  role: string | null;
  classId: string;
  onLeave: () => void;
}) {
  const participants = useParticipants();
  const { name: roomName } = useRoomInfo();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const endSession = async () => {
    await fetch(`/api/classes/${classId}/session`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    });
    onLeave();
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
      {/* Left: class info */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{classInfo?.title ?? roomName}</p>
          <p className="text-xs text-white/60">{classInfo?.subject}</p>
        </div>
      </div>

      {/* Centre: stats */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-white/70">
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" />
          </svg>
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </span>
        <span className="font-mono">{fmtTime(elapsed)}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        {(role === 'INSTRUCTOR' || role === 'ADMIN') && (
          <button
            onClick={endSession}
            className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
          >
            End session
          </button>
        )}
        <button
          onClick={onLeave}
          className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition backdrop-blur-sm"
        >
          Leave
        </button>
      </div>
    </div>
  );
}

function RoomContent({
  classInfo,
  role,
  classId,
  onLeave,
}: {
  classInfo: ClassInfo | null;
  role: string | null;
  classId: string;
  onLeave: () => void;
}) {
  return (
    <div className="relative h-full w-full">
      <RoomTopBar classInfo={classInfo} role={role} classId={classId} onLeave={onLeave} />
      <VideoConference />
      <RoomAudioRenderer />
    </div>
  );
}

export default function RoomPage({ params }: { params: { classId: string } }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const classId = params.classId;

  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, classRes, joinRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/classes/${classId}`),
          fetch(`/api/classes/${classId}/join`, { method: 'POST' }),
        ]);

        const me = meRes.ok ? await meRes.json() : { user: null };
        const cls = classRes.ok ? await classRes.json() : null;
        const join = await joinRes.json();

        setRole(me.user?.role ?? null);
        if (cls && !cls.error) setClassInfo(cls);

        if (!joinRes.ok) {
          setError(join.error ?? 'Unable to join this session.');
          setLoading(false);
          return;
        }

        setToken(join.token);
        setServerUrl(join.serverUrl);
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [classId]);

  const handleLeave = useCallback(() => {
    if (role === 'INSTRUCTOR' || role === 'ADMIN') {
      router.push('/dashboard/instructor');
    } else {
      router.push('/dashboard/student');
    }
  }, [role, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Connecting to room…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="max-w-sm rounded-2xl border border-red-800 bg-red-950/50 p-8 text-center">
          <p className="text-lg font-semibold text-red-300">Cannot join session</p>
          <p className="mt-2 text-sm text-red-400">{error}</p>
          <button
            onClick={handleLeave}
            className="mt-6 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400 text-sm">Room credentials missing.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950" data-lk-theme="default">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        video={true}
        audio={true}
        onDisconnected={handleLeave}
        style={{ height: '100%', width: '100%' }}
      >
        <RoomContent classInfo={classInfo} role={role} classId={classId} onLeave={handleLeave} />
      </LiveKitRoom>
    </div>
  );
}
