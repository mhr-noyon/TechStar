import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserCheck, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Dropdown from "../components/common/Dropdown";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("OPERATOR");
  const [email, setEmail] = useState("karim@techstar.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      const target = user.role === "SUPERVISOR" ? "/supervisor" : "/operator";
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "OPERATOR") {
      setEmail("karim@techstar.com");
    } else {
      setEmail("fahim@techstar.com");
    }
    setPassword("password123");
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const userObj = await login(email, password);
      const target = location.state?.from?.pathname || (userObj.role === "SUPERVISOR" ? "/supervisor" : "/operator");
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-slate-50 px-6 py-9 text-tech-ink">
      <div className="pointer-events-none absolute -right-44 -top-56 size-[480px] rounded-full border border-slate-200 opacity-80 after:absolute after:inset-9 after:rounded-full after:border after:border-slate-100" />
      <Link
        className="flex self-start items-center gap-2 text-[21px] font-extrabold tracking-tight"
        to="/"
      >
        <span className="grid size-[30px] place-items-center rounded-lg bg-tech-blue text-[10px] text-white">
          TS
        </span>
        TechStar
      </Link>
      <main className="mt-[75px] w-full max-w-[460px] max-sm:mt-14">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-tech-muted"
          to="/"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
        <section className="rounded-xl border border-tech-line bg-white p-9 shadow-xl shadow-slate-900/5 max-sm:p-6">
          <div className="mb-8">
            <span className="text-[11px] font-extrabold uppercase tracking-[1.3px] text-tech-blue">
              Staff workspace access
            </span>
            <h1 className="mt-3 text-[32px] font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-tech-muted">
              Sign in as an operator or supervisor to manage service operations.
            </p>
          </div>

          <form className="space-y-5" onSubmit={submit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs leading-5 font-semibold text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <Dropdown
              label="Workspace role"
              value={role}
              onChange={(event) => handleRoleChange(event.target.value)}
            >
              <option value="OPERATOR">Operator</option>
              <option value="SUPERVISOR">Supervisor</option>
            </Dropdown>

            <label className="block text-[13px] font-semibold text-slate-600">
              Email address
              <div className="mt-2 flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400 transition focus-within:border-tech-blue focus-within:ring-4 focus-within:ring-tech-blue-soft">
                <Mail size={17} />
                <input
                  className="w-full border-0 bg-transparent text-[13px] text-tech-ink outline-none"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@techstar.com"
                />
              </div>
            </label>

            <label className="block text-[13px] font-semibold text-slate-600">
              Password
              <div className="mt-2 flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400 transition focus-within:border-tech-blue focus-within:ring-4 focus-within:ring-tech-blue-soft">
                <LockKeyhole size={17} />
                <input
                  className="w-full border-0 bg-transparent text-[13px] text-tech-ink outline-none"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  className="grid place-items-center border-0 bg-transparent text-slate-400 cursor-pointer"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Quick Demo Login:</p>
              <p>• Operator: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900">karim@techstar.com</code></p>
              <p>• Supervisor: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900">fahim@techstar.com</code></p>
              <p>• Password: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900">password123</code></p>
            </div>

            <button
              className="flex h-11 w-full items-center justify-center rounded-lg border-0 bg-tech-blue text-sm font-bold text-white cursor-pointer hover:bg-sky-600 transition disabled:opacity-50"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : `Sign in as ${role === "OPERATOR" ? "Operator" : "Supervisor"}`}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-tech-muted">
            Customers do not need an account.{" "}
            <Link className="font-bold text-tech-blue" to="/track">
              Track a service request
            </Link>
          </p>
        </section>
      </main>
      <p className="mt-auto pt-12 text-xs text-slate-400">© 2026 TechStar</p>
    </div>
  );
}
