# ReadmitWatch

A small full-stack platform built on top of the [Hospital_readmission](https://github.com/123Sushmita/Hospital_readmission)
analysis. It turns that one-off notebook into something a hospital quality/care-management
team could actually click around in:

- **Population dashboard** — readmission rate by age, specialty, diagnosis, and treatment
  factors; correlations between utilization metrics; model comparison.
- **Patient Check** — enter one encounter's details and get a readmission risk score, risk
  band (Low/Medium/High), and how that patient compares to the average.

```
readmitwatch/
├── backend/        FastAPI service: trains the model, serves predictions + dashboard stats
└── frontend/        React (Vite) app: Population dashboard + Patient Check form
```

## What changed vs. the original notebook

The notebook label-encoded categorical columns (e.g. `medical_specialty`), which silently
implies an order that doesn't exist ("Cardiology" < "Surgery" makes no real sense to a model).
This version one-hot encodes them in a proper `sklearn` `Pipeline`, so the same preprocessing
is applied consistently at training and prediction time — and the model is small enough to
serve directly instead of needing a notebook re-run per patient.

Heads up on expectations: ROC-AUC for the best model (Gradient Boosting) lands around **0.66**.
That's a real but modest signal — these administrative fields (visit counts, medication count,
diagnosis category) only partly explain readmission. Treat this as a triage aid that helps
prioritize follow-up calls, not a clinical determination.

## Running it locally

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt

python train_model.py        # trains the model, writes backend/model/*.joblib + *.json
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://127.0.0.1:8000`. Interactive docs at `http://127.0.0.1:8000/docs`.

You only need to re-run `train_model.py` if you change `data/hospital_readmissions.csv` or the
training script — the trained model and precomputed dashboard stats are saved to `backend/model/`
and loaded at API startup.

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env        # points the app at http://127.0.0.1:8000 by default
npm run dev
```

Open `http://127.0.0.1:5173`. Make sure the backend is running first — the dashboard and the
predict form both fetch from it on load.

## Deploying it for real

This is a standard two-service app, so any host that runs a Python web service + a static
site works:

- **Backend**: Render, Railway, or Fly.io all run a FastAPI app from a `requirements.txt` and
  a start command (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`) with very little config.
  Run `train_model.py` once during your build step (or commit the `backend/model/` artifacts,
  which are already included here) so the API has something to load on boot.
- **Frontend**: Vercel or Netlify can build and host the Vite app directly from this folder.
  Set `VITE_API_URL` in that platform's environment variables to your deployed backend's URL.
- **CORS**: `backend/app/main.py` currently allows all origins (`allow_origins=["*"]`) to make
  local development easy. Before going live, change that to your actual frontend domain.

## Extending it

A few natural next steps, roughly in order of effort:

1. **Per-patient explanations**: swap the simple "vs. average" comparison for SHAP values, so
   each prediction shows exactly how much each feature pushed the score up or down.
2. **Auth + multi-user**: if more than one person on a care team will use this, add login
   (e.g. via an auth provider) and maybe a saved-patients list.
3. **Real EHR integration**: right now the form is manually filled in. Connecting to a hospital's
   actual EHR/FHIR feed would be the real unlock — but that's a much bigger compliance and
   security lift (HIPAA, BAAs, etc.) than this prototype takes on.
4. **Model monitoring**: track prediction distributions over time and retrain on fresh data
   periodically, rather than the one-time `train_model.py` run.
