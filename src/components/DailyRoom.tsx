'use client';

import '@livekit/components-styles';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';

interface VideoRoomProps {
  token?: string;
  serverUrl?: string;
  userName?: string;
  isInstructor?: boolean;
  // legacy props kept so call-sites compile during transition
  roomUrl?: string;
  roomName?: string;
  domain?: string;
  jwt?: string;
}

export function DailyRoom({ token, serverUrl, isInstructor }: VideoRoomProps) {
  if (!token || !serverUrl) {
    return (
      <div className="h-[650px] w-full rounded-3xl border border-slate-200 bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Video room unavailable — token or server URL missing.</p>
      </div>
    );
  }

  return (
    <div
      data-lk-theme="default"
      className="h-[650px] w-full rounded-3xl overflow-hidden border border-slate-200"
    >
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        style={{ height: '100%', width: '100%' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
