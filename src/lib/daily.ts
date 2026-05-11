const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN; // e.g. 'toplineacademy'

export function hasDailyConfig(): boolean {
  return !!(DAILY_API_KEY && DAILY_DOMAIN);
}

export function getDailyRoomUrl(roomName: string): string | null {
  if (!DAILY_DOMAIN) return null;
  return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
}

export async function createOrGetDailyRoom(roomName: string): Promise<string | null> {
  if (!DAILY_API_KEY || !DAILY_DOMAIN) return null;

  // Check if room already exists
  const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
    headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
  });

  if (getRes.ok) {
    return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
  }

  // Create room with no moderator requirement and no prejoin UI
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
        start_video_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // expires in 8 hours
      },
    }),
  });

  if (!createRes.ok) return null;
  return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
}
