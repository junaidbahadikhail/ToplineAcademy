'use client';

import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';

interface LiveKitRoomProps {
  token: string;
  serverUrl: string;
  userName?: string;
  isInstructor?: boolean;
}

export function LiveKitVideoRoom({ token, serverUrl }: LiveKitRoomProps) {
  if (!token || !serverUrl) {
    return (
      <div className="h-[650px] w-full rounded-3xl border border-slate-200 bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Video room unavailable — missing token or server URL.</p>
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
        video={true}
        audio={true}
        style={{ height: '100%', width: '100%' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
