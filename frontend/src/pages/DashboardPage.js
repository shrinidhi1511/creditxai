import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";

function StatCard({ label, value, border, icon }) {
  return (
    <div className={`card border-l-4 ${border} flex items-center gap-4`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function ApplicationCard({ app, onView }) {
  const isApproved = app.decision === "APPROVED";
  const purpose = app.loan_purpose
    ? app.loan_purpose.charAt(0).toUpperCase() + app.loan_purpose.slice(1)
    : "—";

  return (
    <div className="card hover:shadow-md transition-all duration-200 group border border-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              ${app.loan_amount?.toLocaleString()} &mdash; {app.loan_term} months
            </h3>
            <StatusBadge status={app.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">Purpose</p>
              <p className="text-sm font-semibold text-gray-700">{purpose}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">Credit Score</p>
              <p className="text-sm font-semibold text-gray-700">{app.credit_score}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">Applied</p>
              <p className="text-sm font-semibold text-gray-700">
                {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">Risk Score</p>
              <p className={`text-sm font-bold ${app.risk_score > 50 ? "text-red-500" : "text-emerald-600"}`}>
                {app.risk_score}%
              </p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-3">
          <div className={`text-sm font-bold px-3 py-1.5 rounded-lg ${isApproved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {isApproved ? "✅" : "❌"} AI: {app.decision}
          </div>
          <button
            id={`view-app-${app.id}`}
            onClick={() => onView(app.id)}
            className="btn-primary text-sm py-2 px-5 group-hover:shadow-md"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard")
      .then(({ data }) => setData(data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || { total: 0, approved: 0, pending: 0, rejected: 0 };
  const applications = data?.applications || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">CreditXAI</span>
              <p className="text-xs text-gray-400 leading-none">AI Credit Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">
                Welcome, {user?.name} 👋
              </p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn-secondary text-sm py-2 px-4"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Applications</h1>
            <p className="text-gray-500 text-sm mt-1">Track and manage your loan applications</p>
          </div>
          <button
            id="new-application-btn"
            onClick={() => navigate("/apply")}
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-lg">+</span> New Application
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Applications" value={stats.total} border="border-l-blue-400" icon="📋" />
          <StatCard label="Approved" value={stats.approved} border="border-l-emerald-400" icon="✅" />
          <StatCard label="Pending" value={stats.pending} border="border-l-amber-400" icon="⏳" />
          <StatCard label="Rejected" value={stats.rejected} border="border-l-red-400" icon="❌" />
        </div>

        {/* Applications list */}
        {applications.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-6">Submit your first loan application and get an instant AI decision.</p>
            <button
              onClick={() => navigate("/apply")}
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>+</span> Apply for a Loan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onView={(id) => navigate(`/application/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
