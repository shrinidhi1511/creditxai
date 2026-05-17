import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import toast from "react-hot-toast";

const PURPOSES = ["Personal", "Home", "Auto", "Business", "Education"];

const FIELDS = [
  { name: "age", label: "Age", type: "number", placeholder: "e.g. 32", min: 18, max: 70 },
  { name: "employment_years", label: "Years of Employment", type: "number", placeholder: "e.g. 5", min: 0, max: 40, step: 0.5 },
  { name: "annual_income", label: "Annual Income ($)", type: "number", placeholder: "e.g. 75000", min: 0 },
  { name: "credit_score", label: "Credit Score", type: "number", placeholder: "300 – 850", min: 300, max: 850 },
  { name: "debt_to_income", label: "Debt-to-Income Ratio", type: "number", placeholder: "e.g. 0.35", min: 0, max: 1, step: 0.01 },
  { name: "num_credit_lines", label: "Number of Credit Lines", type: "number", placeholder: "e.g. 4", min: 1, max: 20 },
  { name: "loan_amount", label: "Loan Amount ($)", type: "number", placeholder: "e.g. 15000", min: 1000 },
  { name: "loan_term", label: "Loan Term (months)", type: "number", placeholder: "e.g. 36", min: 6, max: 60 },
];

export default function ApplyPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    age: "", employment_years: "", annual_income: "", credit_score: "",
    debt_to_income: "", num_credit_lines: "", loan_amount: "", loan_term: "",
    loan_purpose: "Personal",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        employment_years: parseFloat(form.employment_years),
        annual_income: parseFloat(form.annual_income),
        credit_score: parseInt(form.credit_score),
        debt_to_income: parseFloat(form.debt_to_income),
        num_credit_lines: parseInt(form.num_credit_lines),
        loan_amount: parseFloat(form.loan_amount),
        loan_term: parseInt(form.loan_term),
        loan_purpose: form.loan_purpose.toLowerCase(),
      };
      const { data } = await api.post("/api/apply", payload);
      toast.success("Application submitted! Analyzing with AI…");
      navigate(`/application/${data.application_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate("/dashboard")} className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 mb-4">
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">New Loan Application</h1>
          <p className="text-gray-500 mt-1">Fill in the details below. Our AI will evaluate your application instantly.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Applicant Info */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">👤</span>
              Applicant Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FIELDS.slice(0, 4).map((f) => (
                <div key={f.name}>
                  <label className="label">{f.label}</label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                    step={f.step || 1}
                    value={form[f.name]}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Financial Info */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-sm">💳</span>
              Financial Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FIELDS.slice(4).map((f) => (
                <div key={f.name}>
                  <label className="label">{f.label}</label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                    step={f.step || 1}
                    value={form[f.name]}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              ))}

              {/* Loan Purpose */}
              <div>
                <label className="label">Loan Purpose</label>
                <select
                  id="loan_purpose"
                  name="loan_purpose"
                  value={form.loan_purpose}
                  onChange={handleChange}
                  className="input-field"
                >
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* AI Notice */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex gap-3">
            <span className="text-2xl mt-0.5">🤖</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">AI-Powered Instant Decision</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Our Random Forest model will analyze your application with SHAP & LIME explainability in seconds.
              </p>
            </div>
          </div>

          <button
            id="submit-application"
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-base py-3.5 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Submitting & Analyzing…
              </>
            ) : (
              "Submit Application 🚀"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
