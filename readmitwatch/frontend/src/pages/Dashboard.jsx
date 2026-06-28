import { useEffect, useState } from "react";
import api from "../api.js";
import Section from "../components/Section.jsx";
import KpiCard from "../components/KpiCard.jsx";
import ProportionBar from "../components/ProportionBar.jsx";
import HBarChart from "../components/HBarChart.jsx";
import CorrelationHeatmap from "../components/CorrelationHeatmap.jsx";

const FEATURE_LABELS = {
  n_inpatient: "Prior inpatient visits",
  n_outpatient: "Prior outpatient visits",
  n_medications: "Medication count",
  n_emergency: "Prior ER visits",
  n_lab_procedures: "Lab procedures",
  time_in_hospital: "Length of stay",
  n_procedures: "Procedures",
};

function RateRow({ label, rate, baseline }) {
  const diff = rate - baseline;
  const tone = diff > 3 ? "text-risk-high" : diff < -3 ? "text-risk-low" : "text-ink/60";
  return (
    <div className="flex items-center justify-between py-2 border-b border-ink/5 last:border-0">
      <span className="text-sm text-ink/75">{label}</span>
      <span className="font-mono text-sm">
        <span className="font-medium text-ink">{rate}%</span>{" "}
        <span className={tone}>
          {diff > 0 ? "+" : ""}
          {diff.toFixed(1)}
        </span>
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getAgeDistribution(),
      api.getCategoricalBreakdowns(),
      api.getCorrelations(),
      api.getModelInfo(),
    ])
      .then(([overview, ageDistribution, categoricalBreakdowns, correlations, modelInfo]) => {
        setData({ overview, ageDistribution, categoricalBreakdowns, correlations, modelInfo });
      })
      .catch((err) => {
        console.error(err);
        setError(
          "Couldn't reach the API. Make sure the FastAPI backend is running (see backend/README)."
        );
      });
  }, []);

  if (error) {
    return (
      <div className="bg-risk-highbg border border-risk-high/30 text-ink rounded-xl px-5 py-4 text-sm">
        {error}
      </div>
    );
  }

  if (!data) {
    return <div className="text-ink/50 text-sm font-mono py-12">Loading population data…</div>;
  }

  const { overview, ageDistribution, categoricalBreakdowns, correlations, modelInfo } = data;
  const best = modelInfo.model_comparison.find((m) => m.model === modelInfo.best_model);

  const ageData = ageDistribution.map((d) => ({ label: d.age, value: d.readmission_rate }));
  const importanceData = modelInfo.feature_importance
    .slice(0, 7)
    .map((f) => ({ label: FEATURE_LABELS[f.feature] || f.feature, value: f.importance }));
  const specialtyData = categoricalBreakdowns.medical_specialty.map((d) => ({
    label: d.category,
    value: d.readmission_rate,
  }));
  const diagData = categoricalBreakdowns.diag_1.map((d) => ({
    label: d.category,
    value: d.readmission_rate,
  }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="pb-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-slate-dark/80 mb-2">
          Population · {overview.total_patients.toLocaleString()} encounters
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-medium leading-tight max-w-xl">
          Nearly every other patient comes back within 30 days.
        </h1>
        <p className="text-ink/55 mt-2 max-w-lg text-sm">
          Across this cohort, {overview.readmission_rate}% of discharged patients were
          readmitted. The chart below shows how that splits.
        </p>
        <div className="max-w-md mt-5">
          <ProportionBar
            segments={[
              {
                label: "Readmitted",
                value: overview.readmission_rate,
                count: overview.readmitted_count,
                color: "#B0473F",
              },
              {
                label: "Not readmitted",
                value: Math.round((100 - overview.readmission_rate) * 100) / 100,
                count: overview.not_readmitted_count,
                color: "#3F8F6B",
              },
            ]}
          />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Avg. length of stay" value={overview.avg_time_in_hospital} unit="days" />
        <KpiCard label="Avg. medications" value={overview.avg_medications} acuity="slate" />
        <KpiCard label="Avg. lab procedures" value={overview.avg_lab_procedures} acuity="slate" />
        <KpiCard
          label={`Best model (${modelInfo.best_model})`}
          value={best.roc_auc}
          unit="ROC-AUC"
          acuity="low"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Section eyebrow="By age group" title="Readmission rate climbs with age">
          <HBarChart data={ageData} suffix="%" baseline={overview.readmission_rate} />
        </Section>
        <Section
          eyebrow="Model-derived"
          title="What drives the risk score"
          subtitle="Relative importance in the best-performing model"
        >
          <HBarChart data={importanceData} flatColor="#5B7A8C" height={280} />
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Section
          eyebrow="Numeric features"
          title="How utilization metrics relate"
          subtitle="Pearson correlation across the cohort"
        >
          <CorrelationHeatmap columns={correlations.columns} matrix={correlations.matrix} />
        </Section>
        <Section eyebrow="By care setting" title="Readmission rate by medical specialty">
          <HBarChart data={specialtyData} suffix="%" baseline={overview.readmission_rate} height={280} />
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Section eyebrow="By primary diagnosis" title="Readmission rate by diagnosis category">
          <HBarChart data={diagData} suffix="%" baseline={overview.readmission_rate} height={280} />
        </Section>

        <Section eyebrow="Treatment factors" title="Readmission rate vs. population average">
          <p className="text-xs text-ink/40 mb-1">
            Population average: {overview.readmission_rate}% · shown as deviation from it
          </p>
          {[
            ["glucose_test", "Glucose test"],
            ["A1Ctest", "A1C test"],
            ["change", "Medication changed"],
            ["diabetes_med", "On diabetes medication"],
          ].map(([key, label]) => (
            <div key={key} className="mb-3">
              <p className="text-xs font-mono uppercase tracking-wide text-ink/40 mb-1 mt-2">
                {label}
              </p>
              {categoricalBreakdowns[key].map((row) => (
                <RateRow
                  key={row.category}
                  label={row.category}
                  rate={row.readmission_rate}
                  baseline={overview.readmission_rate}
                />
              ))}
            </div>
          ))}
        </Section>
      </div>

      <Section
        eyebrow="Model comparison"
        title="Four algorithms, same preprocessing pipeline"
        subtitle="Evaluated on a held-out 20% test split"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/40 font-mono text-[11px] uppercase tracking-wide">
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4">Accuracy</th>
                <th className="py-2 pr-4">Precision</th>
                <th className="py-2 pr-4">Recall</th>
                <th className="py-2 pr-4">F1</th>
                <th className="py-2 pr-4">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {modelInfo.model_comparison.map((m) => (
                <tr
                  key={m.model}
                  className={`border-t border-ink/5 ${
                    m.model === modelInfo.best_model ? "bg-risk-lowbg/60" : ""
                  }`}
                >
                  <td className="py-2 pr-4 font-body font-medium">{m.model}</td>
                  <td className="py-2 pr-4">{m.accuracy}</td>
                  <td className="py-2 pr-4">{m.precision}</td>
                  <td className="py-2 pr-4">{m.recall}</td>
                  <td className="py-2 pr-4">{m.f1}</td>
                  <td className="py-2 pr-4">{m.roc_auc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink/40 mt-3">
          ROC-AUC in the {best.roc_auc} range reflects a real, modest signal — these
          administrative fields (visit counts, meds, diagnosis category) only partly explain
          readmission. Treat outputs as a triage aid, not a clinical determination.
        </p>
      </Section>
    </div>
  );
}
