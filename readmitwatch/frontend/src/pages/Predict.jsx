import { useEffect, useState } from "react";
import api from "../api.js";
import Section from "../components/Section.jsx";
import { NumberField, SelectField } from "../components/FormField.jsx";

const FEATURE_LABELS = {
  n_inpatient: "Prior inpatient visits",
  n_outpatient: "Prior outpatient visits",
  n_medications: "Medication count",
  n_emergency: "Prior ER visits",
  n_lab_procedures: "Lab procedures",
  time_in_hospital: "Length of stay",
  n_procedures: "Procedures",
};

const RISK_STYLES = {
  Low: { bg: "bg-risk-lowbg", text: "text-risk-low", hex: "#3F8F6B" },
  Medium: { bg: "bg-risk-mediumbg", text: "text-risk-medium", hex: "#C8862E" },
  High: { bg: "bg-risk-highbg", text: "text-risk-high", hex: "#B0473F" },
};

const DEFAULT_NUMERIC = {
  time_in_hospital: 4,
  n_lab_procedures: 40,
  n_procedures: 1,
  n_medications: 15,
  n_outpatient: 0,
  n_inpatient: 0,
  n_emergency: 0,
};

export default function Predict() {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getOptions()
      .then((opts) => {
        setOptions(opts);
        setForm({
          ...DEFAULT_NUMERIC,
          age: opts.age[2],
          medical_specialty: opts.medical_specialty[0],
          diag_1: opts.diag_1[0],
          diag_2: opts.diag_2[0],
          diag_3: opts.diag_3[0],
          glucose_test: "no",
          A1Ctest: "no",
          change: "no",
          diabetes_med: "yes",
        });
      })
      .catch(() =>
        setError(
          "Couldn't reach the API. Make sure the FastAPI backend is running (see backend/README)."
        )
      );
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predict(form);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError("Couldn't score this patient. Check that every field is filled in.");
    } finally {
      setLoading(false);
    }
  }

  if (error && !options) {
    return (
      <div className="bg-risk-highbg border border-risk-high/30 text-ink rounded-xl px-5 py-4 text-sm">
        {error}
      </div>
    );
  }

  if (!options || !form) {
    return <div className="text-ink/50 text-sm font-mono py-12">Loading form…</div>;
  }

  const style = result ? RISK_STYLES[result.risk_level] : null;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-dark/80 mb-2">
        Patient Check
      </p>
      <h1 className="font-display text-3xl font-medium leading-tight mb-2">
        Score one patient at discharge.
      </h1>
      <p className="text-ink/55 text-sm max-w-lg mb-6">
        Enter the encounter details below. The score reflects the same factors flagged in the
        population view — it's a triage aid, not a clinical determination.
      </p>

      <div className="grid lg:grid-cols-3 gap-5">
        <form onSubmit={handleSubmit} className="lg:col-span-2">
          <Section title="Encounter details">
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField
                label="Age group"
                value={form.age}
                onChange={(v) => update("age", v)}
                options={options.age}
              />
              <NumberField
                label="Length of stay"
                value={form.time_in_hospital}
                onChange={(v) => update("time_in_hospital", v)}
                min={1}
                max={14}
                hint="days"
              />
              <NumberField
                label="Lab procedures"
                value={form.n_lab_procedures}
                onChange={(v) => update("n_lab_procedures", v)}
                min={0}
                max={130}
              />
              <NumberField
                label="Procedures"
                value={form.n_procedures}
                onChange={(v) => update("n_procedures", v)}
                min={0}
                max={10}
              />
              <NumberField
                label="Medications"
                value={form.n_medications}
                onChange={(v) => update("n_medications", v)}
                min={0}
                max={100}
              />
              <NumberField
                label="Prior outpatient visits"
                value={form.n_outpatient}
                onChange={(v) => update("n_outpatient", v)}
                min={0}
                max={40}
                hint="last year"
              />
              <NumberField
                label="Prior inpatient visits"
                value={form.n_inpatient}
                onChange={(v) => update("n_inpatient", v)}
                min={0}
                max={20}
                hint="last year"
              />
              <NumberField
                label="Prior ER visits"
                value={form.n_emergency}
                onChange={(v) => update("n_emergency", v)}
                min={0}
                max={70}
                hint="last year"
              />
            </div>
          </Section>

          <Section title="Diagnosis & care setting" className="mt-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField
                label="Medical specialty"
                value={form.medical_specialty}
                onChange={(v) => update("medical_specialty", v)}
                options={options.medical_specialty}
              />
              <SelectField
                label="Primary diagnosis"
                value={form.diag_1}
                onChange={(v) => update("diag_1", v)}
                options={options.diag_1}
              />
              <SelectField
                label="Secondary diagnosis"
                value={form.diag_2}
                onChange={(v) => update("diag_2", v)}
                options={options.diag_2}
              />
              <SelectField
                label="Tertiary diagnosis"
                value={form.diag_3}
                onChange={(v) => update("diag_3", v)}
                options={options.diag_3}
              />
            </div>
          </Section>

          <Section title="Labs & medication" className="mt-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField
                label="Glucose test"
                value={form.glucose_test}
                onChange={(v) => update("glucose_test", v)}
                options={options.glucose_test}
              />
              <SelectField
                label="A1C test"
                value={form.A1Ctest}
                onChange={(v) => update("A1Ctest", v)}
                options={options.A1Ctest}
              />
              <SelectField
                label="Medication changed this visit"
                value={form.change}
                onChange={(v) => update("change", v)}
                options={options.change}
              />
              <SelectField
                label="On diabetes medication"
                value={form.diabetes_med}
                onChange={(v) => update("diabetes_med", v)}
                options={options.diabetes_med}
              />
            </div>
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full sm:w-auto px-6 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-slate-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Scoring…" : "Check risk"}
          </button>
          {error && <p className="text-risk-high text-sm mt-3">{error}</p>}
        </form>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            {!result ? (
              <Section eyebrow="Result" title="Risk score">
                <p className="text-sm text-ink/45">
                  Fill in the form and select "Check risk" to see this patient's readmission
                  score.
                </p>
              </Section>
            ) : (
              <div
                className={`acuity-card rounded-2xl p-6 ${style.bg}`}
                style={{ "--acuity-color": style.hex }}
              >
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink/50 mb-1">
                  Readmission risk
                </p>
                <p className="font-display text-5xl font-medium text-ink leading-none">
                  {result.readmission_probability}
                  <span className="text-xl">%</span>
                </p>
                <p className={`mt-2 text-sm font-semibold ${style.text}`}>
                  {result.risk_level} risk
                </p>
                <p className="text-sm text-ink/70 mt-3">{result.message}</p>

                <div className="mt-5 pt-4 border-t border-ink/10">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-ink/50 mb-2">
                    Compared to the average patient
                  </p>
                  <ul className="space-y-1.5">
                    {result.comparisons.map((c) => (
                      <li key={c.feature} className="flex items-center justify-between text-sm">
                        <span className="text-ink/70">
                          {FEATURE_LABELS[c.feature] || c.feature}
                        </span>
                        <span className="font-mono text-xs">
                          <span className="font-medium">{c.patient_value}</span>
                          <span className="text-ink/40"> vs avg {c.average_value}</span>{" "}
                          {c.direction === "above_average" && <span className="text-risk-high">↑</span>}
                          {c.direction === "below_average" && <span className="text-risk-low">↓</span>}
                          {c.direction === "at_average" && <span className="text-ink/40">≈</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-[11px] text-ink/35 mt-4">
                  Scored by {result.model_used} · decision support only
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
