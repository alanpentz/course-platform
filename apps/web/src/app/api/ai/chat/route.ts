import { OpenAIStream, StreamingTextResponse } from 'ai';
import { OpenAI } from 'openai';
import { createSupabaseEdgeClient } from '@course-platform/database/edge';
import { NextRequest } from 'next/server';

// Create an OpenAI API client (that's edge friendly)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Create a chat completion using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response, {
      onStart: async () => {
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
      },
    });

    // Respond with the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}