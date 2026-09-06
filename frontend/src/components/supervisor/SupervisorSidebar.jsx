import {
  BarChart3,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  TrendingUp,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const links = [
  ["/supervisor", "Dashboard", LayoutDashboard],
  ["/supervisor/service-requests", "Service requests", ClipboardList],
  ["/supervisor/customers", "Customers", Users],
  ["/supervisor/operators", "Operators", Users],
  ["/supervisor/technicians", "Technicians", Wrench],
  ["/supervisor/logs", "Logs", FileClock],
  ["/supervisor/chat", "Group Chat", MessageSquare],
];


export default function SupervisorSidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onClose) onClose();
    navigate("/login");
  };

  const sidebarContent = (
    <>
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-tech-blue text-xs text-white">
            TS
          </span>
          <span>
            Tech<span className="text-amber-600">Star</span>
          </span>
        </div>
        {onClose && (
          <button
            className="lg:hidden grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <span className="mb-3 px-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
        Management
      </span>

      <nav className="w-full space-y-1">
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            end={to === "/supervisor"}
            to={to}
            onClick={() => onClose && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${
                isActive
                  ? "bg-tech-blue-soft text-tech-blue font-bold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-tech-blue"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        className="mt-auto flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer transition"
        type="button"
        onClick={handleLogout}
      >
        <LogOut size={18} />
        Logout
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-tech-line bg-white p-5 sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>


      {/* Mobile drawer overlay & sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <div className="relative z-50 flex w-72 max-w-[80vw] flex-col bg-white p-5 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
