import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-tech-ink">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Navbar />
        <main className="mx-auto max-w-[1480px] p-[34px] max-sm:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
