import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";

const FEATURE_LABELS = {
  credit_score: "Credit Score",
  annual_income: "Annual Income",
  debt_to_income: "Debt-to-Income",
  employment_years: "Employment Yrs",
  loan_amount: "Loan Amount",
  loan_term: "Loan Term",
  num_credit_lines: "Credit Lines",
  age: "Age",
  loan_purpose: "Loan Purpose",
};

function SHAPTab({ shapValues }) {
  const data = Object.entries(shapValues)
    .map(([key, val]) => ({ feature: FEATURE_LABELS[key] || key, value: val }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const v = payload[0].value;
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm">
          <p className="font-semibold text-gray-800">{payload[0].payload.feature}</p>
          <p className={`font-bold ${v >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            SHAP: {v > 0 ? "+" : ""}{v.toFixed(4)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3">
        <span className="text-xl">📊</span>
        <div>
          <p className="text-sm font-semibold text-indigo-800">SHAP (SHapley Additive exPlanations)</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Positive values (green) push toward APPROVAL. Negative values (red) push toward REJECTION.
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-5">Feature Importance (SHAP Values)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => v.toFixed(3)} />
            <YAxis type="category" dataKey="feature" width={110} tick={{ fontSize: 11, fill: "#374151" }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#d1d5db" strokeWidth={1.5} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.value >= 0 ? "#10B981" : "#EF4444"} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="card mt-4">
        <h3 className="text-base font-semibold text-gray-800 mb-4">SHAP Value Breakdown</h3>
        <div className="divide-y divide-gray-50">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-gray-700 w-36">{item.feature}</span>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.value >= 0 ? "bg-emerald-400" : "bg-red-400"}`}
                    style={{ width: `${Math.min(Math.abs(item.value) * 300, 100)}%` }}
                  />
                </div>
              </div>
              <span className={`text-sm font-bold w-20 text-right ${item.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {item.value > 0 ? "+" : ""}{item.value.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LIMETab({ limeValues }) {
  const sorted = [...limeValues].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const maxAbs = Math.max(...sorted.map((d) => Math.abs(d.value)), 0.001);

  const chartData = sorted.map((d) => ({
    feature: FEATURE_LABELS[d.feature] || d.feature,
    value: d.value,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const v = payload[0].value;
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm">
          <p className="font-semibold text-gray-800">{payload[0].payload.feature}</p>
          <p className={`font-bold ${v >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            Weight: {v > 0 ? "+" : ""}{v.toFixed(4)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Info box */}
      <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
        <span className="text-xl">🔍</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">LIME (Local Interpretable Model-agnostic Explanations)</p>
          <p className="text-xs text-amber-700 mt-0.5">
            LIME explains this specific prediction by approximating the model locally. Each condition shows
            how a feature influenced <em>this individual</em> decision — positive (green) means it helped approval,
            negative (red) means it hurt.
          </p>
        </div>
      </div>

      {/* Feature list */}
      <div className="card mb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-5">Local Feature Explanations</h3>
        <div className="space-y-4">
          {sorted.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xs text-gray-400 font-mono w-5 mt-1 text-right">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {item.condition}
                  </span>
                  <span className={`text-sm font-bold ml-3 ${item.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {item.value > 0 ? "+" : ""}{item.value.toFixed(4)}
                  </span>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 h-full rounded-full transition-all duration-500 ${item.value >= 0 ? "bg-emerald-400 left-0" : "bg-red-400 right-0"}`}
                    style={{ width: `${(Math.abs(item.value) / maxAbs) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-5">LIME Explanation Visualization</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => v.toFixed(3)} />
            <YAxis type="category" dataKey="feature" width={110} tick={{ fontSize: 11, fill: "#374151" }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#d1d5db" strokeWidth={1.5} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.value >= 0 ? "#10B981" : "#EF4444"} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("shap");

  useEffect(() => {
    api.get(`/api/application/${id}`)
      .then(({ data }) => setApp(data))
      .catch(() => { toast.error("Application not found"); navigate("/dashboard"); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading application…</p>
        </div>
      </div>
    );
  }
  if (!app) return null;

  const isApproved = app.decision === "APPROVED";

  const detailGrid = [
    { label: "Age", value: `${app.age} yrs` },
    { label: "Annual Income", value: `$${app.annual_income?.toLocaleString()}` },
    { label: "Employment", value: `${app.employment_years} yrs` },
    { label: "Credit Score", value: app.credit_score },
    { label: "Debt-to-Income", value: app.debt_to_income?.toFixed(2) },
    { label: "Credit Lines", value: app.num_credit_lines },
    { label: "Purpose", value: app.loan_purpose?.charAt(0).toUpperCase() + app.loan_purpose?.slice(1) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 transition-colors">
              <span className="text-lg">🧠</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CreditXAI</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              Welcome, <strong className="text-gray-700">{user?.name}</strong>
            </span>
            <button onClick={() => { logout(); navigate("/login"); }} className="btn-secondary text-sm py-2 px-4">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back */}
        <button onClick={() => navigate("/dashboard")} className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 mb-6">
          ← Back to Dashboard
        </button>

        {/* Header card */}
        <div className="card mb-6 border-l-4 border-l-blue-400">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">APPLICATION ID</p>
              <p className="font-mono text-sm text-gray-700 break-all">{app.id}</p>
              <p className="text-xs text-gray-400 mt-2">
                Submitted: {new Date(app.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={app.status} />
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  <strong>{app.applicant_name}</strong>
                </p>
                <p className="text-xs text-gray-400">{app.applicant_email}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-400">Loan Amount</p>
              <p className="text-xl font-bold text-gray-900">${app.loan_amount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Loan Term</p>
              <p className="text-xl font-bold text-gray-900">{app.loan_term} months</p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className={`card mb-6 border-l-4 ${isApproved ? "border-l-emerald-400 bg-emerald-50/30" : "border-l-red-400 bg-red-50/30"}`}>
          <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <span>🤖</span> AI Prediction Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Decision */}
            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 mb-2 font-medium">DECISION</p>
              <div className={`text-2xl font-extrabold ${isApproved ? "text-emerald-600" : "text-red-500"}`}>
                {isApproved ? "✅" : "❌"} {app.decision}
              </div>
            </div>

            {/* Approval Probability */}
            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 mb-2 font-medium">APPROVAL PROBABILITY</p>
              <p className="text-2xl font-extrabold text-blue-600">{app.approval_probability}%</p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${app.approval_probability}%` }}
                />
              </div>
            </div>

            {/* Risk Score */}
            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 mb-2 font-medium">RISK SCORE</p>
              <p className={`text-2xl font-extrabold ${app.risk_score > 50 ? "text-red-500" : "text-emerald-600"}`}>
                {app.risk_score}%
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${app.risk_score > 50 ? "bg-red-400" : "bg-emerald-400"}`}
                  style={{ width: `${app.risk_score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Applicant Details */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Applicant Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {detailGrid.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium mb-1">{item.label}</p>
                <p className="text-base font-semibold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Explainability Tabs */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">AI Explainability</h2>

          {/* Tab buttons */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
            {[
              { key: "shap", label: "📊 SHAP Analysis" },
              { key: "lime", label: "🔍 LIME Analysis" },
            ].map((tab) => (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "shap" && app.shap_values && (
            <SHAPTab shapValues={app.shap_values} />
          )}
          {activeTab === "lime" && app.lime_values && (
            <LIMETab limeValues={app.lime_values} />
          )}
        </div>
      </div>
    </div>
  );
}
