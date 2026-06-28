export default function Section({ eyebrow, title, subtitle, children, className = "" }) {
  return (
    <section className={`bg-white border border-ink/10 rounded-2xl p-6 ${className}`}>
      {(eyebrow || title) && (
        <div className="mb-4">
          {eyebrow && (
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-dark/80 mb-1">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
          )}
          {subtitle && <p className="text-sm text-ink/55 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
