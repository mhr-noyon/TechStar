import { Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePeriod } from "../../context/PeriodContext";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "../common/NotificationDropdown";

export default function Navbar({ onOpenSidebar }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { period, setPeriod } = usePeriod();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "TS";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-tech-line bg-white px-8 max-sm:px-4 sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-3">
        {onOpenSidebar && (
          <button
            className="md:hidden grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="text-[17px] font-extrabold md:hidden">
          Tech<span className="text-amber-600">Star</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Notification Dropdown */}
        <NotificationDropdown />

        {/* Dynamic Logged-In User Profile */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pr-3 hover:bg-slate-100 transition cursor-pointer"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-tech-blue font-extrabold text-[11px] text-white shadow-sm">
              {getInitials(user?.name)}
            </span>
            <div className="text-left max-sm:hidden">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || "Staff User"}
              </div>
              <div className="text-[10px] font-semibold text-tech-blue">
                {user?.role === "SUPERVISOR" ? "Supervisor" : "Operator"}
              </div>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
