'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  role: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setForm({ name: data.user.name, phone: data.user.phone, city: data.user.city || '' });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to save.');
    } else {
      setUser(data.user);
      setEditing(false);
      setSuccess(true);
    }
    setSaving(false);
  };

  if (loading) return (
    <main><SiteHeader />
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
      </div>
    </main>
  );

  if (!user) return (
    <main><SiteHeader />
      <div className="mx-auto max-w-xl py-24 text-center text-slate-500">
        Please <Link href="/login" className="underline text-teal-950">login</Link> to view your profile.
      </div>
    </main>
  );

  const roleDashboard = user.role === 'ADMIN' ? '/admin' : user.role === 'INSTRUCTOR' ? '/dashboard/instructor' : '/dashboard/student';

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-teal-950/70">Account</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Your Profile</h1>
            </div>
            <span className="rounded-full bg-teal-950 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wide">
              {user.role}
            </span>
          </div>

          {success && (
            <div className="mb-6 rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 font-medium">
              Profile updated successfully.
            </div>
          )}

          {editing ? (
            <div className="space-y-5">
              {[
                { label: 'Full name', key: 'name' as const, type: 'text', placeholder: 'Ahmed Khan' },
                { label: 'Phone (Pakistan)', key: 'phone' as const, type: 'tel', placeholder: '0312 1234567' },
                { label: 'City', key: 'city' as const, type: 'text', placeholder: 'Lahore' },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="text-sm font-medium text-slate-700">{f.label}</span>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-teal-950 focus:outline-none"
                  />
                </label>
              ))}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-full bg-teal-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  onClick={() => { setEditing(false); setError(null); }}
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Full name', value: user.name },
                { label: 'Email', value: user.email },
                { label: 'Phone', value: user.phone },
                { label: 'City', value: user.city || '—' },
              ].map((f) => (
                <div key={f.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{f.label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{f.value}</p>
                </div>
              ))}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full bg-teal-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-900"
                >
                  Edit profile
                </button>
                <Link
                  href={roleDashboard}
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
