'use client';

import { useState, useEffect, useCallback } from 'react';
import { SiteHeader } from '@/components/SiteHeader';

type Tab = 'users' | 'enrollments';
type RoleFilter = 'ALL' | 'STUDENT' | 'INSTRUCTOR';
type EnrollmentFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface Stats {
  totalStudents: number;
  totalInstructors: number;
  pendingEnrollments: number;
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
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentFilter>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      .then(setStats)
      .catch(() => {});
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

  useEffect(() => {
    if (!authorized) return;
    fetchStats();
    fetchUsers();
    fetchEnrollments();
  }, [authorized, fetchStats, fetchUsers, fetchEnrollments]);

  const handleRoleFilter = (role: RoleFilter) => {
    setRoleFilter(role);
    fetchUsers(role);
  };

  const handleEnrollmentFilter = (status: EnrollmentFilter) => {
    setEnrollmentFilter(status);
    fetchEnrollments(status);
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

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {(['users', 'enrollments'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-teal-950 text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:border-teal-950'
              }`}
            >
              {tab === 'users' ? 'Users' : 'Enrollments'}
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

        {/* Enrollments Tab */}
        {activeTab === 'enrollments' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-4">
              <span className="text-sm font-medium text-slate-600">Filter:</span>
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as EnrollmentFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleEnrollmentFilter(s)}
                  className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
                    enrollmentFilter === s
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
                    <th className="px-6 py-3 font-semibold text-slate-600">Student</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Class</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Fee (PKR)</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Applied</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400">No enrollments found.</td>
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
