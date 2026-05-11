'use client';

import { useEffect, useRef } from 'react';

interface VideoRoomProps {
  roomName: string;
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

export function DailyRoom({
  roomName,
  domain = 'meet.jit.si',
  token,
  userName,
  isInstructor = false,
}: VideoRoomProps) {
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

  return (
    <div
      ref={containerRef}
      className="h-[650px] w-full rounded-3xl border border-slate-200 bg-slate-900 overflow-hidden"
    />
  );
}
