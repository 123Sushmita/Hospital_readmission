import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

/**
 * data: [{ label, value }]
 * baseline: optional number — bars above get risk.high tint, below get risk.low tint
 * suffix: appended to the value label, e.g. "%"
 * flatColor: if set, every bar uses this color instead of baseline comparison
 */
export default function HBarChart({ data, baseline, suffix = "", flatColor, height = 260 }) {
  const colorFor = (value) => {
    if (flatColor) return flatColor;
    if (baseline === undefined) return "#5B7A8C";
    if (value > baseline * 1.08) return "#B0473F";
    if (value < baseline * 0.92) return "#3F8F6B";
    return "#8FA6B3";
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 12, fill: "#16242E", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorFor(d.value)} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${v}${suffix}`}
            style={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#16242E" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
