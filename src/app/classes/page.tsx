import { SiteHeader } from '@/components/SiteHeader';

const classes = [
  {
    id: '1',
    title: 'AI Fundamentals for Beginners',
    instructor: 'Mrs. Sana Ali',
    schedule: 'May 15, 2026 · 18:00 PKT',
    fee: '2,500 PKR',
  },
  {
    id: '2',
    title: 'Python for Data Science',
    instructor: 'Mr. Ahmed Raza',
    schedule: 'May 18, 2026 · 20:00 PKT',
    fee: '3,000 PKR',
  },
];

export default function ClassesPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-950/80">Class catalog</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Upcoming classes</h1>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {classes.map((course) => (
            <article key={course.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{course.title}</h2>
              <p className="mt-2 text-slate-600">Instructor: {course.instructor}</p>
              <p className="mt-2 text-slate-600">Schedule: {course.schedule}</p>
              <p className="mt-4 text-lg font-semibold text-teal-950">Fee: {course.fee}</p>
              <a href={`/classes/${course.id}`} className="mt-6 inline-flex rounded-full bg-teal-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-900">
                View class
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
