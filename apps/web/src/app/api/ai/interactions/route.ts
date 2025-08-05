import { createSupabaseEdgeClient } from '@course-platform/database/edge';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract token and get user
    const token = authHeader.replace('Bearer ', '');
    const supabase = createSupabaseEdgeClient();
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId, courseId, query, type } = await req.json();

    if (!query || !type) {
      return NextResponse.json(
        { error: 'Query and type are required' },
        { status: 400 }
      );
    }

    // Save the interaction to database
    const { data, error: insertError } = await supabase.from('ai_interactions').insert({
      user_id: user.id,
      lesson_id: lessonId || null,
      course_id: courseId || null,
      interaction_type: type,
      query: query,
    }).select().single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('AI Interaction Save Error:', error);
    return NextResponse.json(
      { error: 'Failed to save interaction' },
      { status: 500 }
    );
  }
}