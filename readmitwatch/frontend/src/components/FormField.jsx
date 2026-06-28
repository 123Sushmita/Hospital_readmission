export function NumberField({ label, value, onChange, min, max, hint }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-wide text-ink/50">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono focus:border-slate focus:ring-1 focus:ring-slate outline-none"
      />
      {hint && <span className="text-[11px] text-ink/35">{hint}</span>}
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-wide text-ink/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-slate focus:ring-1 focus:ring-slate outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
