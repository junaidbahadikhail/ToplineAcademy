import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

const features = [
  'Schedule live and recorded classes',
  'Manual payment approval for JazzCash / EasyPaisa / bank transfer',
  'Role-based dashboard for students, instructors, and admins',
  'Attendance tracking and PKT schedule display',
];

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-950/80">Topline Academy</p>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Pakistan&apos;s branded online classroom for AI and tech students.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Build, schedule, and manage live classes with payment verification and recordings in one place. Designed for
                fast, lightweight delivery on Pakistani internet.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/classes" className="inline-flex items-center justify-center rounded-full bg-teal-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900">
                  Browse Classes
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-950 hover:text-teal-950">
                  Register Now
                </Link>
              </div>
            </div>
            <div className="rounded-3xl bg-teal-950/5 p-8">
              <h2 className="text-xl font-semibold text-teal-950">MVP features</h2>
              <ul className="mt-6 space-y-4 text-slate-700">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-950 text-sm font-semibold text-white">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
