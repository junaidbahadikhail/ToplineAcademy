import { SiteHeader } from '@/components/SiteHeader';

export default function ClassDetailPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-950/80">Class detail</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">AI Fundamentals for Beginners</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-slate-600">Instructor: Mrs. Sana Ali</p>
                <p className="text-slate-600">Schedule: May 15, 2026 · 18:00 PKT</p>
                <p className="text-slate-600">Type: Live class</p>
                <p className="text-slate-600">Max seats: 50</p>
                <p className="text-slate-600">Fee: 2,500 PKR</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-700">Enrollment</p>
                <p className="mt-3 text-slate-600">Send payment proof after submitting your enrollment request.</p>
                <a href="/register" className="mt-6 inline-flex rounded-full bg-teal-950 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-900">
                  Enroll now
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Course overview</h2>
              <p className="mt-4 text-slate-600">
                Learn the fundamentals of AI, Python, and practical machine learning concepts in a format optimized for Pakistani students. This live session is designed to run smoothly over local internet and includes manual payment verification.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
