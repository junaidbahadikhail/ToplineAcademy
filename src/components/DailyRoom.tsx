'use client';

import { useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

interface VideoRoomProps {
  roomUrl?: string;   // Daily.co full URL (preferred)
  roomName?: string;  // Jitsi room name (fallback)
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

function DailyCoRoom({ roomUrl, userName }: { roomUrl: string; userName?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<ReturnType<typeof DailyIframe.createFrame> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const frame = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: { width: '100%', height: '100%', border: 'none' },
      showLeaveButton: true,
      showFullscreenButton: true,
    });
    frameRef.current = frame;

    frame.join({ url: roomUrl, userName: userName || undefined });

    return () => {
      frame.destroy();
      frameRef.current = null;
    };
  }, [roomUrl, userName]);

  return <div ref={containerRef} className={containerClass} />;
}

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
    return <DailyCoRoom roomUrl={roomUrl} userName={userName} />;
  }
  if (roomName) {
    return <JitsiRoom roomName={roomName} domain={domain} token={token} userName={userName} isInstructor={isInstructor} />;
  }
  return null;
}
