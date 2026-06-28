const ACUITY_COLORS = {
  slate: "#5B7A8C",
  low: "#3F8F6B",
  medium: "#C8862E",
  high: "#B0473F",
};

export default function KpiCard({ label, value, unit, acuity = "slate" }) {
  return (
    <div
      className="acuity-card bg-white rounded-xl px-5 py-4"
      style={{ "--acuity-color": ACUITY_COLORS[acuity] }}
    >
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink/45 mb-1.5">
        {label}
      </p>
      <p className="font-display text-3xl font-medium text-ink leading-none">
        {value}
        {unit && <span className="text-base font-body text-ink/50 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
