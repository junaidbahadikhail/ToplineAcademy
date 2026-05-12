'use client';

import { useEffect, useRef, useState } from 'react';
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

function DailyCoRoom({
  roomUrl,
  token,
  userName,
  isInstructor = false,
}: {
  roomUrl: string;
  token?: string;
  userName?: string;
  isInstructor?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<ReturnType<typeof DailyIframe.createFrame> | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    setRoomError(null);

    let frame: ReturnType<typeof DailyIframe.createFrame> | null = null;
    try {
      frame = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: { width: '100%', height: '100%', border: 'none' },
        showLeaveButton: true,
        showFullscreenButton: true,
      });
      frameRef.current = frame;

      frame
        .join({
          url: roomUrl,
          token: token || undefined,
          userName: userName || undefined,
          startVideoOff: !isInstructor,
          startAudioOff: !isInstructor,
        })
        .catch((err: unknown) => {
          setRoomError((err as Error)?.message ?? 'Failed to join the room.');
        });

      frame.on('error', (event: { errorMsg?: string }) => {
        setRoomError(event?.errorMsg ?? 'Daily.co room error.');
      });
    } catch (err: unknown) {
      setRoomError((err as Error)?.message ?? 'Failed to initialise video room.');
    }

    return () => {
      if (frameRef.current) {
        try { frameRef.current.destroy(); } catch { /* ignore */ }
        frameRef.current = null;
      }
    };
  }, [roomUrl, token, userName, isInstructor]);

  if (roomError) {
    return (
      <div className={`${containerClass} flex items-center justify-center`}>
        <div className="text-center px-6">
          <p className="text-red-400 font-semibold mb-1">Could not connect to video room</p>
          <p className="text-slate-400 text-sm">{roomError}</p>
          <p className="text-slate-500 text-xs mt-2">Check that NEXT_PUBLIC_DAILY_DOMAIN is set correctly in Vercel.</p>
        </div>
      </div>
    );
  }

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
    return <DailyCoRoom roomUrl={roomUrl} token={token} userName={userName} isInstructor={isInstructor} />;
  }
  if (roomName) {
    return <JitsiRoom roomName={roomName} domain={domain} token={token} userName={userName} isInstructor={isInstructor} />;
  }
  return null;
}
