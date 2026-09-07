import { NavLink, useNavigate } from "react-router-dom";
import { ClipboardList, LayoutDashboard, LogOut, X, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/operator", label: "Dashboard", icon: LayoutDashboard },
  { to: "/operator/requests", label: "Service requests", icon: ClipboardList },
  { to: "/operator/chat", label: "Group Chat", icon: MessageSquare },
];

export default function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    if (onClose) onClose();
    navigate("/login");
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between pb-8">
        <div className="flex items-center gap-2.5 text-[21px] font-extrabold tracking-tight">
          <span className="grid size-[29px] place-items-center rounded-lg bg-tech-blue text-white">
            TS
          </span>
          <span>
            Tech<span className="text-amber-600">Star</span>
          </span>
        </div>
        {onClose && (
          <button
            className="md:hidden grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="mb-2.5 w-full px-3 text-[10px] font-bold tracking-[1.2px] text-slate-400">
        OPERATIONS
      </div>

      <nav className="w-full space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            end={to === "/operator"}
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

      <div className="mt-auto w-full border-t border-tech-line pt-5">
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-tech-line bg-white p-6 sticky top-0 h-screen overflow-y-auto print:hidden">
        {sidebarContent}
      </aside>


      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-50 flex w-72 max-w-[80vw] flex-col bg-white p-6 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
