import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Wrench, ShieldCheck, Lock, Mail, ArrowRight, UserCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("karim@techstar.com");
  const [password, setPassword] = useState("password123");
  const [roleMode, setRoleMode] = useState("OPERATOR");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (roleMode === "SUPERVISOR" ? "/supervisor/dashboard" : "/operator/dashboard");

  const handleRoleToggle = (mode) => {
    setRoleMode(mode);
    if (mode === "OPERATOR") {
      setEmail("karim@techstar.com");
    } else {
      setEmail("fahim@techstar.com");
    }
    setPassword("password123");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === "SUPERVISOR") {
        navigate("/supervisor/dashboard");
      } else {
        navigate("/operator/dashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-tech-blue/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header Branding */}
        <div className="bg-slate-950 p-6 text-white text-center border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-tech-blue text-white shadow-lg mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Tech<span className="text-amber-500">Star</span> Staff Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Authorized Login for Operators & Supervisors
          </p>

          {/* Role Toggle Selector */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleRoleToggle("OPERATOR")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                roleMode === "OPERATOR"
                  ? "bg-tech-blue text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck size={14} />
              Operator Login
            </button>
            <button
              type="button"
              onClick={() => handleRoleToggle("SUPERVISOR")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                roleMode === "SUPERVISOR"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck size={14} />
              Supervisor Login
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@techstar.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-tech-blue focus:bg-white focus:ring-2 focus:ring-tech-blue/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-tech-blue focus:bg-white focus:ring-2 focus:ring-tech-blue/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50 ${
              roleMode === "SUPERVISOR"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-tech-blue hover:bg-sky-600"
            }`}
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In as {roleMode === "SUPERVISOR" ? "Supervisor" : "Operator"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Quick Demo Credentials Info */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Demo Accounts Available:</p>
            <p>• Operator: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">karim@techstar.com</code> / <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">password123</code></p>
            <p>• Supervisor: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">fahim@techstar.com</code> / <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">password123</code></p>
          </div>
        </form>
      </div>
    </div>
  );
}
