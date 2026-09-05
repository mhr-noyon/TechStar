import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import Dropdown from "../components/common/Dropdown";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("OPERATOR");
  const [submitted, setSubmitted] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    setSubmitted(true);
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
            <Dropdown
              label="Workspace role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
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
                  placeholder="Enter your password"
                />
                <button
                  className="grid place-items-center border-0 bg-transparent text-slate-400"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 text-tech-muted">
                <input className="accent-tech-blue" type="checkbox" />
                Remember me
              </label>
              <button
                type="button"
                className="border-0 bg-transparent text-tech-blue"
              >
                Forgot password?
              </button>
            </div>
            {submitted && (
              <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Staff authentication is not connected yet. This form is ready
                for the authentication integration.
              </p>
            )}
            <button
              className="flex h-11 w-full items-center justify-center rounded-lg border-0 bg-tech-blue text-sm font-bold text-white"
              type="submit"
            >
              Sign in as {role === "OPERATOR" ? "operator" : "supervisor"}
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
