import OpenAI from 'openai';
import { getRecording, getRecordingAccessLink } from '@/lib/daily-recording';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface MeetingAnalysis {
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  importantNotes: string[];
  quizQuestions?: string[];
}

export async function waitForRecording(
  recordingId: string,
  maxAttempts = 20,
  intervalMs = 15000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const rec = await getRecording(recordingId);
    if (rec.status === 'finished') return true;
    if (rec.status === 'deleted') return false;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

export async function transcribeRecording(recordingId: string): Promise<string> {
  if (!openai) throw new Error('OPENAI_API_KEY is not configured.');

  const { download_link } = await getRecordingAccessLink(recordingId);

  const audioResponse = await fetch(download_link);
  if (!audioResponse.ok) throw new Error('Failed to download recording.');

  const buffer = await audioResponse.arrayBuffer();
  const audioFile = new File([buffer], 'session.mp4', { type: 'video/mp4' });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'ur', // Urdu/English mixed (common in Pakistan)
    response_format: 'text',
  });

  return transcription as unknown as string;
}

export async function analyzeTranscript(
  transcript: string,
  className: string,
  subject: string
): Promise<MeetingAnalysis> {
  if (!openai) throw new Error('OPENAI_API_KEY is not configured.');

  const prompt = `You are an educational assistant analyzing a class session transcript for Topline Academy, a Pakistani online learning platform.

Class: ${className}
Subject: ${subject}

Transcript:
"""
${transcript.slice(0, 12000)}
"""

Analyze this class transcript and return a JSON object with exactly these fields:
{
  "summary": "A clear 3-5 sentence overview of what was taught in this session.",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "actionItems": ["Action or homework item 1", "Action or homework item 2"],
  "importantNotes": ["Important concept or note 1", "Important concept or note 2"],
  "quizQuestions": ["Question to test understanding 1", "Question 2"]
}

Keep language simple and suitable for students. If the transcript is in Urdu or mixed Urdu/English, respond in English.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const raw = response.choices[0].message.content || '{}';
  return JSON.parse(raw) as MeetingAnalysis;
}

