'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiLock, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { FieldIcon } from './IconPicker';
import { boxColorHex } from './ColorPicker';
import { type BoxDetail, type BoxFieldDef, blankBoxDetail } from '@/lib/api';

export type { BoxDetail, BoxFieldDef };

type DetailRow = { id: number } & BoxDetail;

let nextRowId = 1;

// Entries saved before boxes had a fixed Name/Value shape used capitalized keys.
function normalizeRow(raw: any): BoxDetail {
  if (raw && typeof raw === 'object') {
    if ('name' in raw || 'value' in raw) return { name: raw.name ?? '', value: Number(raw.value) || 0 };
    if ('Name' in raw || 'Value' in raw) return { name: raw.Name ?? '', value: Number(raw.Value) || 0 };
  }
  return blankBoxDetail();
}

function rowTotal(row: DetailRow) {
  return Number(row.value) || 0;
}

// A box still using the original two-column Name/Value shape (the vast majority of
// boxes, including every box saved before per-box custom columns existed) keeps using
// the editor below completely unchanged. Anything else — e.g. a "Team Box" layout with
// its own Date/In/Out/Sent-By columns — renders through CustomTallyBox instead.
function isCustomBoxFields(fields?: BoxFieldDef[]) {
  if (!fields || fields.length === 0) return false;
  if (fields.length !== 2) return true;
  const [a, b] = fields;
  return !(
    a.label.trim().toLowerCase() === 'name' && a.type === 'text' &&
    b.label.trim().toLowerCase() === 'value' && b.type === 'number'
  );
}
export default function TallyBox(props: {
  idPrefix: string;
  index: number;
  name?: string;
  icon?: string;
  color?: string;
  value: number;
  details?: BoxDetail[];
  boxFields?: BoxFieldDef[];
  currentUserName?: string;
  locked?: boolean;
  onNameChange?: (name: string) => void;
  onDetailsChange?: (details: BoxDetail[]) => void;
  onChange: (v: number) => void;
}) {
  if (isCustomBoxFields(props.boxFields)) {
    const CustomEditor = props.index === 2 ? GroupedCustomTallyBox : FlatCustomTallyBox;
    return (
      <CustomEditor
        idPrefix={props.idPrefix}
        index={props.index}
        name={props.name}
        icon={props.icon}
        color={props.color}
        value={props.value}
        details={props.details}
        fields={props.boxFields!}
        currentUserName={props.currentUserName}
        locked={props.locked}
        onDetailsChange={props.onDetailsChange}
        onChange={props.onChange}
      />
    );
  }
  return <LegacyTallyBox {...props} />;
}

function LegacyTallyBox({
  idPrefix,
  index,
  name,
  icon,
  color,
  value,
  details,
  locked,
  onNameChange,
  onDetailsChange,
  onChange,
}: {
  idPrefix: string;
  index: number;
  name?: string;
  icon?: string;
  color?: string;
  value: number;
  details?: BoxDetail[];
  locked?: boolean;
  onNameChange?: (name: string) => void;
  onDetailsChange?: (details: BoxDetail[]) => void;
  onChange: (v: number) => void;
}) {
  const colorHex = boxColorHex(color);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DetailRow[]>(() =>
    details?.length
      ? details.map((detail) => ({ id: nextRowId++, ...normalizeRow(detail) }))
      : [{ id: nextRowId++, ...blankBoxDetail(value) }],
  );
  const total = useMemo(() => rows.reduce((sum, row) => sum + rowTotal(row), 0), [rows]);
  const title = name?.trim() || `Box ${index}`;

  useEffect(() => {
    if (value === 0 && total !== 0) {
      setRows([{ id: nextRowId++, ...blankBoxDetail(0) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emit(next: DetailRow[]) {
    setRows(next);
    onChange(next.reduce((sum, row) => sum + rowTotal(row), 0));
    onDetailsChange?.(next.map(({ id, ...detail }) => detail));
  }

  function updateRowName(id: number, name: string) {
    emit(rows.map((row) => (row.id === id ? { ...row, name } : row)));
  }

  function updateRowValue(id: number, value: number) {
    emit(rows.map((row) => (row.id === id ? { ...row, value } : row)));
  }

  function addRow() {
    emit([...rows, { id: nextRowId++, ...blankBoxDetail() }]);
  }

  function removeRow(id: number) {
    const next = rows.filter((row) => row.id !== id);
    emit(next.length ? next : [{ id: nextRowId++, ...blankBoxDetail() }]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={locked ? `${title}, view only` : `${title}, click to edit`}
        className="group relative h-14 w-full overflow-hidden rounded-lg border border-blue-100 bg-white p-2 text-left shadow-card transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_14px_30px_rgba(0,107,196,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
      >
        {locked && (
          <span className="absolute right-1.5 top-1.5 text-blue-900/25"><FiLock size={11} /></span>
        )}
        <span className="flex items-center justify-between gap-1.5">
          <span
            className={colorHex ? undefined : value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-600'}
            style={colorHex ? { color: colorHex } : undefined}
          >
            <FieldIcon icon={icon} size={11} />
          </span>
          <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-black">{title}</span>
        </span>
        <span
          className={`mt-1 block font-mono text-sm font-bold tabular-nums ${
            colorHex ? '' : value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-950'
          }`}
          style={colorHex ? { color: colorHex } : undefined}
        >
          {value}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${idPrefix}-box-${index}-title`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-2xl xl:max-w-3xl">
            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
              <div>
                <h3 id={`${idPrefix}-box-${index}-title`} className="font-display text-xl text-blue-950">{title}</h3>
                <p className="text-xs text-blue-900/45">
                  {locked ? 'View only — someone else on this report enters these values.' : onNameChange ? 'Customize the box name, then enter values below.' : 'Enter values below.'}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close popup" className="rounded-lg p-2 text-blue-900/45 hover:bg-blue-50 hover:text-blue-800">
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {onNameChange && (
                <div className="mb-5">
                  <label
                    htmlFor={`${idPrefix}-box-${index}-name`}
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-blue-900/45"
                  >
                    Box name
                  </label>
                  <input
                    id={`${idPrefix}-box-${index}-name`}
                    type="text"
                    value={name ?? ''}
                    readOnly={locked}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder={`Box ${index}`}
                    className="w-full rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-sm font-semibold text-blue-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              )}
              <div className="mb-2 flex gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">
                <span className="min-w-0 flex-1 truncate">Name</span>
                <span className="w-20 shrink-0 truncate">Value</span>
                {!locked && <span className="w-7 shrink-0" />}
              </div>
              <div className="space-y-2">
                {rows.map((row, rowIndex) => (
                  <div key={row.id} className="flex gap-2">
                    <input
                      type="text"
                      value={String(row.name ?? '')}
                      readOnly={locked}
                      onChange={(event) => updateRowName(row.id, event.target.value)}
                      placeholder="Name"
                      aria-label={`Row ${rowIndex + 1} name`}
                      className={`min-w-0 flex-1 rounded-lg border border-blue-100 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 ${locked ? 'bg-blue-50/70 text-blue-900/60 cursor-default' : 'bg-blue-50/40'}`}
                    />
                    <div className="w-20 shrink-0">
                      <SignedNumberInput
                        value={Number(row.value) || 0}
                        onChange={(v) => updateRowValue(row.id, v)}
                        label={`Row ${rowIndex + 1} value`}
                        readOnly={locked}
                      />
                    </div>
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        aria-label="Remove row"
                        className="flex w-7 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!locked && (
                <button type="button" onClick={addRow} className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                  <FiPlus /> Add another
                </button>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-blue-100 bg-blue-50/60 px-5 py-4">
              <div>
                <span className="mr-3 text-xs font-semibold uppercase tracking-wider text-blue-900/50">Total</span>
                <span className="font-mono text-2xl font-semibold tabular-nums text-blue-950">{total}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Sums whichever number column(s) are flagged sumTotal; if a custom layout doesn't flag
// any, every number/computed column counts (keeps totals sane even if an admin forgets to flag one).
function customRowValue(row: Record<string, unknown>, fields: BoxFieldDef[]) {
  const numberFields = fields.filter((f) => f.type === 'number' || f.type === 'computed');
  const flagged = numberFields.filter((f) => f.sumTotal);
  const counted = flagged.length ? flagged : numberFields;
  return counted.reduce((sum, f) => {
    const sign = f.sumSign === 'subtract' ? -1 : 1;
    return sum + sign * (Number(row[f.label]) || 0);
  }, 0);
}

function normalizedColumnLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, '').replace(/−/g, '-');
}

type CryptoFields = {
  usd: BoxFieldDef;
  inr: BoxFieldDef;
  plusUsd: BoxFieldDef;
  minusUsd: BoxFieldDef;
  plusInr: BoxFieldDef;
  minusInr: BoxFieldDef;
};

function cryptoFields(fields: BoxFieldDef[]): CryptoFields | null {
  const byLabel = new Map(fields.map((field) => [normalizedColumnLabel(field.label), field]));
  const usd = byLabel.get('usd');
  const inr = byLabel.get('inr');
  const plusUsd = byLabel.get('+usd');
  const minusUsd = byLabel.get('-usd');
  const plusInr = byLabel.get('+inr');
  const minusInr = byLabel.get('-inr');

  if (!usd || !inr || !plusUsd || !minusUsd || !plusInr || !minusInr) return null;
  return { usd, inr, plusUsd, minusUsd, plusInr, minusInr };
}

function cryptoTotalFields(fields: BoxFieldDef[]) {
  const crypto = cryptoFields(fields);
  return crypto
    ? [crypto.plusUsd, crypto.minusUsd, crypto.plusInr, crypto.minusInr]
    : [];
}

function isCryptoTotalField(field: BoxFieldDef, fields: BoxFieldDef[]) {
  const crypto = cryptoFields(fields);
  if (!crypto) return false;
  const label = normalizedColumnLabel(field.label);
  return label === '+usd' || label === '-usd' || label === '+inr' || label === '-inr';
}

function wholeCryptoValue(value: unknown) {
  const rounded = Math.round(Number(value) || 0);
  return Object.is(rounded, -0) ? 0 : rounded;
}

function isWholeCalculatedField(field: BoxFieldDef) {
  const label = normalizedColumnLabel(field.label);
  return field.type === 'computed' && (label === 'inr' || label === 'value');
}

function columnTotals(rows: DetailRow[], fields: BoxFieldDef[]) {
  return cryptoTotalFields(fields).map((field) => ({
    label: field.label,
    value: rows.reduce((sum, row) => sum + wholeCryptoValue(row[field.label]), 0),
  }));
}

function visibleCustomFields(fields: BoxFieldDef[]) {
  if (cryptoTotalFields(fields).length === 0) return fields;
  return fields.filter((field) => normalizedColumnLabel(field.label) !== 'inrperusd');
}

function cryptoRate(fields: BoxFieldDef[]) {
  const rate = fields.find((field) => normalizedColumnLabel(field.label) === 'inrperusd');
  return rate?.auto === 'constant' ? Number(rate.constant) || 0 : null;
}

// Fills in every 'computed' column from its formula's two source columns (matched by label).
// Runs in field order, so a computed column may itself feed a later computed column
// (e.g. USD x Rate -> INR, then INR + Bonus% -> Value).
function computeRow<T extends BoxDetail>(row: T, fields: BoxFieldDef[]): T {
  const next: BoxDetail = { ...row };
  for (const field of fields) {
    if (field.type !== 'computed' || !field.formula) continue;
    const a = Number(next[field.formula.a]) || 0;
    const b = Number(next[field.formula.b]) || 0;
    const calculated = field.formula.op === 'multiply' ? a * b : a + (a * b) / 100;
    next[field.label] = isWholeCalculatedField(field) ? wholeCryptoValue(calculated) : calculated;
  }

  const crypto = cryptoFields(fields);
  if (crypto) {
    // USD and INR are the only signed inputs. Keep each derived total bucket mutually
    // exclusive so a row can never count in both the positive and negative total.
    const usd = wholeCryptoValue(next[crypto.usd.label]);
    const inr = wholeCryptoValue(next[crypto.inr.label]);
    next[crypto.plusUsd.label] = usd > 0 ? usd : 0;
    next[crypto.minusUsd.label] = usd < 0 ? usd : 0;
    next[crypto.plusInr.label] = inr > 0 ? inr : 0;
    next[crypto.minusInr.label] = inr < 0 ? inr : 0;
  }

  return next as T;
}

function blankCustomRow(fields: BoxFieldDef[], currentUserName?: string): BoxDetail {
  const row: BoxDetail = {};
  for (const field of fields) {
    if (field.auto === 'serial') continue; // computed from row position, never stored
    if (field.auto === 'user') { row[field.label] = currentUserName || ''; continue; }
    if (field.auto === 'constant') { row[field.label] = field.constant ?? 0; continue; }
    row[field.label] = field.type === 'number' || field.type === 'computed' ? 0 : '';
  }
  return computeRow(row, fields);
}

const GROUP_ID_KEY = '__tallyGroupId';
const GROUP_NAME_KEY = '__tallyGroupName';

type DetailGroup = {
  id: number;
  storageId: string;
  name: string;
  open: boolean;
  rows: DetailRow[];
};

let nextGroupId = 1;

function newDetailGroup(fields: BoxFieldDef[], currentUserName?: string): DetailGroup {
  const id = nextGroupId++;
  return {
    id,
    storageId: `group-${Date.now()}-${id}`,
    name: '',
    open: false,
    rows: [{ id: nextRowId++, ...blankCustomRow(fields, currentUserName) }],
  };
}

// Keep the saved details array flat for backend compatibility. Reserved primitive
// keys link table rows to a Name/Value group. Older rows without these keys become
// one group automatically, so existing Team Box data continues to work.
function customGroupsFromDetails(
  details: BoxDetail[] | undefined,
  fields: BoxFieldDef[],
  currentUserName?: string,
): DetailGroup[] {
  if (!details?.length) return [newDetailGroup(fields, currentUserName)];

  const groups = new Map<string, DetailGroup>();
  for (const detail of details) {
    const storageId = String(detail[GROUP_ID_KEY] ?? 'legacy');
    let group = groups.get(storageId);
    if (!group) {
      group = {
        id: nextGroupId++,
        storageId,
        name: String(detail[GROUP_NAME_KEY] ?? ''),
        open: false,
        rows: [],
      };
      groups.set(storageId, group);
    }

    const row = { ...detail };
    delete row[GROUP_ID_KEY];
    delete row[GROUP_NAME_KEY];
    group.rows.push(computeRow({ id: nextRowId++, ...row }, fields));
  }

  return Array.from(groups.values());
}

function GroupedCustomTallyBox({
  idPrefix,
  index,
  name,
  icon,
  color,
  value,
  details,
  fields,
  currentUserName,
  locked,
  onDetailsChange,
  onChange,
}: {
  idPrefix: string;
  index: number;
  name?: string;
  icon?: string;
  color?: string;
  value: number;
  details?: BoxDetail[];
  fields: BoxFieldDef[];
  currentUserName?: string;
  locked?: boolean;
  onDetailsChange?: (details: BoxDetail[]) => void;
  onChange: (v: number) => void;
}) {
  const colorHex = boxColorHex(color);
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<DetailGroup[]>(() =>
    customGroupsFromDetails(details, fields, currentUserName),
  );
  const total = useMemo(
    () => groups.reduce(
      (groupSum, group) => groupSum + group.rows.reduce((rowSum, row) => rowSum + customRowValue(row, fields), 0),
      0,
    ),
    [groups, fields],
  );
  const cryptoTotals = useMemo(
    () => columnTotals(groups.flatMap((group) => group.rows), fields),
    [groups, fields],
  );
  const displayFields = useMemo(() => visibleCustomFields(fields), [fields]);
  const conversionRate = cryptoRate(fields);
  const title = name?.trim() || `Box ${index}`;

  useEffect(() => {
    if (value === 0 && total !== 0) {
      setGroups([newDetailGroup(fields, currentUserName)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function groupValue(group: DetailGroup) {
    return group.rows.reduce((sum, row) => sum + customRowValue(row, fields), 0);
  }

  function emit(next: DetailGroup[]) {
    setGroups(next);
    onChange(next.reduce((sum, group) => sum + groupValue(group), 0));
    onDetailsChange?.(
      next.flatMap((group) =>
        group.rows.map(({ id, ...detail }) => ({
          ...detail,
          [GROUP_ID_KEY]: group.storageId,
          [GROUP_NAME_KEY]: group.name,
        })),
      ),
    );
  }

  function updateGroupName(groupId: number, groupName: string) {
    emit(groups.map((group) => (group.id === groupId ? { ...group, name: groupName } : group)));
  }

  function toggleGroup(groupId: number) {
    setGroups((current) =>
      current.map((group) => (group.id === groupId ? { ...group, open: !group.open } : group)),
    );
  }

  function updateCell(groupId: number, rowId: number, label: string, cellValue: string | number) {
    emit(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              rows: group.rows.map((row) =>
                row.id === rowId ? computeRow({ ...row, [label]: cellValue }, fields) : row,
              ),
            }
          : group,
      ),
    );
  }


  function addGroup() {
    emit([...groups, newDetailGroup(fields, currentUserName)]);
  }

  function removeGroup(groupId: number) {
    const next = groups.filter((group) => group.id !== groupId);
    emit(next.length ? next : [newDetailGroup(fields, currentUserName)]);
  }

  function addRow(groupId: number) {
    emit(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              rows: [...group.rows, { id: nextRowId++, ...blankCustomRow(fields, currentUserName) }],
            }
          : group,
      ),
    );
  }

  function removeRow(groupId: number, rowId: number) {
    emit(
      groups.map((group) => {
        if (group.id !== groupId) return group;
        const nextRows = group.rows.filter((row) => row.id !== rowId);
        return {
          ...group,
          rows: nextRows.length
            ? nextRows
            : [{ id: nextRowId++, ...blankCustomRow(fields, currentUserName) }],
        };
      }),
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={locked ? `${title}, view only` : `${title}, click to edit`}
        className="group relative h-14 w-full overflow-hidden rounded-lg border border-blue-100 bg-white p-2 text-left shadow-card transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_14px_30px_rgba(0,107,196,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
      >
        {locked && (
          <span className="absolute right-1.5 top-1.5 text-blue-900/25"><FiLock size={11} /></span>
        )}
        <span className="flex items-center justify-between gap-1.5">
          <span
            className={colorHex ? undefined : value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-600'}
            style={colorHex ? { color: colorHex } : undefined}
          >
            <FieldIcon icon={icon} size={11} />
          </span>
          <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-black">{title}</span>
        </span>
        <span
          className={`mt-1 block font-mono text-base font-bold tabular-nums ${
            colorHex ? '' : value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-950'
          }`}
          style={colorHex ? { color: colorHex } : undefined}
        >
          {wholeCryptoValue(value)}
        </span>
        <span className="mt-1.5 block space-y-1">
          {groups.filter((group) => group.name.trim()).map((group) => (
            <span key={group.id} className="flex min-w-0 items-center justify-between gap-2 text-[10px]">
              <span className="truncate font-medium text-blue-950/65">
                {group.name.trim()}
              </span>
              <span className="shrink-0 font-mono font-semibold tabular-nums text-blue-950">
                {groupValue(group)}
              </span>
            </span>
          ))}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${idPrefix}-box-${index}-title`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl xl:max-w-[1400px]">
            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
              <div>
                <h3 id={`${idPrefix}-box-${index}-title`} className="font-display text-xl text-blue-950">{title}</h3>
                <p className="text-xs text-blue-900/45">
                  {locked
                    ? 'View only — expand a name to see its details.'
                    : 'Add a name, then expand it to enter the configured table values.'}
                </p>
                {conversionRate !== null && (
                  <p className="mt-1 font-mono text-xs font-semibold text-blue-700">
                    1 USD = {conversionRate} INR
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close popup" className="rounded-lg p-2 text-blue-900/45 hover:bg-blue-50 hover:text-blue-800">
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-auto p-5">
              <div className="mb-2 grid grid-cols-[minmax(0,1fr)_7rem_auto] items-center gap-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">
                <span>Name</span>
                <span className="text-right">Value</span>
                <span className="w-[4.5rem]" />
              </div>

              <div className="space-y-3">
                {groups.map((group, groupIndex) => (
                  <section key={group.id} className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
                    <div className="grid grid-cols-[minmax(0,1fr)_7rem_auto] items-center gap-2 p-2">
                      <input
                        type="text"
                        value={group.name}
                        readOnly={locked}
                        onChange={(event) => !locked && updateGroupName(group.id, event.target.value)}
                        placeholder="Enter name"
                        aria-label={`Item ${groupIndex + 1} name`}
                        className={`min-w-0 rounded-lg border border-blue-100 px-3 py-2 text-sm font-medium text-blue-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 ${
                          locked ? 'cursor-default bg-blue-50/70 text-blue-900/60' : 'bg-blue-50/40'
                        }`}
                      />
                      <span
                        aria-label={`Item ${groupIndex + 1} value`}
                        className="rounded-lg bg-blue-50/70 px-3 py-2 text-right font-mono text-sm font-semibold tabular-nums text-blue-950"
                      >
                        {groupValue(group)}
                      </span>
                      <span className="flex w-[4.5rem] items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          aria-expanded={group.open}
                          aria-label={`${group.open ? 'Collapse' : 'Expand'} ${group.name.trim() || 'unnamed item'} details`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-50"
                        >
                          {group.open ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => removeGroup(group.id)}
                            aria-label={`Delete ${group.name.trim() || 'unnamed item'}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </span>
                    </div>

                    {group.open && (
                      <div className="overflow-x-auto border-t border-blue-100 bg-blue-50/20 px-3 pb-3 pt-2">
                        <table className="w-full min-w-max border-separate border-spacing-y-2 text-sm">
                          <thead>
                            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">
                              {displayFields.map((field) => (
                                <th key={field.label} className="px-1 pb-1 font-semibold">
                                  {field.label}
                                  {field.auto === 'constant' && (
                                    <span className="ml-1 font-normal normal-case text-blue-900/40">({field.constant ?? 0})</span>
                                  )}
                                </th>
                              ))}
                              {!locked && <th className="w-7" />}
                            </tr>
                          </thead>
                          <tbody>
                            {group.rows.map((row, rowIndex) => (
                              <tr key={row.id}>
                                {displayFields.map((field) => (
                                  <td key={field.label} className="px-1">
                                    {field.auto === 'serial' ? (
                                      <span className="flex h-7 min-w-[2rem] items-center justify-center rounded-lg bg-blue-50/80 px-1.5 font-mono text-xs text-blue-900/50">
                                        {rowIndex + 1}
                                      </span>
                                    ) : field.auto === 'constant' || field.type === 'computed' || isCryptoTotalField(field, fields) ? (
                                      <span
                                        aria-label={`Row ${rowIndex + 1} ${field.label}`}
                                        className="flex h-7 min-w-[5rem] items-center justify-end rounded-lg bg-blue-50/80 px-2 font-mono text-xs text-blue-900/70"
                                      >
                                        {Number(row[field.label]) || 0}
                                      </span>
                                    ) : field.type === 'number' ? (
                                      <div className="w-20">
                                        <SignedNumberInput
                                          value={Number(row[field.label]) || 0}
                                          onChange={(nextValue) => updateCell(group.id, row.id, field.label, nextValue)}
                                          label={`Row ${rowIndex + 1} ${field.label}`}
                                          readOnly={locked}
                                        />
                                      </div>
                                    ) : field.type === 'date' ? (
                                      <input
                                        type="date"
                                        value={String(row[field.label] ?? '')}
                                        readOnly={locked}
                                        onChange={(event) => !locked && updateCell(group.id, row.id, field.label, event.target.value)}
                                        aria-label={`Row ${rowIndex + 1} ${field.label}`}
                                        className={`min-w-[8rem] rounded-lg border border-blue-100 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 ${locked ? 'cursor-default bg-blue-50/70 text-blue-900/60' : 'bg-white'}`}
                                      />
                                    ) : field.type === 'time' ? (
                                      <input
                                        type="time"
                                        value={String(row[field.label] ?? '')}
                                        readOnly={locked}
                                        onChange={(event) => !locked && updateCell(group.id, row.id, field.label, event.target.value)}
                                        aria-label={`Row ${rowIndex + 1} ${field.label}`}
                                        className={`min-w-[6rem] rounded-lg border border-blue-100 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 ${locked ? 'cursor-default bg-blue-50/70 text-blue-900/60' : 'bg-white'}`}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={String(row[field.label] ?? '')}
                                        readOnly={locked}
                                        onChange={(event) => !locked && updateCell(group.id, row.id, field.label, event.target.value)}
                                        placeholder={field.label}
                                        aria-label={`Row ${rowIndex + 1} ${field.label}`}
                                        className={`min-w-[7rem] rounded-lg border border-blue-100 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 ${locked ? 'cursor-default bg-blue-50/70 text-blue-900/60' : 'bg-white'}`}
                                      />
                                    )}
                                  </td>
                                ))}
                                {!locked && (
                                  <td className="px-1">
                                    <button
                                      type="button"
                                      onClick={() => removeRow(group.id, row.id)}
                                      aria-label={`Remove row ${rowIndex + 1}`}
                                      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {!locked && (
                          <button
                            type="button"
                            onClick={() => addRow(group.id)}
                            className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            <FiPlus /> Add row
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                ))}
              </div>

              {!locked && (
                <button
                  type="button"
                  onClick={addGroup}
                  className="mt-4 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  <FiPlus /> Add name &amp; value
                </button>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-blue-100 bg-blue-50/60 px-5 py-4">
              {cryptoTotals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {cryptoTotals.map((column) => (
                    <span key={column.label} className="rounded-lg bg-white px-3 py-2 shadow-sm">
                      <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-blue-900/50">
                        {column.label}
                      </span>
                      <span className="font-mono text-base font-semibold tabular-nums text-blue-950">
                        {column.value}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <div>
                  <span className="mr-3 text-xs font-semibold uppercase tracking-wider text-blue-900/50">Total</span>
                  <span className="font-mono text-2xl font-semibold tabular-nums text-blue-950">{total}</span>
                </div>
              )}
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// All custom boxes except Box 2 keep the original direct-table workflow. Box 2 alone
// uses the grouped Name/Value summaries rendered by GroupedCustomTallyBox above.
function FlatCustomTallyBox({
  idPrefix,
  index,
  name,
  icon,
  color,
  value,
  details,
  fields,
  currentUserName,
  locked,
  onDetailsChange,
  onChange,
}: {
  idPrefix: string;
  index: number;
  name?: string;
  icon?: string;
  color?: string;
  value: number;
  details?: BoxDetail[];
  fields: BoxFieldDef[];
  currentUserName?: string;
  locked?: boolean;
  onDetailsChange?: (details: BoxDetail[]) => void;
  onChange: (v: number) => void;
}) {
  const colorHex = boxColorHex(color);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DetailRow[]>(() =>
    details?.length
      ? details.map((detail) => {
          const clean = { ...detail };
          delete clean[GROUP_ID_KEY];
          delete clean[GROUP_NAME_KEY];
          return computeRow({ id: nextRowId++, ...clean }, fields);
        })
      : [{ id: nextRowId++, ...blankCustomRow(fields, currentUserName) }],
  );
  const total = useMemo(
    () => rows.reduce((sum, row) => sum + customRowValue(row, fields), 0),
    [rows, fields],
  );
  const cryptoTotals = useMemo(() => columnTotals(rows, fields), [rows, fields]);
  const displayFields = useMemo(() => visibleCustomFields(fields), [fields]);
  const conversionRate = cryptoRate(fields);
  const title = name?.trim() || `Box ${index}`;

  useEffect(() => {
    if (value === 0 && total !== 0) {
      setRows([{ id: nextRowId++, ...blankCustomRow(fields, currentUserName) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emit(next: DetailRow[]) {
    setRows(next);
    onChange(next.reduce((sum, row) => sum + customRowValue(row, fields), 0));
    onDetailsChange?.(next.map(({ id, ...detail }) => detail));
  }

  function updateCell(id: number, label: string, cellValue: string | number) {
    emit(rows.map((row) => (row.id === id ? computeRow({ ...row, [label]: cellValue }, fields) : row)));
  }


  function addRow() {
    emit([...rows, { id: nextRowId++, ...blankCustomRow(fields, currentUserName) }]);
  }

  function removeRow(id: number) {
    const next = rows.filter((row) => row.id !== id);
    emit(next.length ? next : [{ id: nextRowId++, ...blankCustomRow(fields, currentUserName) }]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={locked ? `${title}, view only` : `${title}, click to edit`}
        className="group relative h-14 w-full overflow-hidden rounded-lg border border-blue-100 bg-white p-2 text-left shadow-card transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_14px_30px_rgba(0,107,196,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
      >
        {locked && (
          <span className="absolute right-1.5 top-1.5 text-blue-900/25"><FiLock size={11} /></span>
        )}
        <span className="flex items-center justify-between gap-1.5">
          <span
            className={colorHex ? undefined : value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-600'}
            style={colorHex ? { color: colorHex } : undefined}
          >
            <FieldIcon icon={icon} size={11} />
          </span>
          <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-black">{title}</span>
        </span>
        <span
          className={`mt-1 block font-mono text-sm font-bold tabular-nums ${
            colorHex ? '' : value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-blue-950'
          }`}
          style={colorHex ? { color: colorHex } : undefined}
        >
          {wholeCryptoValue(value)}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${idPrefix}-box-${index}-title`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl xl:max-w-[1400px]">
            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
              <div>
                <h3 id={`${idPrefix}-box-${index}-title`} className="font-display text-xl text-blue-950">{title}</h3>
                <p className="text-xs text-blue-900/45">
                  {locked
                    ? 'View only — someone else on this report enters these values.'
                    : 'Add a row for each record, then enter values below.'}
                </p>
                {conversionRate !== null && (
                  <p className="mt-1 font-mono text-xs font-semibold text-blue-700">
                    1 USD = {conversionRate} INR
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close popup"
                className="rounded-lg p-2 text-blue-900/45 hover:bg-blue-50 hover:text-blue-800"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-auto p-5">
              <table className="w-full min-w-max border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">
                    {displayFields.map((field) => (
                      <th key={field.label} className="px-1 pb-1 font-semibold">
                        {field.label}
                        {field.auto === 'constant' && (
                          <span className="ml-1 font-normal normal-case text-blue-900/40">
                            ({field.constant ?? 0})
                          </span>
                        )}
                      </th>
                    ))}
                    {!locked && <th className="w-7" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={row.id}>
                      {displayFields.map((field) => (
                        <td key={field.label} className="px-1">
                          {field.auto === 'serial' ? (
                            <span className="flex h-7 min-w-[2rem] items-center justify-center rounded-lg bg-blue-50/60 px-1.5 font-mono text-xs text-blue-900/50">
                              {rowIndex + 1}
                            </span>
                          ) : field.auto === 'constant' || field.type === 'computed' || isCryptoTotalField(field, fields) ? (
                            <span
                              aria-label={`Row ${rowIndex + 1} ${field.label}`}
                              className="flex h-7 min-w-[5rem] items-center justify-end rounded-lg bg-blue-50/60 px-2 font-mono text-xs text-blue-900/70"
                            >
                              {Number(row[field.label]) || 0}
                            </span>
                          ) : field.type === 'number' ? (
                            <div className="w-20">
                              <SignedNumberInput
                                value={Number(row[field.label]) || 0}
                                onChange={(nextValue) => updateCell(row.id, field.label, nextValue)}
                                label={`Row ${rowIndex + 1} ${field.label}`}
                                readOnly={locked}
                              />
                            </div>
                          ) : field.type === 'date' ? (
                            <input
                              type="date"
                              value={String(row[field.label] ?? '')}
                              readOnly={locked}
                              onChange={(event) => !locked && updateCell(row.id, field.label, event.target.value)}
                              aria-label={`Row ${rowIndex + 1} ${field.label}`}
                              className={`min-w-[8rem] rounded-lg border border-blue-100 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 ${locked ? 'cursor-default bg-blue-50/70 text-blue-900/60' : 'bg-blue-50/40'}`}
                            />
                          ) : field.type === 'time' ? (
                            <input
                              type="time"
                              value={String(row[field.label] ?? '')}
                              readOnly={locked}
                              onChange={(event) => !locked && updateCell(row.id, field.label, event.target.value)}
                              aria-label={`Row ${rowIndex + 1} ${field.label}`}
                              className={`min-w-[6rem] rounded-lg border border-blue-100 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 ${locked ? 'cursor-default bg-blue-50/70 text-blue-900/60' : 'bg-blue-50/40'}`}
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(row[field.label] ?? '')}
                              readOnly={locked}
                              onChange={(event) => !locked && updateCell(row.id, field.label, event.target.value)}
                              placeholder={field.label}
                              aria-label={`Row ${rowIndex + 1} ${field.label}`}
                              className={`min-w-[7rem] rounded-lg border border-blue-100 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 ${locked ? 'cursor-default bg-blue-50/70 text-blue-900/60' : 'bg-blue-50/40'}`}
                            />
                          )}
                        </td>
                      ))}
                      {!locked && (
                        <td className="px-1">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            aria-label={`Remove row ${rowIndex + 1}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {!locked && (
                <button
                  type="button"
                  onClick={addRow}
                  className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  <FiPlus /> Add row
                </button>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-blue-100 bg-blue-50/60 px-5 py-4">
              {cryptoTotals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {cryptoTotals.map((column) => (
                    <span key={column.label} className="rounded-lg bg-white px-3 py-2 shadow-sm">
                      <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-blue-900/50">
                        {column.label}
                      </span>
                      <span className="font-mono text-base font-semibold tabular-nums text-blue-950">
                        {column.value}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <div>
                  <span className="mr-3 text-xs font-semibold uppercase tracking-wider text-blue-900/50">Total</span>
                  <span className="font-mono text-2xl font-semibold tabular-nums text-blue-950">{total}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SignedNumberInput({ value, onChange, label, readOnly }: { value: number; onChange: (value: number) => void; label: string; readOnly?: boolean }) {
  const [text, setText] = useState(value === 0 ? '' : String(value));

  useEffect(() => setText(value === 0 ? '' : String(value)), [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      readOnly={readOnly}
      onChange={(event) => {
        if (readOnly) return;
        const next = event.target.value;
        if (!/^-?\d*(\.\d*)?$/.test(next)) return;
        setText(next);
        if (next === '' || next === '-' || next === '.' || next === '-.') {
          if (next === '') onChange(0);
          return;
        }
        onChange(Number(next));
      }}
      onBlur={() => {
        if (text === '-' || text === '.' || text === '-.') setText(value === 0 ? '' : String(value));
      }}
      placeholder="0"
      aria-label={label}
      className={`w-full min-w-0 rounded-lg border border-blue-100 px-2 py-1.5 text-right font-mono text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 ${readOnly ? 'bg-blue-50/70 text-blue-900/60 cursor-default' : 'bg-blue-50/40'}`}
    />
  );
}
