'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@course-platform/types';
import { signOut } from '@course-platform/database';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  user: User;
  profile: Profile | null;
}

export function UserMenu({ user, profile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {profile?.full_name || user.email}
          </p>
          <p className="text-xs text-gray-500 capitalize">{profile?.role || 'Student'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
          {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20">
            <a
              href="/dashboard/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Profile Settings
            </a>
            <hr className="my-1" />
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}