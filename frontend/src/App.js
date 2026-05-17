import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ApplyPage from "./pages/ApplyPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
            },
            success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/apply"     element={<ProtectedRoute><ApplyPage /></ProtectedRoute>} />
          <Route path="/application/:id" element={<ProtectedRoute><ApplicationDetailPage /></ProtectedRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
