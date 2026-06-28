export default function ProportionBar({ segments }) {
  // segments: [{ label, value, count, color }]
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <div className="flex h-10 rounded-lg overflow-hidden border border-ink/10">
        {segments.map((s, i) => (
          <div
            key={i}
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            className="flex items-center justify-center transition-all duration-700 ease-out"
            title={`${s.label}: ${s.value}%`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-3">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-sm text-ink/70">
              {s.label}{" "}
              <span className="font-mono text-ink font-medium">{s.value}%</span>
              <span className="text-ink/40"> · {s.count.toLocaleString()}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
