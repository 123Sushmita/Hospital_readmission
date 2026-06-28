import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Predict from "./pages/Predict.jsx";

function NavTab({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          isActive
            ? "bg-ink text-paper"
            : "text-ink/70 hover:text-ink hover:bg-paperdim"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-paper font-body text-ink flex flex-col">
      <header className="sticky top-0 z-20 bg-paper/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-medium tracking-tight">
              ReadmitWatch
            </span>
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-ink/45">
              readmission analytics
            </span>
          </div>
          <nav className="flex items-center gap-1">
            <NavTab to="/">Population</NavTab>
            <NavTab to="/predict">Patient Check</NavTab>
          </nav>
        </div>
        <div className="trace-rule" />
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/predict" element={<Predict />} />
        </Routes>
      </main>

      <footer className="border-t border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-5 text-xs text-ink/50 font-mono flex flex-wrap items-center justify-between gap-2">
          <span>Data: 25,000 historical encounters · model retrained via train_model.py</span>
          <span>Decision support only — not a clinical diagnosis</span>
        </div>
      </footer>
    </div>
  );
}
