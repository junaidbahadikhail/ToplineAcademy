import { SiteHeader } from '@/components/SiteHeader';

export default function AdminPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Admin dashboard</h1>
          <p className="mt-4 text-slate-600">Manage classes, review enrollments, and administer users from one place.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {['Total students', 'Pending enrollments', 'Live classes', 'Attendance records'].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-500">{item}</p>
                <p className="mt-4 text-3xl font-bold text-teal-950">0</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
