'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    setLoading(false);
    if (!response.ok) {
      setError(data.error || 'Registration failed.');
      return;
    }

    setMessage('Your account has been created. Please login to continue.');
    setForm({ name: '', email: '', phone: '', city: '', password: '' });
  };

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-950/80">Student registration</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Create your Topline account</h1>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Full name</span>
                <input
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                  placeholder="Ahmed Khan"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Phone (Pakistan)</span>
                <input
                  value={form.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  type="tel"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                  placeholder="0312 1234567"
                />
              </label>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                  placeholder="ahmed@example.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">City</span>
                <input
                  value={form.city}
                  onChange={(event) => handleChange('city', event.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                  placeholder="Lahore"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                value={form.password}
                onChange={(event) => handleChange('password', event.target.value)}
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                placeholder="Create a strong password"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-teal-950">{message}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Registering…' : 'Register'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-teal-950 underline">
              Login here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
