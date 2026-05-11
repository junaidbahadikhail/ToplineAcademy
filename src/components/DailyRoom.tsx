'use client';

interface VideoRoomProps {
  roomName: string;
  token?: string;
  userName?: string;
}

export function DailyRoom({ roomName, userName }: VideoRoomProps) {
  const clean = roomName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const display = encodeURIComponent(userName || 'Student');
  const src = [
    `https://meet.jit.si/${clean}`,
    `#userInfo.displayName="${display}"`,
    `&config.startWithAudioMuted=true`,
    `&config.disableDeepLinking=true`,
    `&config.prejoinPageEnabled=false`,
    `&interfaceConfig.SHOW_JITSI_WATERMARK=false`,
    `&interfaceConfig.SHOW_BRAND_WATERMARK=false`,
  ].join('');

  return (
    <iframe
      src={src}
      allow="camera; microphone; fullscreen; display-capture; autoplay"
      className="h-[650px] w-full rounded-3xl border border-slate-200 bg-slate-900"
      title="Live Session"
    />
  );
}
