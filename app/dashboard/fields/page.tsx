'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheck, FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { api, type BoxFieldDef } from '@/lib/api';
import IconPicker from '@/components/IconPicker';

type CalcType = 'grouped' | 'signed';

type Account = { _id: string; name: string; role: string };

type FieldRow = {
  _id?: string;
  name: string;
  icon: string;
  boxNames: string[];
  boxIcons: string[];
  boxFields: BoxFieldDef[][];
  calcType: CalcType;
  groupSplit: number;
  visibleUserIds: string[];
};

// A box's inner detail-table columns default to this plain Name/Value pair.
const SIMPLE_BOX_FIELDS: BoxFieldDef[] = [
  { label: 'Name', type: 'text' },
  { label: 'Value', type: 'number', sumTotal: true },
];

// One-click preset for currency-conversion style boxes: the user only ever enters USD.
// USD Rate and Bonus % are both percentages the superadmin sets here (auto: 'constant') —
// they show read-only on the entry form. INR and Value are derived and read-only too.
const CURRENCY_BOX_FIELDS: BoxFieldDef[] = [
  { label: 'USD', type: 'number' },
  { label: 'USD Rate', type: 'number', auto: 'constant', constant: 10 },
  { label: 'INR', type: 'computed', formula: { op: 'percentAdd', a: 'USD', b: 'USD Rate' } },
  { label: 'Bonus %', type: 'number', auto: 'constant', constant: 10 },
  { label: 'Value', type: 'computed', formula: { op: 'percentAdd', a: 'INR', b: 'Bonus %' }, sumTotal: true },
];

// One-click preset matching the "S.No / Date / Time / In / Out / From / To / Sent By"
// layout, where only the Out column rolls up into the box total.
const TEAM_BOX_FIELDS: BoxFieldDef[] = [
  { label: 'S.No', type: 'number', auto: 'serial' },
  { label: 'Date', type: 'date' },
  { label: 'Time', type: 'time' },
  { label: 'In', type: 'number' },
  { label: 'Out', type: 'number', sumTotal: true },
  { label: 'From', type: 'text' },
  { label: 'To', type: 'text' },
  { label: 'Sent By', type: 'text', auto: 'user' },
];

type Feedback = { type: 'added' | 'removed' | 'saved'; text: string };
type ConfirmDelete = { index: number; name: string };
type VisibilityEditor = { index: number; draft: string[] };

export default function FieldsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);
  const [visibilityEditor, setVisibilityEditor] = useState<VisibilityEditor | null>(null);
  // true only for super admin (manageFields permission)
  const [canEdit, setCanEdit] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.me(), api.getFields(), api.listUsers()])
      .then(([user, fields, users]) => {
        const hasManage = Boolean(user.permissions?.manageFields);
        if (!hasManage) {
          router.replace('/dashboard');
          return;
        }
        setCanEdit(true);
        setAccounts(users.filter((u: any) => u.role === 'user' || u.role === 'admin'));
        setRows(
          fields.map((f: any) => ({
            _id: f._id,
            name: f.name,
            icon: f.icon || '',
            boxNames: [...f.boxNames],
            boxIcons: f.boxNames.map((_: string, i: number) => f.boxIcons?.[i] || ''),
            boxFields: f.boxNames.map((_: string, i: number) => f.boxFields?.[i]?.length ? f.boxFields[i] : SIMPLE_BOX_FIELDS),
            calcType: f.calcType,
            groupSplit: f.groupSplit,
            visibleUserIds: f.visibleUserIds || [],
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
      {
        name: fieldName,
        icon: '',
        boxNames: ['Box 1'],
        boxIcons: [''],
        boxFields: [SIMPLE_BOX_FIELDS],
        calcType: 'signed',
        groupSplit: 0,
        visibleUserIds: accounts.map((a) => a._id),
      },
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
      boxFields: [...row.boxFields, SIMPLE_BOX_FIELDS],
    });
  }

  function removeBox(index: number, boxIndex: number) {
    const row = rows[index];
    if (row.boxNames.length <= 1) return;
    const boxNames = row.boxNames.filter((_, i) => i !== boxIndex);
    const boxIcons = row.boxIcons.filter((_, i) => i !== boxIndex);
    const boxFields = row.boxFields.filter((_, i) => i !== boxIndex);
    const changes: Partial<FieldRow> = { boxNames, boxIcons, boxFields };
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

  function updateBoxFields(index: number, boxIndex: number, fields: BoxFieldDef[]) {
    const row = rows[index];
    const boxFields = [...row.boxFields];
    boxFields[boxIndex] = fields;
    updateRow(index, { boxFields });
  }

  function setCalcType(index: number, calcType: CalcType) {
    const row = rows[index];
    updateRow(index, {
      calcType,
      groupSplit: calcType === 'grouped' ? row.groupSplit || Math.ceil(row.boxNames.length / 2) : 0,
    });
  }

  function visibilitySummary(row: FieldRow) {
    if (accounts.length === 0) return 'No accounts yet';
    if (row.visibleUserIds.length === 0) return 'Hidden from everyone';
    if (row.visibleUserIds.length === accounts.length) return 'Everyone';
    return `${row.visibleUserIds.length} of ${accounts.length} selected`;
  }

  function openVisibilityEditor(index: number) {
    setVisibilityEditor({ index, draft: [...rows[index].visibleUserIds] });
  }

  function closeVisibilityEditor() {
    setVisibilityEditor(null);
  }

  function toggleDraftAccount(userId: string) {
    setVisibilityEditor((cur) => {
      if (!cur) return cur;
      const draft = cur.draft.includes(userId) ? cur.draft.filter((id) => id !== userId) : [...cur.draft, userId];
      return { ...cur, draft };
    });
  }

  function setDraftAll() {
    setVisibilityEditor((cur) => (cur ? { ...cur, draft: accounts.map((a) => a._id) } : cur));
  }

  function setDraftNone() {
    setVisibilityEditor((cur) => (cur ? { ...cur, draft: [] } : cur));
  }

  function saveVisibilityEditor() {
    if (!visibilityEditor) return;
    updateRow(visibilityEditor.index, { visibleUserIds: visibilityEditor.draft });
    setVisibilityEditor(null);
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
          boxFields: row.boxFields,
          visibleUserIds: row.visibleUserIds,
        };
        const result = row._id ? await api.updateField(row._id, payload) : await api.createField(payload);
        saved[index] = {
          _id: result._id,
          name: result.name,
          icon: result.icon || '',
          boxNames: result.boxNames,
          boxIcons: result.boxNames.map((_: string, i: number) => result.boxIcons?.[i] || ''),
          boxFields: result.boxNames.map((_: string, i: number) => result.boxFields?.[i]?.length ? result.boxFields[i] : SIMPLE_BOX_FIELDS),
          calcType: result.calcType,
          groupSplit: result.groupSplit,
          visibleUserIds: result.visibleUserIds || [],
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

          <div className="mb-5 grid gap-3 lg:grid-cols-2">
            {row.boxNames.map((boxName, boxIndex) => (
              <BoxEditor
                key={boxIndex}
                canEdit={canEdit}
                boxIndex={boxIndex}
                boxName={boxName}
                boxIcon={row.boxIcons[boxIndex]}
                boxFields={row.boxFields[boxIndex] || SIMPLE_BOX_FIELDS}
                canRemove={row.boxNames.length > 1}
                onIconChange={(icon) => updateBoxIcon(index, boxIndex, icon)}
                onNameChange={(value) => updateBoxName(index, boxIndex, value)}
                onFieldsChange={(fields) => updateBoxFields(index, boxIndex, fields)}
                onRemove={() => removeBox(index, boxIndex)}
              />
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
                Grouped (split total)
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

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-900/55">Visible to</p>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => canEdit && openVisibilityEditor(index)}
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-800 hover:bg-blue-50 disabled:cursor-default disabled:opacity-60"
            >
              <FiUsers size={14} />
              {visibilitySummary(row)}
            </button>
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

      {canEdit && visibilityEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="visibility-editor-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeVisibilityEditor();
          }}
        >
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                  {rows[visibilityEditor.index]?.name || 'Field'}
                </p>
                <h2 id="visibility-editor-title" className="font-display text-xl text-blue-950">Visible to</h2>
              </div>
              <button type="button" onClick={closeVisibilityEditor} aria-label="Close" className="rounded-lg p-2 text-blue-900/40 hover:bg-blue-50 hover:text-blue-700">
                <FiX size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {accounts.length === 0 ? (
                <p className="text-sm text-blue-900/40">No admin or user accounts yet.</p>
              ) : (
                <>
                  <div className="mb-4 flex gap-2">
                    <button type="button" onClick={setDraftAll} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-50">
                      Select all
                    </button>
                    <button type="button" onClick={setDraftNone} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-50">
                      Clear all
                    </button>
                  </div>

                  {(['admin', 'user'] as const).map((role) => {
                    const group = accounts.filter((a) => a.role === role);
                    if (group.length === 0) return null;
                    return (
                      <div key={role} className="mb-4 last:mb-0">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-900/40">
                          {role === 'admin' ? 'Admins' : 'Users'}
                        </p>
                        <div className="space-y-0.5">
                          {group.map((account) => (
                            <label key={account._id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-blue-950 hover:bg-blue-50/60">
                              <input
                                type="checkbox"
                                checked={visibilityEditor.draft.includes(account._id)}
                                onChange={() => toggleDraftAccount(account._id)}
                                className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                              />
                              {account.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="flex gap-3 border-t border-blue-100 bg-blue-50/60 px-5 py-4">
              <button type="button" onClick={closeVisibilityEditor} className="flex-1 rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50">
                Cancel
              </button>
              <button type="button" onClick={saveVisibilityEditor} className="flex-1 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isSimpleBoxFields(fields: BoxFieldDef[]) {
  if (fields.length !== 2) return false;
  const [a, b] = fields;
  return (
    a.label.trim().toLowerCase() === 'name' && a.type === 'text' && !a.auto && !a.sumTotal &&
    b.label.trim().toLowerCase() === 'value' && b.type === 'number' && !b.auto
  );
}

function BoxEditor({
  canEdit,
  boxIndex,
  boxName,
  boxIcon,
  boxFields,
  canRemove,
  onIconChange,
  onNameChange,
  onFieldsChange,
  onRemove,
}: {
  canEdit: boolean;
  boxIndex: number;
  boxName: string;
  boxIcon: string;
  boxFields: BoxFieldDef[];
  canRemove: boolean;
  onIconChange: (icon: string) => void;
  onNameChange: (value: string) => void;
  onFieldsChange: (fields: BoxFieldDef[]) => void;
  onRemove: () => void;
}) {
  const simple = isSimpleBoxFields(boxFields);

  function updateColumn(colIndex: number, changes: Partial<BoxFieldDef>) {
    onFieldsChange(boxFields.map((col, i) => (i === colIndex ? { ...col, ...changes } : col)));
  }

  function addColumn() {
    onFieldsChange([...boxFields, { label: `Column ${boxFields.length + 1}`, type: 'text' }]);
  }

  function removeColumn(colIndex: number) {
    const next = boxFields.filter((_, i) => i !== colIndex);
    onFieldsChange(next.length ? next : SIMPLE_BOX_FIELDS);
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3">
      <div className="flex items-end gap-1.5">
        <IconPicker size="sm" value={boxIcon} onChange={onIconChange} disabled={!canEdit} />
        <label className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-blue-900/55">
          Box {boxIndex + 1}
          <input
            value={boxName}
            readOnly={!canEdit}
            onChange={(event) => onNameChange(event.target.value)}
            className={`mt-1 w-full rounded-lg border border-blue-100 px-3 py-2 text-sm normal-case tracking-normal text-blue-950 outline-none ${canEdit ? 'bg-blue-50/50 focus:border-blue-400' : 'bg-transparent cursor-default'}`}
          />
        </label>
        {canEdit && (
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label="Remove box"
            className="mt-4 rounded-lg p-2 text-blue-900/30 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
          >
            <FiTrash2 size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 border-t border-blue-100 pt-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">Inner table columns</p>
          {canEdit && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onFieldsChange(TEAM_BOX_FIELDS)}
                className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
              >
                Use Team Box template
              </button>
              <button
                type="button"
                onClick={() => onFieldsChange(CURRENCY_BOX_FIELDS)}
                className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
              >
                Use Currency Conversion template
              </button>
              {!simple && (
                <button
                  type="button"
                  onClick={() => onFieldsChange(SIMPLE_BOX_FIELDS)}
                  className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Reset to simple
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          {boxFields.map((col, colIndex) => (
            <div key={colIndex} className="flex flex-wrap items-center gap-1.5">
              <input
                value={col.label}
                readOnly={!canEdit}
                onChange={(event) => updateColumn(colIndex, { label: event.target.value })}
                placeholder="Column label"
                className={`min-w-0 flex-1 rounded-lg border border-blue-100 px-2.5 py-1.5 text-xs text-blue-950 outline-none ${canEdit ? 'bg-white focus:border-blue-400' : 'bg-transparent cursor-default'}`}
              />
              <select
                value={col.type}
                disabled={!canEdit}
                onChange={(event) => {
                  const type = event.target.value as BoxFieldDef['type'];
                  updateColumn(colIndex, {
                    type,
                    sumTotal: type === 'number' || type === 'computed' ? col.sumTotal : undefined,
                    auto: type === 'computed' ? undefined : type === 'number' ? col.auto : col.auto === 'constant' ? undefined : col.auto,
                    constant: type === 'number' && col.auto === 'constant' ? col.constant : undefined,
                    formula: type === 'computed' ? (col.formula || { op: 'multiply', a: '', b: '' }) : undefined,
                  });
                }}
                className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="computed">Computed</option>
              </select>
              {col.type !== 'computed' && (
                <select
                  value={col.auto || ''}
                  disabled={!canEdit}
                  onChange={(event) => {
                    const auto = (event.target.value || undefined) as BoxFieldDef['auto'];
                    updateColumn(colIndex, { auto, constant: auto === 'constant' ? (col.constant ?? 0) : undefined });
                  }}
                  className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                >
                  <option value="">No auto-fill</option>
                  <option value="serial">Row number</option>
                  <option value="user">Current user</option>
                  {col.type === 'number' && <option value="constant">Fixed value (superadmin)</option>}
                </select>
              )}
              {col.type === 'number' && col.auto === 'constant' && (
                <label className="flex items-center gap-1 text-[10px] font-medium text-blue-900/60">
                  Fixed at
                  <input
                    type="number"
                    value={col.constant ?? 0}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { constant: Number(event.target.value) || 0 })}
                    className="w-16 rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                  />
                </label>
              )}
              {(col.type === 'number' || col.type === 'computed') && (
                <label className="flex items-center gap-1 text-[10px] font-medium text-blue-900/60">
                  <input
                    type="checkbox"
                    checked={Boolean(col.sumTotal)}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { sumTotal: event.target.checked })}
                    className="h-3.5 w-3.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  Total
                </label>
              )}
              {col.type === 'computed' && (
                <div className="flex basis-full flex-wrap items-center gap-1.5 pl-1">
                  <select
                    value={col.formula?.op || 'multiply'}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { formula: { op: event.target.value as 'multiply' | 'percentAdd', a: col.formula?.a || '', b: col.formula?.b || '' } })}
                    className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                  >
                    <option value="multiply">A x B (e.g. Hours x Rate = Pay)</option>
                    <option value="percentAdd">A + A x B% (e.g. INR + Bonus% = Value)</option>
                  </select>
                  <select
                    value={col.formula?.a || ''}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { formula: { op: col.formula?.op || 'multiply', a: event.target.value, b: col.formula?.b || '' } })}
                    className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                  >
                    <option value="">A: choose column</option>
                    {boxFields.filter((f, i) => i !== colIndex && f.label.trim()).map((f) => (
                      <option key={f.label} value={f.label}>{f.label}</option>
                    ))}
                  </select>
                  <select
                    value={col.formula?.b || ''}
                    disabled={!canEdit}
                    onChange={(event) => updateColumn(colIndex, { formula: { op: col.formula?.op || 'multiply', a: col.formula?.a || '', b: event.target.value } })}
                    className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs text-blue-950 outline-none disabled:cursor-default"
                  >
                    <option value="">B: choose column</option>
                    {boxFields.filter((f, i) => i !== colIndex && f.label.trim()).map((f) => (
                      <option key={f.label} value={f.label}>{f.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => removeColumn(colIndex)}
                  disabled={boxFields.length <= 1}
                  aria-label="Remove column"
                  className="rounded-lg p-1.5 text-blue-900/30 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <FiTrash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {canEdit && (
          <button type="button" onClick={addColumn} className="mt-2 flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:underline">
            <FiPlus size={12} /> Add column
          </button>
        )}
      </div>
    </div>
  );
}
