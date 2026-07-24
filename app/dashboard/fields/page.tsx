'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiChevronDown, FiChevronUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api } from '@/lib/api';
import IconPicker from '@/components/IconPicker';

type CalcType = 'grouped' | 'signed';

type FieldRow = {
  _id?: string;
  name: string;
  icon: string;
  boxNames: string[];
  boxIcons: string[];
  calcType: CalcType;
  groupSplit: number;
};

type Feedback = { type: 'added' | 'removed' | 'saved'; text: string };
type ConfirmDelete = { index: number; name: string };

export default function FieldsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);
  // true only for super admin (manageFields permission)
  const [canEdit, setCanEdit] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.me(), api.getFields()])
      .then(([user, fields]) => {
        const hasManage = Boolean(user.permissions?.manageFields);
        if (!hasManage) {
          router.replace('/dashboard');
          return;
        }
        setCanEdit(true);
        setRows(
          fields.map((f: any) => ({
            _id: f._id,
            name: f.name,
            icon: f.icon || '',
            boxNames: [...f.boxNames],
            boxIcons: f.boxNames.map((_: string, i: number) => f.boxIcons?.[i] || ''),
            calcType: f.calcType,
            groupSplit: f.groupSplit,
          })),
        );
      })
      .catch((err: any) => setError(err.message || 'Could not load fields'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [router]);

  function closeFeedback() {
    setFeedback(null);
  }

  function updateRow(index: number, changes: Partial<FieldRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  function addField() {
    const fieldName = `Field ${rows.length + 1}`;
    setRows((prev) => [
      ...prev,
      { name: fieldName, icon: '', boxNames: ['Box 1'], boxIcons: [''], calcType: 'signed', groupSplit: 0 },
    ]);
    setError('');
    setFeedback({ type: 'added', text: `"${fieldName}" added. Click Save to keep it.` });
  }

  function removeField(index: number) {
    setConfirmDelete({ index, name: rows[index].name });
  }

  function cancelRemoveField() {
    setConfirmDelete(null);
  }

  async function confirmRemoveField() {
    if (!confirmDelete) return;
    const { index, name } = confirmDelete;
    const row = rows[index];
    if (row._id) {
      try {
        await api.deleteField(row._id);
      } catch (err: any) {
        setError(err.message || 'Could not remove field');
        setConfirmDelete(null);
        return;
      }
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
    setError('');
    setConfirmDelete(null);
    setFeedback({ type: 'removed', text: `"${name}" was removed.` });
  }

  function moveField(index: number, direction: -1 | 1) {
    setRows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addBox(index: number) {
    const row = rows[index];
    updateRow(index, {
      boxNames: [...row.boxNames, `Box ${row.boxNames.length + 1}`],
      boxIcons: [...row.boxIcons, ''],
    });
  }

  function removeBox(index: number, boxIndex: number) {
    const row = rows[index];
    if (row.boxNames.length <= 1) return;
    const boxNames = row.boxNames.filter((_, i) => i !== boxIndex);
    const boxIcons = row.boxIcons.filter((_, i) => i !== boxIndex);
    const changes: Partial<FieldRow> = { boxNames, boxIcons };
    if (row.calcType === 'grouped') {
      changes.groupSplit = Math.min(row.groupSplit, Math.max(1, boxNames.length - 1));
    }
    updateRow(index, changes);
  }

  function updateBoxName(index: number, boxIndex: number, value: string) {
    const row = rows[index];
    const boxNames = [...row.boxNames];
    boxNames[boxIndex] = value;
    updateRow(index, { boxNames });
  }

  function updateBoxIcon(index: number, boxIndex: number, icon: string) {
    const row = rows[index];
    const boxIcons = [...row.boxIcons];
    boxIcons[boxIndex] = icon;
    updateRow(index, { boxIcons });
  }

  function setCalcType(index: number, calcType: CalcType) {
    const row = rows[index];
    updateRow(index, {
      calcType,
      groupSplit: calcType === 'grouped' ? row.groupSplit || Math.ceil(row.boxNames.length / 2) : 0,
    });
  }

  async function save() {
    setSaving(true);
    setError('');
    const saved: FieldRow[] = [...rows];
    try {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const payload = {
          name: row.name.trim() || `Field ${index + 1}`,
          order: index,
          boxNames: row.boxNames.map((boxName, i) => boxName.trim() || `Box ${i + 1}`),
          calcType: row.calcType,
          groupSplit: row.groupSplit,
          icon: row.icon,
          boxIcons: row.boxIcons,
        };
        const result = row._id ? await api.updateField(row._id, payload) : await api.createField(payload);
        saved[index] = {
          _id: result._id,
          name: result.name,
          icon: result.icon || '',
          boxNames: result.boxNames,
          boxIcons: result.boxNames.map((_: string, i: number) => result.boxIcons?.[i] || ''),
          calcType: result.calcType,
          groupSplit: result.groupSplit,
        };
      }
      setRows(saved);
      setFeedback({ type: 'saved', text: 'Fields saved. All users will see these changes.' });
    } catch (err: any) {
      // Persist whichever fields already saved successfully so retrying doesn't recreate them.
      setRows(saved);
      setError(err.message || 'Could not save fields');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-blue-900/50">Loading fields...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Admin settings</p>
          <h1 className="font-display text-4xl text-blue-950">Fields</h1>
        </div>
        <button onClick={addField} className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50">
          <FiPlus /> Add field
        </button>
      </div>

      {!canEdit && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-3 text-xs font-medium text-blue-700">
          You can view fields but only a super admin can make changes.
        </div>
      )}

      {rows.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          No fields yet.{canEdit ? ' Add one so users have somewhere to enter data.' : ''}
        </div>
      )}

      {rows.map((row, index) => (
        <section key={row._id || `new-${index}`} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_14px_40px_rgba(0,107,196,0.08)]">
          <div className="mb-5 flex items-center gap-3">
            <IconPicker value={row.icon} onChange={(icon) => updateRow(index, { icon })} disabled={!canEdit} />
            <input
              aria-label="Field name"
              value={row.name}
              readOnly={!canEdit}
              onChange={(event) => updateRow(index, { name: event.target.value })}
              className={`w-full rounded-lg border border-blue-100 px-3 py-2 text-sm font-semibold text-blue-950 outline-none ${canEdit ? 'bg-blue-50/50 focus:border-blue-400' : 'bg-transparent cursor-default'}`}
            />
            {canEdit && (
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => moveField(index, -1)} disabled={index === 0} aria-label="Move up" className="rounded-lg p-2 text-blue-900/40 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-30">
                  <FiChevronUp size={16} />
                </button>
                <button type="button" onClick={() => moveField(index, 1)} disabled={index === rows.length - 1} aria-label="Move down" className="rounded-lg p-2 text-blue-900/40 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-30">
                  <FiChevronDown size={16} />
                </button>
                <button type="button" onClick={() => removeField(index)} aria-label="Remove field" className="rounded-lg p-2 text-blue-900/30 hover:bg-red-50 hover:text-red-600">
                  <FiTrash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {row.boxNames.map((boxName, boxIndex) => (
              <div key={boxIndex} className="flex items-end gap-1.5">
                <IconPicker
                  size="sm"
                  value={row.boxIcons[boxIndex]}
                  onChange={(icon) => updateBoxIcon(index, boxIndex, icon)}
                  disabled={!canEdit}
                />
                <label className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-blue-900/55">
                  Box {boxIndex + 1}
                  <input
                    value={boxName}
                    readOnly={!canEdit}
                    onChange={(event) => updateBoxName(index, boxIndex, event.target.value)}
                    className={`mt-1 w-full rounded-lg border border-blue-100 px-3 py-2 text-sm normal-case tracking-normal text-blue-950 outline-none ${canEdit ? 'bg-blue-50/50 focus:border-blue-400' : 'bg-transparent cursor-default'}`}
                  />
                </label>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => removeBox(index, boxIndex)}
                    disabled={row.boxNames.length <= 1}
                    aria-label="Remove box"
                    className="mt-4 rounded-lg p-2 text-blue-900/30 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {canEdit && (
            <button type="button" onClick={() => addBox(index)} className="mb-5 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
              <FiPlus /> Add box
            </button>
          )}

          <div className="mb-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-900/55">Calculation (how box values combine into this field's total)</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && setCalcType(index, 'grouped')}
                className={`rounded border px-3 py-1.5 text-xs font-medium transition ${row.calcType === 'grouped' ? 'border-blue-500 bg-blue-600 text-white' : 'border-blue-200 bg-white text-blue-800'} ${canEdit ? 'hover:bg-blue-50' : 'cursor-default opacity-80'}`}
              >
                Grouped (split + operator)
              </button>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && setCalcType(index, 'signed')}
                className={`rounded border px-3 py-1.5 text-xs font-medium transition ${row.calcType === 'signed' ? 'border-blue-500 bg-blue-600 text-white' : 'border-blue-200 bg-white text-blue-800'} ${canEdit ? 'hover:bg-blue-50' : 'cursor-default opacity-80'}`}
              >
                Sum by sign (+ / −)
              </button>
              {row.calcType === 'grouped' && (
                <label className="ml-2 flex items-center gap-2 text-xs font-medium text-blue-900/65">
                  Split after box
                  <input
                    type="number"
                    min={1}
                    max={row.boxNames.length - 1}
                    value={row.groupSplit}
                    readOnly={!canEdit}
                    onChange={(event) => {
                      if (!canEdit) return;
                      const max = Math.max(1, row.boxNames.length - 1);
                      const raw = Number(event.target.value) || 1;
                      updateRow(index, { groupSplit: Math.min(Math.max(1, raw), max) });
                    }}
                    className={`w-16 rounded-lg border border-blue-100 px-2 py-1.5 text-center text-sm text-blue-950 outline-none ${canEdit ? 'bg-blue-50/50 focus:border-blue-400' : 'bg-transparent cursor-default'}`}
                  />
                  <span className="text-blue-900/45">of {row.boxNames.length}</span>
                </label>
              )}
            </div>
          </div>
        </section>
      ))}

      {error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><FiAlertCircle />{error}</p>}

      {canEdit && (
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/15 hover:bg-blue-700 disabled:opacity-60">
          <FiCheck /> {saving ? 'Saving...' : 'Save fields'}
        </button>
      )}

      {canEdit && confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="fields-confirm-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FiTrash2 size={25} />
            </div>
            <h2 id="fields-confirm-title" className="font-display text-2xl text-blue-950">
              Remove field?
            </h2>
            <p className="mt-2 text-sm text-blue-900/55">
              {`"${confirmDelete.name}" will be permanently removed.`}
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={cancelRemoveField} className="flex-1 rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50">
                Cancel
              </button>
              <button onClick={confirmRemoveField} className="flex-1 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="fields-feedback-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${feedback.type === 'removed' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {feedback.type === 'removed' ? <FiTrash2 size={25} /> : <FiCheck size={25} />}
            </div>
            <h2 id="fields-feedback-title" className="font-display text-2xl text-blue-950">
              {feedback.type === 'added' && 'Field added'}
              {feedback.type === 'removed' && 'Field removed'}
              {feedback.type === 'saved' && 'Saved successfully'}
            </h2>
            <p className="mt-2 text-sm text-blue-900/55">{feedback.text}</p>
            <button onClick={closeFeedback} className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
