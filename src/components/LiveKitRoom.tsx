'use client';

import { useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
} from '@livekit/components-react';

interface LiveKitRoomProps {
  token: string;
  serverUrl: string;
  userName?: string;
  isInstructor?: boolean;
}

function ConnectionStatus() {
  try {
    const room = useRoomContext();
    const state = room?.state;
    if (state === 'connected') return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
        <div className="text-center text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-medium capitalize">{state ?? 'connecting'}…</p>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}

export function LiveKitVideoRoom({ token, serverUrl }: LiveKitRoomProps) {
  const [error, setError] = useState<string | null>(null);

  if (!token || !serverUrl) {
    return (
      <div className="h-[650px] w-full rounded-3xl border border-slate-200 bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Video room unavailable — missing token or server URL.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[650px] w-full rounded-3xl border border-red-200 bg-red-50 flex flex-col items-center justify-center gap-3">
        <p className="text-red-700 text-sm font-semibold">Connection failed</p>
        <p className="text-red-500 text-xs max-w-xs text-center">{error}</p>
        <button
          onClick={() => setError(null)}
          className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      data-lk-theme="default"
      className="relative h-[650px] w-full rounded-3xl border border-slate-200 overflow-hidden"
    >
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        video={false}
        audio={false}
        connect={true}
        onError={(err) => setError(err.message)}
        style={{ height: '100%', width: '100%' }}
      >
        <ConnectionStatus />
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
