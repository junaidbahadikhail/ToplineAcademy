import { SiteHeader } from '@/components/SiteHeader';

export default function ProfilePage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Your profile</h1>
          <p className="mt-3 text-slate-600">Update your name, phone, city, and profile photo.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-700">Name</p>
              <p className="mt-2 text-slate-600">Muhammad Ali</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-700">Email</p>
              <p className="mt-2 text-slate-600">muhammad@example.com</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
