import axios from "axios";

// Set VITE_API_URL in a .env file to point at your deployed backend.
// Defaults to the local FastAPI dev server.
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export const api = {
  getOptions: () => client.get("/api/options").then((r) => r.data),
  getOverview: () => client.get("/api/dashboard/overview").then((r) => r.data),
  getAgeDistribution: () =>
    client.get("/api/dashboard/age-distribution").then((r) => r.data),
  getCategoricalBreakdowns: () =>
    client.get("/api/dashboard/categorical-breakdowns").then((r) => r.data),
  getNumericalDistributions: () =>
    client.get("/api/dashboard/numerical-distributions").then((r) => r.data),
  getCorrelations: () =>
    client.get("/api/dashboard/correlations").then((r) => r.data),
  getFeatureImportance: () =>
    client.get("/api/dashboard/feature-importance").then((r) => r.data),
  getModelInfo: () => client.get("/api/model-info").then((r) => r.data),
  predict: (payload) =>
    client.post("/api/predict", payload).then((r) => r.data),
};

export default api;
