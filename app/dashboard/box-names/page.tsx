'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiTag } from 'react-icons/fi';
import { api } from '@/lib/api';

export default function BoxNamesPage() {
  const router = useRouter();
  const [field1Names, setField1Names] = useState<string[]>([]);
  const [field2Names, setField2Names] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([api.me(), api.getBoxNames()])
      .then(([user, names]) => {
        if (user.role !== 'superadmin') {
          router.replace('/dashboard');
          return;
        }
        setField1Names([...names.field1BoxNames]);
        setField2Names([...names.field2BoxNames]);
      })
      .catch((err: any) => setError(err.message || 'Could not load box names'))
      .finally(() => setLoading(false));
  }, [router]);

  function update(names: string[], setNames: (names: string[]) => void, index: number, value: string) {
    const next = [...names];
    next[index] = value;
    setNames(next);
  }

  async function save() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await api.updateBoxNames({
        field1BoxNames: field1Names,
        field2BoxNames: field2Names,
      });
      setField1Names([...saved.field1BoxNames]);
      setField2Names([...saved.field2BoxNames]);
      setMessage('Box names saved. All users will see these names.');
    } catch (err: any) {
      setError(err.message || 'Could not save box names');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-blue-900/50">Loading box names...</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Admin settings</p>
        <h1 className="font-display text-4xl text-blue-950">Box Names</h1>
        <p className="mt-2 text-sm text-blue-900/55">Save the shared names displayed to every user during data entry.</p>
      </div>

      <NameSection title="Field 1" names={field1Names} onChange={(index, value) => update(field1Names, setField1Names, index, value)} />
      <NameSection title="Field 2" names={field2Names} onChange={(index, value) => update(field2Names, setField2Names, index, value)} />

      {error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><FiAlertCircle />{error}</p>}
      {message && <p className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"><FiCheck />{message}</p>}

      <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/15 hover:bg-blue-700 disabled:opacity-60">
        <FiCheck /> {saving ? 'Saving...' : 'Save box names'}
      </button>
    </div>
  );
}

function NameSection({ title, names, onChange }: { title: string; names: string[]; onChange: (index: number, value: string) => void }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><FiTag /></span>
        <h2 className="font-display text-xl text-blue-950">{title}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {names.map((name, index) => (
          <label key={index} className="text-[10px] font-semibold uppercase tracking-wider text-blue-900/55">Box {index + 1}
            <input value={name} onChange={(event) => onChange(index, event.target.value)} className="mt-1 w-full rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm normal-case tracking-normal text-blue-950 outline-none focus:border-blue-400" />
          </label>
        ))}
      </div>
    </section>
  );
}
