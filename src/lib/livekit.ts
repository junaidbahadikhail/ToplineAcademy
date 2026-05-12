import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY ?? '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET ?? '';
export const LIVEKIT_URL = process.env.LIVEKIT_URL ?? '';

export function hasLiveKit(): boolean {
  return !!(LIVEKIT_API_KEY && LIVEKIT_API_SECRET && LIVEKIT_URL);
}

function getRoomServiceClient(): RoomServiceClient {
  const host = LIVEKIT_URL.replace(/^wss?:\/\//, 'https://');
  return new RoomServiceClient(host, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}

export async function createLiveKitToken(
  roomName: string,
  identity: string,
  name: string,
  isOwner: boolean,
): Promise<string | null> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return null;

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name,
    ttl: '2h',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomCreate: isOwner,
  });

  return at.toJwt();
}

export async function closeRoom(roomName: string): Promise<void> {
  if (!hasLiveKit()) return;
  try {
    const client = getRoomServiceClient();
    await client.deleteRoom(roomName);
  } catch {
    // Room may not exist yet — not an error
  }
}
