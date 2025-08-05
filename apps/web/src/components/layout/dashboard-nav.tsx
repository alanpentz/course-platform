'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

interface DashboardNavProps {
  userRole: 'student' | 'instructor' | 'admin';
}

export function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname();

  const studentNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'My Courses', href: '/dashboard/courses', icon: '📚' },
    { label: 'Browse Courses', href: '/dashboard/browse', icon: '🔍' },
    { label: 'Progress', href: '/dashboard/progress', icon: '📊' },
  ];

  const instructorNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'My Courses', href: '/dashboard/courses', icon: '📚' },
    { label: 'Create Course', href: '/dashboard/courses/create', icon: '➕' },
    { label: 'Students', href: '/dashboard/students', icon: '👥' },
    { label: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
  ];

  const adminNavItems: NavItem[] = [
    ...instructorNavItems,
    { label: 'All Courses', href: '/dashboard/admin/courses', icon: '🎓' },
    { label: 'All Users', href: '/dashboard/admin/users', icon: '👤' },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
  ];

  const navItems = 
    userRole === 'admin' ? adminNavItems :
    userRole === 'instructor' ? instructorNavItems :
    studentNavItems;

  return (
    <nav className="p-4 space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
              isActive
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}