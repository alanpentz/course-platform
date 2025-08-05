import { createSupabaseServerClient } from '@course-platform/database/server';
import { redirect } from 'next/navigation';
import { DashboardStats } from '../../../components/dashboard/dashboard-stats';
import { RecentCourses } from '../../../components/dashboard/recent-courses';
import { UpcomingLessons } from '../../../components/dashboard/upcoming-lessons';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get dashboard data based on role
  if (profile?.role === 'instructor') {
    return <InstructorDashboard userId={user.id} />;
  }

  return <StudentDashboard userId={user.id} />;
}

async function StudentDashboard({ userId }: { userId: string }) {
  const supabase = createSupabaseServerClient();

  // Get enrolled courses with progress
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get overall stats
  const { count: totalEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const completedCourses = enrollments?.filter(e => e.completed_at)?.length || 0;
  const inProgressCourses = enrollments?.filter(e => !e.completed_at)?.length || 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Learning Dashboard</h1>
      
      <DashboardStats
        stats={[
          { label: 'Enrolled Courses', value: totalEnrollments || 0, icon: '📚' },
          { label: 'In Progress', value: inProgressCourses, icon: '🔄' },
          { label: 'Completed', value: completedCourses, icon: '✅' },
          { label: 'Certificates', value: completedCourses, icon: '🎓' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <RecentCourses enrollments={enrollments || []} />
        <UpcomingLessons userId={userId} />
      </div>
    </div>
  );
}

async function InstructorDashboard({ userId }: { userId: string }) {
  const supabase = createSupabaseServerClient();

  // Get instructor's courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('instructor_id', userId)
    .order('created_at', { ascending: false });

  // Get total students
  const { count: totalStudents } = await supabase
    .from('enrollments')
    .select('user_id', { count: 'exact', head: true })
    .in('course_id', courses?.map(c => c.id) || []);

  const publishedCourses = courses?.filter(c => c.is_published)?.length || 0;
  const draftCourses = courses?.filter(c => !c.is_published)?.length || 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Instructor Dashboard</h1>
      
      <DashboardStats
        stats={[
          { label: 'Total Courses', value: courses?.length || 0, icon: '📚' },
          { label: 'Published', value: publishedCourses, icon: '✅' },
          { label: 'Drafts', value: draftCourses, icon: '📝' },
          { label: 'Total Students', value: totalStudents || 0, icon: '👥' },
        ]}
      />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Courses</h2>
        <div className="grid gap-4">
          {courses?.map(course => (
            <div key={course.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{course.title}</h3>
                  <p className="text-gray-600 mt-1">{course.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  course.is_published 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {course.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}