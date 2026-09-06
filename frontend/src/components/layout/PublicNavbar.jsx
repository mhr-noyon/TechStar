import { Menu, X, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const dashboardPath = user?.role === "SUPERVISOR" ? "/supervisor" : "/operator";

  return (
    <header className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between px-7">
      <Link
        className="flex items-center gap-2.5 text-[21px] font-extrabold tracking-tight text-tech-ink"
        to="/"
      >
        <span className="grid size-[30px] place-items-center rounded-lg bg-tech-blue text-[10px] text-white">
          TS
        </span>
        TechStar
      </Link>
      <button
        className="hidden border-0 bg-transparent text-tech-ink max-sm:block cursor-pointer"
        type="button"
        aria-label="Toggle navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav
        className={`${open ? "flex" : "hidden"} absolute left-4 right-4 top-[66px] z-20 flex-col gap-1 rounded-lg border border-tech-line bg-white p-4 text-sm font-semibold text-tech-muted shadow-xl shadow-slate-900/10 sm:static sm:flex sm:flex-row sm:items-center sm:gap-7 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}
      >
        <a
          className="p-2 hover:text-tech-blue"
          href="/#services"
          onClick={() => setOpen(false)}
        >
          Services
        </a>
        <a
          className="p-2 hover:text-tech-blue"
          href="/#how-it-works"
          onClick={() => setOpen(false)}
        >
          How it works
        </a>
        {isAuthenticated ? (
          <Link
            className="inline-flex items-center gap-1.5 p-2 font-bold text-tech-blue hover:underline sm:ml-3"
            to={dashboardPath}
          >
            <LayoutDashboard size={16} />
            Go to Dashboard ({user?.role === "SUPERVISOR" ? "Supervisor" : "Operator"})
          </Link>
        ) : (
          <Link
            className="p-2 text-tech-ink hover:text-tech-blue sm:ml-3"
            to="/login"
          >
            Login
          </Link>
        )}
        <Link
          className="!text-white rounded-lg bg-tech-blue px-4 py-2.5 text-center shadow-md shadow-tech-blue/15"
          to="/track"
        >
          Track service
        </Link>
      </nav>
    </header>
  );
}
