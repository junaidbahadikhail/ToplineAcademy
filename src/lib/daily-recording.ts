const DAILY_API = 'https://api.daily.co/v1';

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
  };
}

export async function createDailyRoom(roomName: string) {
  const res = await fetch(`${DAILY_API}/rooms`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: roomName,
      properties: {
        enable_recording: 'cloud',
        max_participants: 50,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      },
    }),
  });
  return res.json();
}

export async function startRecording(roomName: string) {
  const res = await fetch(`${DAILY_API}/recordings`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      room_name: roomName,
      layout: { preset: 'default' },
    }),
  });
  if (!res.ok) throw new Error(`Daily recording start failed: ${await res.text()}`);
  return res.json() as Promise<{ id: string; room_name: string; status: string }>;
}

export async function stopRecording(recordingId: string) {
  const res = await fetch(`${DAILY_API}/recordings/${recordingId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ action: 'stop' }),
  });
  if (!res.ok) throw new Error(`Daily recording stop failed: ${await res.text()}`);
  return res.json();
}

export async function getRecording(recordingId: string) {
  const res = await fetch(`${DAILY_API}/recordings/${recordingId}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Get recording failed: ${await res.text()}`);
  return res.json() as Promise<{
    id: string;
    room_name: string;
    status: 'in-progress' | 'finished' | 'deleted';
    duration: number;
    start_ts: number;
  }>;
}

export async function getRecordingAccessLink(recordingId: string) {
  const res = await fetch(`${DAILY_API}/recordings/${recordingId}/access-link`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Access link failed: ${await res.text()}`);
  return res.json() as Promise<{ download_link: string; expires: number }>;
}
