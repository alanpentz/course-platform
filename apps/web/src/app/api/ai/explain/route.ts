import { OpenAI } from 'openai';
import { createSupabaseEdgeClient } from '@course-platform/database/edge';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const { concept, context, lessonId, courseId } = await req.json();

    if (!concept) {
      return NextResponse.json({ error: 'Concept is required' }, { status: 400 });
    }

    // Create a completion for explanation
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `You are an expert tutor. Explain concepts clearly and concisely. Use simple language and provide examples when helpful.`,
        },
        {
          role: 'user',
          content: `Explain the concept: "${concept}"${context ? `\n\nContext: ${context}` : ''}`,
        },
      ],
    });

    const explanation = completion.choices[0]?.message?.content || 'Unable to generate explanation.';

    // Save the interaction to database
    if (lessonId || courseId) {
      await supabase.from('ai_interactions').insert({
        user_id: user.id,
        lesson_id: lessonId || null,
        course_id: courseId || null,
        interaction_type: 'explanation',
        query: concept,
        response: explanation,
      });
    }

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('AI Explain Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}