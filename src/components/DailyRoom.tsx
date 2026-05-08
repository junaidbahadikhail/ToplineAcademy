'use client';

import { useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

interface DailyRoomProps {
  roomName: string;
}

export function DailyRoom({ roomName }: DailyRoomProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!frameRef.current) return;

    const domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN;
    if (!domain) {
      console.warn('NEXT_PUBLIC_DAILY_DOMAIN is not configured');
      return;
    }

    const callFrame = DailyIframe.createFrame(frameRef.current, {
      url: `https://${domain}/${roomName}`,
      showLeaveButton: true,
      iframeStyle: {
        position: 'relative',
        width: '100%',
        height: '100%',
      },
    });

    return () => {
      callFrame.destroy();
    };
  }, [roomName]);

  return <div ref={frameRef} className="h-[650px] rounded-3xl border border-slate-200 bg-black" />;
}
