import OpenAI from 'openai';
import { Client } from '@notionhq/client';
import { getRecording, getRecordingAccessLink } from '@/lib/daily-recording';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const notion = process.env.NOTION_API_KEY
  ? new Client({ auth: process.env.NOTION_API_KEY })
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

export async function saveMeetingNotesToNotion(data: {
  classId: string;
  className: string;
  subject: string;
  instructorName: string;
  sessionDate: string;
  duration: number;
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  importantNotes: string[];
  quizQuestions: string[];
  transcript: string;
}): Promise<string | null> {
  if (!notion || !process.env.NOTION_MEETINGS_DB) return null;

  const dateStr = new Date(data.sessionDate).toISOString().split('T')[0];
  const durationMin = Math.round(data.duration / 60);

  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_MEETINGS_DB },
    icon: { type: 'emoji', emoji: '📚' },
    properties: {
      Name: {
        title: [{ text: { content: `${data.className} — ${new Date(data.sessionDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}` } }],
      },
      Class: { select: { name: data.className.slice(0, 100) } },
      Subject: { select: { name: data.subject.slice(0, 100) } },
      Instructor: { rich_text: [{ text: { content: data.instructorName } }] },
      Date: { date: { start: dateStr } },
      'Duration (min)': { number: durationMin },
      'Key Topics': {
        multi_select: data.keyTopics.slice(0, 10).map((t) => ({ name: t.slice(0, 100) })),
      },
      'Class ID': { rich_text: [{ text: { content: data.classId } }] },
    },
    children: [
      // Summary
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '📝 Session Summary' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: data.summary } }] },
      },
      { object: 'block', type: 'divider', divider: {} },

      // Key Topics
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '🎯 Key Topics Covered' } }] },
      },
      ...data.keyTopics.map((topic) => ({
        object: 'block' as const,
        type: 'bulleted_list_item' as const,
        bulleted_list_item: { rich_text: [{ type: 'text' as const, text: { content: topic } }] },
      })),
      { object: 'block', type: 'divider', divider: {} },

      // Action Items
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '✅ Action Items & Homework' } }] },
      },
      ...(data.actionItems.length > 0
        ? data.actionItems.map((item) => ({
            object: 'block' as const,
            type: 'to_do' as const,
            to_do: {
              rich_text: [{ type: 'text' as const, text: { content: item } }],
              checked: false,
            },
          }))
        : [{ object: 'block' as const, type: 'paragraph' as const, paragraph: { rich_text: [{ type: 'text' as const, text: { content: 'No specific action items for this session.' } }] } }]),
      { object: 'block', type: 'divider', divider: {} },

      // Important Notes
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '💡 Important Notes' } }] },
      },
      ...data.importantNotes.map((note) => ({
        object: 'block' as const,
        type: 'bulleted_list_item' as const,
        bulleted_list_item: {
          rich_text: [{ type: 'text' as const, text: { content: note } }],
        },
      })),
      { object: 'block', type: 'divider', divider: {} },

      // Quiz Questions
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '❓ Review Questions' } }] },
      },
      ...data.quizQuestions.map((q, i) => ({
        object: 'block' as const,
        type: 'numbered_list_item' as const,
        numbered_list_item: {
          rich_text: [{ type: 'text' as const, text: { content: q } }],
        },
      })),
      { object: 'block', type: 'divider', divider: {} },

      // Full Transcript (truncated to fit Notion limits)
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '📜 Transcript' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: data.transcript.slice(0, 2000) + (data.transcript.length > 2000 ? '…' : '') } }],
        },
      },
    ],
  });

  return page.id;
}
