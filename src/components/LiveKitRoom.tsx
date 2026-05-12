'use client';

import { useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { DisconnectReason } from 'livekit-client';

interface LiveKitRoomProps {
  token: string;
  serverUrl: string;
  userName?: string;
  isInstructor?: boolean;
}

export function LiveKitVideoRoom({ token, serverUrl }: LiveKitRoomProps) {
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);

  if (!token || !serverUrl) {
    return (
      <div className="h-[650px] w-full rounded-3xl border border-slate-200 bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Video room unavailable — missing token or server URL.</p>
      </div>
    );
  }

  if (ended) {
    return (
      <div className="h-[650px] w-full rounded-3xl border border-amber-200 bg-amber-50 flex flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364A9 9 0 1118.364 5.636 9 9 0 015.636 18.364z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0" />
          </svg>
        </div>
        <p className="text-amber-800 text-base font-semibold">Session has ended</p>
        <p className="text-amber-600 text-sm">The instructor has closed this live session.</p>
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
      className="h-[650px] w-full rounded-3xl border border-slate-200 overflow-hidden"
    >
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        video={false}
        audio={false}
        connect={true}
        onDisconnected={(reason) => {
          if (
            reason === DisconnectReason.ROOM_DELETED ||
            reason === DisconnectReason.SERVER_SHUTDOWN
          ) {
            setEnded(true);
          }
        }}
        onError={(err) => setError(err.message)}
        style={{ height: '100%', width: '100%' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
