'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

type PaymentMethod = 'bank' | 'easypaisa' | 'card';

interface ClassInfo {
  id: string;
  title: string;
  subject: string;
  feePkr: number;
  instructor: { name: string };
  isDemo?: boolean;
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}

export default function PaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>('bank');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/classes/${params.id}`),
      fetch('/api/auth/me'),
    ]).then(async ([clsRes, meRes]) => {
      const clsData = clsRes.ok ? await clsRes.json() : null;
      const meData = meRes.ok ? await meRes.json() : { user: null };

      if (!meData.user || meData.user.role !== 'STUDENT') {
        router.push(`/login?redirect=/classes/${params.id}/payment`);
        return;
      }
      if (!clsData || clsData.error) {
        router.push('/classes');
        return;
      }
      setCls(clsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id, router]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    let paymentProofUrl = '';

    if (method === 'card') {
      if (!card.name.trim() || card.number.replace(/\s/g, '').length < 16 || card.expiry.length < 5 || card.cvv.length < 3) {
        setError('Please fill in all card details correctly.');
        setSubmitting(false);
        return;
      }
      paymentProofUrl = `card:${card.number.replace(/\s/g, '').slice(-4)}`;
    } else {
      if (!proofFile) {
        setError('Please upload your payment screenshot.');
        setSubmitting(false);
        return;
      }

      const uploadRes = await fetch('/api/storage/payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: params.id, filename: proofFile.name }),
      });

      if (!uploadRes.ok) {
        const d = await uploadRes.json();
        setError(d.error || 'Failed to prepare upload.');
        setSubmitting(false);
        return;
      }

      const { signedUrl, path } = await uploadRes.json();
      const putRes = await fetch(signedUrl, {
        method: 'PUT',
        body: proofFile,
        headers: { 'Content-Type': proofFile.type || 'application/octet-stream' },
      });

      if (!putRes.ok) {
        setError('Upload failed. Please use a smaller image (under 5 MB).');
        setSubmitting(false);
        return;
      }

      paymentProofUrl = path;
    }

    const enrollRes = await fetch(`/api/classes/${params.id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentProofUrl }),
    });

    const enrollData = await enrollRes.json();

    if (!enrollRes.ok) {
      setError(enrollData.message || enrollData.error || 'Failed to submit enrollment. Please try again.');
      setSubmitting(false);
      return;
    }

    router.push(`/classes/${params.id}?enrolled=1`);
  };

  if (loading) {
    return (
      <main>
        <SiteHeader />
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-950 border-t-transparent" />
        </div>
      </main>
    );
  }

  if (!cls) return null;

  const methodTabs: { id: PaymentMethod; label: string }[] = [
    { id: 'bank', label: 'Bank Transfer' },
    { id: 'easypaisa', label: 'EasyPaisa / JazzCash' },
    { id: 'card', label: 'Debit / Credit Card' },
  ];

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href={`/classes/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-950 mb-6"
        >
          ← Back to class
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Class summary */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-950/60">{cls.subject}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{cls.title}</h1>
            <p className="mt-1 text-sm text-slate-500">Instructor: {cls.instructor.name}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-teal-950">{cls.feePkr.toLocaleString()}</span>
              <span className="text-sm text-slate-500">PKR</span>
            </div>
          </div>

          {/* Payment method tabs */}
          <p className="text-sm font-semibold text-slate-700 mb-3">Select payment method</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {methodTabs.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMethod(m.id); setProofFile(null); setError(null); }}
                className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${
                  method === m.id
                    ? 'border-teal-950 bg-teal-950 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Bank Transfer */}
          {method === 'bank' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-800 mb-4">Bank Account Details</p>
                <dl className="space-y-2.5 text-sm">
                  {[
                    ['Bank', 'HBL (Habib Bank Limited)'],
                    ['Account Name', 'Topline Academy Pvt. Ltd.'],
                    ['Account No.', '0123-4567890-01'],
                    ['IBAN', 'PK36HABB0001000123456789'],
                    ['Branch', 'Main Branch, Karachi'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-slate-500 shrink-0">{label}</dt>
                      <dd className="font-medium text-slate-800 text-right font-mono text-xs leading-5">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-800 mb-1">How to pay</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
                  <li>Transfer <strong>PKR {cls.feePkr.toLocaleString()}</strong> to the account above</li>
                  <li>Take a screenshot of your transaction confirmation</li>
                  <li>Upload it below and click Submit Enrollment</li>
                </ol>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Payment screenshot <span className="text-red-500">*</span>
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  onChange={(e) => { setProofFile(e.target.files?.[0] ?? null); setError(null); }}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-teal-950 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-900 cursor-pointer"
                />
                {proofFile && <p className="mt-1 text-xs text-teal-700">Selected: {proofFile.name}</p>}
              </div>
            </div>
          )}

          {/* EasyPaisa / JazzCash */}
          {method === 'easypaisa' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800 mb-3">EasyPaisa</p>
                  <div className="space-y-1.5 text-xs text-green-700">
                    <p><span className="font-medium">Number:</span> 0300-1234567</p>
                    <p><span className="font-medium">Account:</span> Topline Academy</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-orange-800 mb-3">JazzCash</p>
                  <div className="space-y-1.5 text-xs text-orange-700">
                    <p><span className="font-medium">Number:</span> 0311-9876543</p>
                    <p><span className="font-medium">Account:</span> Topline Academy</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-800 mb-1">How to pay</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
                  <li>Open EasyPaisa or JazzCash app</li>
                  <li>Send <strong>PKR {cls.feePkr.toLocaleString()}</strong> to the number above</li>
                  <li>Save the transaction screenshot</li>
                  <li>Upload it below and click Submit Enrollment</li>
                </ol>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Payment screenshot <span className="text-red-500">*</span>
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  onChange={(e) => { setProofFile(e.target.files?.[0] ?? null); setError(null); }}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-teal-950 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-900 cursor-pointer"
                />
                {proofFile && <p className="mt-1 text-xs text-teal-700">Selected: {proofFile.name}</p>}
              </div>
            </div>
          )}

          {/* Card Payment */}
          {method === 'card' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3.5">
                <p className="text-xs font-semibold text-amber-800 mb-0.5">Manual verification</p>
                <p className="text-xs text-amber-700">
                  Card details are reviewed by our team. Enrollment is confirmed within 24 hours after verification.
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Cardholder Name</span>
                <input
                  type="text"
                  value={card.name}
                  onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Ahmed Khan"
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-teal-950 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Card Number</span>
                <input
                  type="text"
                  value={card.number}
                  onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-mono tracking-wider focus:border-teal-950 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Expiry Date</span>
                  <input
                    type="text"
                    value={card.expiry}
                    onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-teal-950 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">CVV</span>
                  <input
                    type="password"
                    value={card.cvv}
                    onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="•••"
                    maxLength={4}
                    className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-teal-950 focus:outline-none"
                  />
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <Link href={`/classes/${params.id}`} className="text-sm text-slate-500 hover:text-slate-800">
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-teal-950 px-7 py-3 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing…
                </>
              ) : (
                `Submit Enrollment — PKR ${cls.feePkr.toLocaleString()}`
              )}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
