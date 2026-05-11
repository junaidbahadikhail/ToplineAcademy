const DAILY_API_KEY = process.env.DAILY_API_KEY;
// NEXT_PUBLIC_DAILY_DOMAIN holds the full domain, e.g. 'toplineacademy.daily.co'
const DAILY_DOMAIN = process.env.NEXT_PUBLIC_DAILY_DOMAIN;

export function hasDailyDomain(): boolean {
  return !!DAILY_DOMAIN;
}

export function getDailyRoomUrl(roomName: string): string | null {
  if (!DAILY_DOMAIN) return null;
  // DAILY_DOMAIN already includes the full host (toplineacademy.daily.co)
  return `https://${DAILY_DOMAIN}/${roomName}`;
}

// Create a Daily meeting token so the user joins authenticated (no knock/waiting room)
export async function createDailyMeetingToken(
  roomName: string,
  userName: string,
  isOwner: boolean
): Promise<string | null> {
  if (!DAILY_API_KEY) return null;

  const exp = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
  const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
        exp,
      },
    }),
  });

  if (!res.ok) return null;
  const json = await res.json() as { token?: string };
  return json.token ?? null;
}

// Auto-create or fetch the room via API when DAILY_API_KEY is set
export async function createOrGetDailyRoom(roomName: string): Promise<string | null> {
  if (!DAILY_DOMAIN) return null;
  const roomUrl = `https://${DAILY_DOMAIN}/${roomName}`;

  if (!DAILY_API_KEY) return roomUrl;

  const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
    headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
  });

  if (getRes.ok) return roomUrl;

  // Room doesn't exist yet — create it
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

  if (!createRes.ok) return roomUrl; // fall back to URL even if creation failed
  return roomUrl;
}
