import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@course-platform/database/server';
import { sanityClient } from '@course-platform/sanity-client';
import { courseBySlugQuery, lessonBySlugQuery } from '@course-platform/sanity-client';

// Verify webhook secret
const WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('sanity-webhook-secret');
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { _type, slug, _id } = body;

  const supabase = createSupabaseServerClient();

  try {
    switch (_type) {
      case 'course': {
        // Fetch full course data from Sanity
        const course = await sanityClient.fetch(courseBySlugQuery, {
          slug: slug?.current,
        });

        if (!course) {
          // Course was deleted
          await supabase
            .from('courses')
            .delete()
            .eq('slug', slug?.current);
          break;
        }

        // Get instructor ID from Supabase
        const { data: instructor } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', course.instructor.email)
          .single();

        if (!instructor) {
          console.error('Instructor not found:', course.instructor.email);
          return NextResponse.json({ error: 'Instructor not found' }, { status: 400 });
        }

        // Upsert course in Supabase
        await supabase
          .from('courses')
          .upsert({
            title: course.title,
            description: course.description,
            slug: course.slug.current,
            instructor_id: instructor.id,
            thumbnail_url: course.thumbnail,
            price: course.price,
            is_published: course.isPublished,
          }, {
            onConflict: 'slug',
          });

        break;
      }

      case 'lesson': {
        // Fetch full lesson data from Sanity
        const lesson = await sanityClient.fetch(lessonBySlugQuery, {
          slug: slug?.current,
        });

        if (!lesson) {
          // Lesson was deleted
          await supabase
            .from('lessons')
            .delete()
            .eq('slug', slug?.current);
          break;
        }

        // For lessons, we need to find the course they belong to
        // This would require additional logic to track course-lesson relationships
        
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}