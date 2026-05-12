'use client';

import { useState, useEffect, useCallback } from 'react';
import { SiteHeader } from '@/components/SiteHeader';

type Tab = 'users' | 'enrollments' | 'classes';
type RoleFilter = 'ALL' | 'STUDENT' | 'INSTRUCTOR';
type EnrollmentFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
type ClassFilter = 'ALL' | 'PENDING' | 'APPROVED';

interface Stats {
  totalStudents: number;
  totalInstructors: number;
  pendingEnrollments: number;
  pendingClasses: number;
  totalClasses: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  _count: { enrollments: number };
}

interface Enrollment {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  paymentProofUrl: string | null;
  createdAt: string;
  approvedAt: string | null;
  student: { id: string; name: string; email: string; phone: string };
  class: { id: string; title: string; subject: string; feePkr: number; scheduleTime: string };
}

interface AdminClass {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  scheduleTime: string;
  feePkr: number;
  maxStudents: number;
  status: string;
  isApproved: boolean;
  instructor: { id: string; name: string; email: string };
}

const roleBadge: Record<string, string> = {
  STUDENT: 'bg-blue-50 text-blue-700 border-blue-200',
  INSTRUCTOR: 'bg-purple-50 text-purple-700 border-purple-200',
  ADMIN: 'bg-teal-50 text-teal-700 border-teal-200',
};

const statusBadge: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [approvedClasses, setApprovedClasses] = useState<AdminClass[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [enrollmentFilter, _setEnrollmentFilter] = useState<EnrollmentFilter>('PENDING');
  const [classFilter, setClassFilter] = useState<ClassFilter>('PENDING');
  const [createVisible, setCreateVisible] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', subject: '', description: '', scheduleTime: '', maxStudents: '25', feePkr: '3000' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ database: string; resend: string; daily: string; openai: string } | null>(null);
  const [defaultTabSet, setDefaultTabSet] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.role === 'ADMIN') {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      })
      .catch(() => setAuthorized(false));
  }, []);

  const fetchStats = useCallback(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const fetchHealthStatus = useCallback(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealthStatus({
        database: data.database || 'unknown',
        resend: data.resend || 'unknown',
        daily: data.daily || 'unknown',
        openai: data.openai || 'unknown',
      }))
      .catch(() => setHealthStatus({ database: 'failed', resend: 'failed', daily: 'failed', openai: 'failed' }));
  }, []);

  const fetchUsers = useCallback((role: RoleFilter = 'ALL') => {
    const url = role === 'ALL' ? '/api/admin/users' : `/api/admin/users?role=${role}`;
    fetch(url)
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  const fetchEnrollments = useCallback((status: EnrollmentFilter = 'PENDING') => {
    const url = `/api/admin/enrollments?status=${status}`;
    fetch(url)
      .then((r) => r.json())
      .then(setEnrollments)
      .catch(() => {});
  }, []);

  const fetchClasses = useCallback((status: ClassFilter = 'PENDING') => {
    const url = `/api/admin/classes?status=${status}`;
    fetch(url)
      .then((r) => r.json())
      .then(setClasses)
      .catch(() => {});
  }, []);

  const fetchApprovedClasses = useCallback(() => {
    fetch('/api/admin/classes?status=APPROVED')
      .then((r) => r.json())
      .then(setApprovedClasses)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authorized) return;
    fetchStats();
    fetchUsers();
    fetchEnrollments();
    fetchClasses();
    fetchApprovedClasses();
    fetchHealthStatus();
  }, [authorized, fetchStats, fetchUsers, fetchEnrollments, fetchClasses, fetchApprovedClasses, fetchHealthStatus]);

  useEffect(() => {
    if (defaultTabSet || !stats) return;
    if (stats.pendingClasses > 0) {
      setActiveTab('classes');
    } else if (stats.pendingEnrollments > 0) {
      setActiveTab('enrollments');
    }
    setDefaultTabSet(true);
  }, [defaultTabSet, stats]);

  const handleRoleFilter = (role: RoleFilter) => {
    setRoleFilter(role);
    fetchUsers(role);
  };


  const handleClassFilter = (status: ClassFilter) => {
    setClassFilter(status);
    fetchClasses(status);
  };

  const patchUser = async (id: string, patch: Partial<{ role: string; isVerified: boolean; isActive: boolean }>) => {
    setActionLoading(id);
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setActionLoading(null);
    fetchUsers(roleFilter);
    fetchStats();
  };

  const patchEnrollment = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(id);
    await fetch(`/api/admin/enrollments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    fetchEnrollments(enrollmentFilter);
    fetchStats();
  };

  const viewProof = async (path: string) => {
    const res = await fetch(`/api/storage/payment-proof?path=${encodeURIComponent(path)}`);
    if (res.ok) {
      const { signedUrl } = await res.json();
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const patchClassApproval = async (id: string, approve: boolean) => {
    setActionLoading(id);
    await fetch(`/api/admin/classes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: approve }),
    });
    setActionLoading(null);
    fetchClasses(classFilter);
    fetchStats();
  };

  const createClass = async () => {
    setCreateError(null);
    setCreateLoading(true);
    const response = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: createForm.title,
        subject: createForm.subject,
        description: createForm.description,
        scheduleTime: createForm.scheduleTime ? new Date(createForm.scheduleTime + ':00+05:00').toISOString() : '',
        maxStudents: Number(createForm.maxStudents),
        feePkr: Number(createForm.feePkr),
      }),
    });

    const data = await response.json();
    setCreateLoading(false);

    if (!response.ok) {
      setCreateError(data.error || 'Unable to create class.');
      return;
    }

    setCreateVisible(false);
    setCreateForm({ title: '', subject: '', description: '', scheduleTime: '', maxStudents: '25', feePkr: '3000' });
    fetchClasses(classFilter);
    fetchApprovedClasses();
    fetchStats();
  };

  if (authorized === null) {
    return (
      <main>
        <SiteHeader />
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main>
        <SiteHeader />
        <section className="mx-auto max-w-xl px-4 py-24 text-center">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10">
            <p className="text-2xl font-bold text-red-700">Access Denied</p>
            <p className="mt-3 text-sm text-red-600">You must be an admin to view this page.</p>
          </div>
        </section>
      </main>
    );
  }

  const statCards = [
    { label: 'Total students', value: stats?.totalStudents ?? '—' },
    { label: 'Total instructors', value: stats?.totalInstructors ?? '—' },
    { label: 'Pending enrollments', value: stats?.pendingEnrollments ?? '—' },
    { label: 'Pending classes', value: stats?.pendingClasses ?? '—' },
    { label: 'Total classes', value: stats?.totalClasses ?? '—' },
  ];

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-950/70">Superuser</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-4xl font-bold text-teal-950">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Class schedule</p>
                <p className="mt-1 text-xs text-slate-400">Approved classes appear on the admin calendar.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {approvedClasses.length > 0 ? (
                approvedClasses.slice(0, 5).map((cls) => (
                  <div key={cls.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{cls.title}</p>
                        <p className="text-xs text-slate-500">{cls.subject}</p>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p>{new Date(cls.scheduleTime).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <p>{new Date(cls.scheduleTime).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-400">
                  No approved classes scheduled yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Create class</p>
                <p className="mt-1 text-xs text-slate-400">Admin-created classes are published immediately.</p>
              </div>
              <button
                onClick={() => setCreateVisible((v) => !v)}
                className="rounded-full bg-teal-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
              >
                {createVisible ? 'Cancel' : 'New class'}
              </button>
            </div>

            {createVisible && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Title</span>
                    <input
                      value={createForm.title}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Subject</span>
                    <input
                      value={createForm.subject}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, subject: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Schedule</span>
                    <input
                      type="datetime-local"
                      value={createForm.scheduleTime}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, scheduleTime: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Fee (PKR)</span>
                    <input
                      type="number"
                      value={createForm.feePkr}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, feePkr: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Max students</span>
                    <input
                      type="number"
                      value={createForm.maxStudents}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, maxStudents: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-teal-950 focus:outline-none"
                    />
                  </label>
                </div>
                {createError && <p className="text-sm text-red-600">{createError}</p>}
                <button
                  onClick={createClass}
                  disabled={createLoading}
                  className="rounded-full bg-teal-950 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50"
                >
                  {createLoading ? 'Creating…' : 'Create class'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Service health</p>
              <p className="mt-1 text-xs text-slate-400">Live status for platform integrations.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Database', key: 'database' as const },
              { label: 'Resend (Email)', key: 'resend' as const },
              { label: 'Daily (Video)', key: 'daily' as const },
              { label: 'OpenAI (AI Notes)', key: 'openai' as const },
            ].map(({ label, key }) => {
              const val = healthStatus?.[key] ?? 'loading';
              const color = val === 'loading' ? 'text-slate-400'
                : val === 'connected' || val === 'healthy' || val === 'reachable' || val === 'configured' ? 'text-green-600'
                : val === 'partially configured' ? 'text-amber-600'
                : val === 'missing' ? 'text-slate-500'
                : 'text-red-600';
              return (
                <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className={`mt-2 text-base font-semibold ${color}`}>{val}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {(['users', 'enrollments', 'classes'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-teal-950 text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:border-teal-950'
              }`}
            >
              {tab === 'users' ? 'Users' : tab === 'enrollments' ? 'Enrollments' : 'Classes'}
              {tab === 'enrollments' && stats?.pendingEnrollments ? (
                <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  {stats.pendingEnrollments} pending
                </span>
              ) : null}
              {tab === 'classes' && stats?.pendingClasses ? (
                <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {stats.pendingClasses} pending
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-4">
              <span className="text-sm font-medium text-slate-600">Filter:</span>
              {(['ALL', 'STUDENT', 'INSTRUCTOR'] as RoleFilter[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleFilter(r)}
                  className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
                    roleFilter === r
                      ? 'border-teal-950 bg-teal-950 text-white'
                      : 'border-slate-300 text-slate-600 hover:border-teal-950'
                  }`}
                >
                  {r === 'ALL' ? 'All' : r === 'STUDENT' ? 'Students' : 'Instructors'}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-6 py-3 font-semibold text-slate-600">Name</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Email</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Role</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Verified</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Active</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Enrollments</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">No users found.</td>
                    </tr>
                  )}
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.phone}{user.city ? ` · ${user.city}` : ''}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadge[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.isVerified ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {user.isVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user._count.enrollments}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.role === 'INSTRUCTOR' && !user.isVerified && (
                            <button
                              disabled={actionLoading === user.id}
                              onClick={() => patchUser(user.id, { isVerified: true })}
                              className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {user.role === 'STUDENT' && (
                            <button
                              disabled={actionLoading === user.id}
                              onClick={() => patchUser(user.id, { role: 'INSTRUCTOR' })}
                              className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                            >
                              Make Instructor
                            </button>
                          )}
                          {user.isActive ? (
                            <button
                              disabled={actionLoading === user.id}
                              onClick={() => patchUser(user.id, { isActive: false })}
                              className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              disabled={actionLoading === user.id}
                              onClick={() => patchUser(user.id, { isActive: true })}
                              className="rounded-full border border-green-300 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-4">
              <span className="text-sm font-medium text-slate-600">Filter:</span>
              {(['PENDING', 'APPROVED', 'ALL'] as ClassFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleClassFilter(s)}
                  className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
                    classFilter === s
                      ? 'border-teal-950 bg-teal-950 text-white'
                      : 'border-slate-300 text-slate-600 hover:border-teal-950'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-6 py-3 font-semibold text-slate-600">Title</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Subject</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Schedule</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Fee</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Instructor</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">No classes found.</td>
                    </tr>
                  )}
                  {classes.map((cls) => (
                    <tr key={cls.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{cls.title}</td>
                      <td className="px-6 py-4 text-slate-600">{cls.subject}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <p>{new Date(cls.scheduleTime).toLocaleDateString('en-PK', { dateStyle: 'medium' })}</p>
                        <p className="text-xs text-slate-400">{new Date(cls.scheduleTime).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{cls.feePkr.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls.isApproved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {cls.isApproved ? 'Approved' : 'Pending approval'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{cls.instructor.name}</td>
                      <td className="px-6 py-4">
                        {cls.isApproved ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <button
                            disabled={actionLoading === cls.id}
                            onClick={() => patchClassApproval(cls.id, true)}
                            className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enrollments Tab */}
        {activeTab === 'enrollments' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-6 py-3 font-semibold text-slate-600">Student</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Class</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Fee (PKR)</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Proof</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Applied</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">No enrollments found.</td>
                    </tr>
                  )}
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{enrollment.student.name}</p>
                        <p className="text-xs text-slate-400">{enrollment.student.email}</p>
                        <p className="text-xs text-slate-400">{enrollment.student.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{enrollment.class.title}</p>
                        <p className="text-xs text-slate-400">{enrollment.class.subject}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(enrollment.class.scheduleTime).toLocaleDateString('en-PK', {
                            dateStyle: 'medium',
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {enrollment.class.feePkr.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {enrollment.paymentProofUrl ? (
                          <button
                            onClick={() => viewProof(enrollment.paymentProofUrl!)}
                            className="text-xs font-semibold text-teal-700 underline hover:text-teal-950"
                          >
                            View proof
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge[enrollment.status]}`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(enrollment.createdAt).toLocaleDateString('en-PK', { dateStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4">
                        {enrollment.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              disabled={actionLoading === enrollment.id}
                              onClick={() => patchEnrollment(enrollment.id, 'APPROVED')}
                              className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoading === enrollment.id}
                              onClick={() => patchEnrollment(enrollment.id, 'REJECTED')}
                              className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {enrollment.status !== 'PENDING' && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
