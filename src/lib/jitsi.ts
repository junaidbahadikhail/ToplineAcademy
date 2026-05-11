import jwt from 'jsonwebtoken';

const JAAS_APP_ID = process.env.JAAS_APP_ID;
const JAAS_KEY_ID = process.env.JAAS_KEY_ID ?? 'default';
// Vercel stores multiline values with literal \n — restore real newlines
const JAAS_PRIVATE_KEY = process.env.JAAS_PRIVATE_KEY?.replace(/\\n/g, '\n');

export function hasJaasConfig(): boolean {
  return !!(JAAS_APP_ID && JAAS_PRIVATE_KEY);
}

export interface JitsiRoomConfig {
  domain: string;
  roomName: string;
  jwt?: string;
}

export function getJitsiRoomConfig(
  baseRoomName: string,
  userId: string,
  userName: string,
  userEmail: string,
  isModerator: boolean
): JitsiRoomConfig {
  if (!JAAS_APP_ID || !JAAS_PRIVATE_KEY) {
    // No JaaS credentials — fall back to public meet.jit.si (moderator screen may appear)
    return { domain: 'meet.jit.si', roomName: baseRoomName };
  }

  const now = Math.floor(Date.now() / 1000);

  const token = jwt.sign(
    {
      iss: 'chat',
      aud: 'jitsi',
      iat: now,
      exp: now + 7200,
      nbf: now - 10,
      room: '*',
      sub: JAAS_APP_ID,
      context: {
        user: {
          id: userId,
          name: userName,
          email: userEmail,
          moderator: isModerator,
        },
        features: {
          recording: false,
          livestreaming: false,
          'outbound-call': false,
          transcription: false,
        },
      },
    },
    JAAS_PRIVATE_KEY,
    {
      algorithm: 'RS256',
      keyid: `${JAAS_APP_ID}/${JAAS_KEY_ID}`,
    } as jwt.SignOptions
  );

  return {
    domain: '8x8.vc',
    roomName: `${JAAS_APP_ID}/${baseRoomName}`,
    jwt: token,
  };
}
