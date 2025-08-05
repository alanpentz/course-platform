import { createSupabaseServerClient } from '@course-platform/database/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from '../../../../components/profile/profile-form';

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <ProfileForm user={user} profile={profile} />
      </div>
    </div>
  );
}