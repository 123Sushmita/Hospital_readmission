const SHORT_LABELS = {
  time_in_hospital: "stay",
  n_lab_procedures: "lab procs",
  n_procedures: "procedures",
  n_medications: "meds",
  n_outpatient: "outpatient",
  n_inpatient: "inpatient",
  n_emergency: "emergency",
};

function cellColor(value) {
  // diverging scale: negative -> slate, positive -> ink, 0 -> near-white
  const intensity = Math.min(Math.abs(value), 1);
  if (value >= 0) {
    // blend paper -> ink
    const start = [246, 247, 245];
    const end = [22, 36, 46];
    const rgb = start.map((c, i) => Math.round(c + (end[i] - c) * intensity));
    return `rgb(${rgb.join(",")})`;
  }
  const start = [246, 247, 245];
  const end = [91, 122, 140];
  const rgb = start.map((c, i) => Math.round(c + (end[i] - c) * intensity));
  return `rgb(${rgb.join(",")})`;
}

function textColor(value) {
  return Math.abs(value) > 0.55 ? "#F6F7F5" : "#16242E";
}

export default function CorrelationHeatmap({ columns, matrix }) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-[3px] min-w-[480px]"
        style={{
          gridTemplateColumns: `90px repeat(${columns.length}, 1fr)`,
        }}
      >
        <div />
        {columns.map((c) => (
          <div
            key={c}
            className="text-[10px] font-mono text-ink/55 text-center pb-1 truncate"
            title={c}
          >
            {SHORT_LABELS[c] || c}
          </div>
        ))}
        {matrix.map((row, i) => (
          <div className="contents" key={i}>
            <div className="text-[10px] font-mono text-ink/55 flex items-center pr-2 truncate" title={columns[i]}>
              {SHORT_LABELS[columns[i]] || columns[i]}
            </div>
            {row.map((value, j) => (
              <div
                key={j}
                className="aspect-square rounded-[3px] flex items-center justify-center text-[10px] font-mono"
                style={{ backgroundColor: cellColor(value), color: textColor(value) }}
                title={`${columns[i]} × ${columns[j]}: ${value}`}
              >
                {value.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
