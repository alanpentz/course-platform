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

    const { code, language, lessonId, courseId } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Create a completion for code review
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: `You are an experienced code reviewer. Analyze the code and provide:
1. A list of issues with line numbers and severity (error/warning/info)
2. Suggestions for improvement
3. An overall assessment
Focus on code quality, best practices, potential bugs, and ${language} specific conventions.
Format your response as JSON.`,
        },
        {
          role: 'user',
          content: `Review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
    });

    let reviewResult;
    try {
      // Try to parse the AI response as JSON
      const responseText = completion.choices[0]?.message?.content || '{}';
      reviewResult = JSON.parse(responseText);
    } catch {
      // Fallback structure if JSON parsing fails
      reviewResult = {
        issues: [],
        suggestions: ['Unable to parse code review. Please try again.'],
        overall: 'Code review failed to process correctly.',
      };
    }

    // Ensure the response has the expected structure
    const review = {
      issues: reviewResult.issues || [],
      suggestions: reviewResult.suggestions || [],
      overall: reviewResult.overall || 'No overall assessment provided.',
    };

    // Save the interaction to database
    if (lessonId || courseId) {
      await supabase.from('ai_interactions').insert({
        user_id: user.id,
        lesson_id: lessonId || null,
        course_id: courseId || null,
        interaction_type: 'code_review',
        query: code,
        response: JSON.stringify(review),
      });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('AI Review Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code review' },
      { status: 500 }
    );
  }
}