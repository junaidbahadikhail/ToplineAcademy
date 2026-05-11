import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { startRecording, stopRecording } from '@/lib/daily-recording';
import { waitForRecording, transcribeRecording, analyzeTranscript } from '@/lib/meeting-processor';
import { getDemoClassById } from '@/lib/demo-classes';

interface Params {
  params: { id: string };
}

export async function POST(request: Request, { params }: Params) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: classItem } = await supabaseAdmin
    .from('Class')
    .select('*, instructor:User!instructorId(name)')
    .eq('id', params.id)
    .single();

  if (!classItem) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (classItem.instructorId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not your class.' }, { status: 403 });
  }

  const { action } = await request.json();

  if (action === 'start') {
    const roomName = classItem.meetLink?.split('/').pop() || params.id;
    const rec = await startRecording(roomName);

    await supabaseAdmin
      .from('MeetingNote')
      .upsert({ classId: params.id, recordingId: rec.id }, { onConflict: 'classId' });

    return NextResponse.json({ recordingId: rec.id, status: 'started' });
  }

  if (action === 'stop') {
    const { data: note } = await supabaseAdmin
      .from('MeetingNote')
      .select('recordingId')
      .eq('classId', params.id)
      .single();

    if (!note?.recordingId) {
      return NextResponse.json({ error: 'No active recording found.' }, { status: 400 });
    }

    await stopRecording(note.recordingId);
    return NextResponse.json({ status: 'stopped' });
  }

  if (action === 'process') {
    const { data: note } = await supabaseAdmin
      .from('MeetingNote')
      .select('recordingId')
      .eq('classId', params.id)
      .single();

    if (!note?.recordingId) {
      return NextResponse.json({ error: 'No recording found.' }, { status: 400 });
    }

    const ready = await waitForRecording(note.recordingId);
    if (!ready) {
      return NextResponse.json({ error: 'Recording not ready or was deleted.' }, { status: 400 });
    }

    const transcript = await transcribeRecording(note.recordingId);
    const analysis = await analyzeTranscript(transcript, classItem.title, classItem.subject);

    await supabaseAdmin
      .from('MeetingNote')
      .update({
        transcript,
        summary: analysis.summary,
        keyTopics: analysis.keyTopics,
        actionItems: analysis.actionItems,
        importantNotes: analysis.importantNotes,
        quizQuestions: analysis.quizQuestions ?? [],
      })
      .eq('classId', params.id);

    return NextResponse.json({
      status: 'processed',
      summary: analysis.summary,
      keyTopics: analysis.keyTopics,
    });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}

export async function GET(_request: Request, { params }: Params) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (getDemoClassById(params.id)) return NextResponse.json(null);

  const { data: note } = await supabaseAdmin
    .from('MeetingNote')
    .select('*')
    .eq('classId', params.id)
    .single();

  if (!note) return NextResponse.json(null);

  return NextResponse.json({
    recordingId: note.recordingId,
    summary: note.summary,
    keyTopics: note.keyTopics,
    actionItems: note.actionItems,
    importantNotes: note.importantNotes,
    quizQuestions: note.quizQuestions,
    notionPageId: note.notionPageId,
    createdAt: note.createdAt,
  });
}
