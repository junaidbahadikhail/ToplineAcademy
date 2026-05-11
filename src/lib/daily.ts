const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN; // e.g. 'toplineacademy' — required for iframe embed

export function hasDailyDomain(): boolean {
  return !!DAILY_DOMAIN;
}

export function getDailyRoomUrl(roomName: string): string | null {
  if (!DAILY_DOMAIN) return null;
  return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
}

// Optional: auto-create rooms via API when DAILY_API_KEY is also set
export async function createOrGetDailyRoom(roomName: string): Promise<string | null> {
  if (!DAILY_API_KEY || !DAILY_DOMAIN) return getDailyRoomUrl(roomName);

  const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
    headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
  });

  if (getRes.ok) return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;

  const createRes = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        enable_prejoin_ui: false,
        enable_chat: false,
        enable_knocking: false,
        start_audio_off: true,
      },
    }),
  });

  if (!createRes.ok) return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
  return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
}
