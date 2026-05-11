'use client';

import { useEffect, useRef } from 'react';

interface VideoRoomProps {
  roomUrl?: string;   // Daily.co full URL → renders as iframe (no moderator screen)
  roomName?: string;  // Jitsi room name → uses External API
  domain?: string;
  token?: string;
  userName?: string;
  isInstructor?: boolean;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => { dispose: () => void };
  }
}

const containerClass = 'h-[650px] w-full rounded-3xl border border-slate-200 bg-slate-900 overflow-hidden';

// Daily.co prebuilt iframe — no moderator requirement, no login screen
function DailyIframe({ roomUrl, userName }: { roomUrl: string; userName?: string }) {
  const url = new URL(roomUrl);
  if (userName) url.searchParams.set('userName', userName);
  url.searchParams.set('showLeaveButton', '1');

  return (
    <iframe
      src={url.toString()}
      allow="camera; microphone; fullscreen; speaker-selection; display-capture; compute-pressure"
      className={containerClass}
      title="Live Session"
    />
  );
}

// Jitsi External API — used when Daily.co is not configured
function JitsiRoom({ roomName, domain = 'meet.jit.si', token, userName, isInstructor = false }: {
  roomName: string; domain?: string; token?: string; userName?: string; isInstructor?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scriptSrc = `https://${domain}/external_api.js`;
    const scriptId = `jitsi-api-${domain.replace(/\./g, '-')}`;

    const init = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }

      apiRef.current = new window.JitsiMeetExternalAPI(domain, {
        roomName,
        jwt: token || undefined,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName: userName || (isInstructor ? 'Instructor' : 'Student') },
        configOverwrite: {
          startWithAudioMuted: !isInstructor,
          startWithVideoMuted: !isInstructor,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          startWithoutModerator: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
          DEFAULT_BACKGROUND: '#0f172a',
        },
      });
    };

    const existing = document.getElementById(scriptId);
    if (existing && window.JitsiMeetExternalAPI) {
      init();
    } else if (existing) {
      existing.addEventListener('load', init, { once: true });
    } else {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = scriptSrc;
      s.async = true;
      s.onload = init;
      document.head.appendChild(s);
    }

    return () => {
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
    };
  }, [roomName, domain, token, userName, isInstructor]);

  return <div ref={containerRef} className={containerClass} />;
}

export function DailyRoom({ roomUrl, roomName, domain, token, userName, isInstructor }: VideoRoomProps) {
  if (roomUrl) {
    return <DailyIframe roomUrl={roomUrl} userName={userName} />;
  }
  if (roomName) {
    return <JitsiRoom roomName={roomName} domain={domain} token={token} userName={userName} isInstructor={isInstructor} />;
  }
  return null;
}
