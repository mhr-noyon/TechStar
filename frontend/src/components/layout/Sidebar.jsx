import { NavLink, useNavigate } from "react-router-dom";
import { ClipboardList, LayoutDashboard, LogOut } from "lucide-react";

const links = [
  { to: "/operator", label: "Dashboard", icon: LayoutDashboard },
  { to: "/operator/requests", label: "Service requests", icon: ClipboardList },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("techstar.session");
    navigate("/login");
  };
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-tech-line bg-white p-6 max-md:w-[72px] max-md:items-center max-md:px-2.5">
      <div className="flex items-center gap-2.5 pb-9 text-[21px] font-extrabold tracking-tight max-md:justify-center">
        <span className="grid size-[29px] place-items-center rounded-lg bg-tech-blue text-white">
          T
        </span>
        <span className="max-md:hidden">
          Tech<span className="text-amber-600">Star</span>
        </span>
      </div>
      <div className="mb-2.5 w-full px-3 text-[10px] font-bold tracking-[1.2px] text-slate-400 max-md:hidden">
        OPERATIONS
      </div>
      <nav className="w-full">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            end={to === "/operator"}
            to={to}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${isActive ? "bg-tech-blue-soft text-tech-blue" : "text-slate-500 hover:bg-slate-50 hover:text-tech-blue"} max-md:justify-center max-md:px-2.5 max-md:text-[0px]`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto w-full border-t border-tech-line pt-5">
        <div className="flex items-center gap-2.5 px-3 max-md:justify-center max-md:px-0">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-tech-blue-soft text-[10px] font-extrabold text-tech-blue">
            OP
          </span>
          <div className="max-md:hidden">
            <strong className="block text-xs">Operator</strong>
            <small className="mt-0.5 block text-xs text-tech-muted">
              Operations desk
            </small>
          </div>
        </div>
        <button
          className="mt-5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 max-md:justify-center max-md:px-2.5 max-md:text-[0px]"
          type="button"
          onClick={logout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
