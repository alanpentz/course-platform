import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createSupabaseEdgeClient } from '@course-platform/database/edge';
import { NextRequest } from 'next/server';

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract token and get user
    const token = authHeader.replace('Bearer ', '');
    const supabase = createSupabaseEdgeClient();
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract the `messages`, `context`, and metadata from the body
    const { messages, context, lessonId, courseId } = await req.json();

    // Build the system prompt with context
    const systemPrompt = `You are an AI tutor helping students learn. Be encouraging, clear, and concise.
${context ? `\nContext: ${context}` : ''}
${lessonId ? `\nCurrent lesson ID: ${lessonId}` : ''}
${courseId ? `\nCurrent course ID: ${courseId}` : ''}

Guidelines:
- Answer questions related to the lesson content
- Provide examples when helpful
- Break down complex concepts into simple steps
- Encourage the student when they're struggling
- If asked about unrelated topics, gently redirect to the lesson material`;

    // Save the interaction start to database
    if (lessonId || courseId) {
      await supabase.from('ai_interactions').insert({
        user_id: user.id,
        lesson_id: lessonId || null,
        course_id: courseId || null,
        interaction_type: 'chat',
        query: messages[messages.length - 1]?.content || '',
      });
    }

    // Create a streaming response
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      temperature: 0.7,
      system: systemPrompt,
      messages,
    });

    // Return the streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}