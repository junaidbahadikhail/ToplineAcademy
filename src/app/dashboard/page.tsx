import { SiteHeader } from '@/components/SiteHeader';

export default function DashboardPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Student dashboard</h1>
            <p className="mt-3 text-slate-600">Your enrolled classes, upcoming schedule, and attendance status will appear here after login.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Quick summary</h2>
            <ul className="mt-6 space-y-4 text-slate-600">
              <li>My classes</li>
              <li>Upcoming live sessions</li>
              <li>Attendance history</li>
              <li>Profile and settings</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
