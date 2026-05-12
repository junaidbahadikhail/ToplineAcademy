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
  return (
    <div className="h-[650px] w-full rounded-3xl border border-slate-200 bg-slate-900 overflow-hidden" data-lk-theme="default">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        video={false}
        audio={false}
        style={{ height: '100%' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
