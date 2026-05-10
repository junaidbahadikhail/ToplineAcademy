'use client';

import { useEffect } from 'react';
import { SiteHeader } from '@/components/SiteHeader';

export default function DashboardPage() {
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const role = data?.user?.role;
        if (role === 'STUDENT') window.location.replace('/dashboard/student');
        else if (role === 'INSTRUCTOR') window.location.replace('/dashboard/instructor');
        else if (role === 'ADMIN') window.location.replace('/admin');
        else window.location.replace('/login');
      })
      .catch(() => window.location.replace('/login'));
  }, []);

  return (
    <main>
      <SiteHeader />
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
      </div>
    </main>
  );
}
