import { statusLabels } from './statusLabels';

const statusStyles = {
  RECEIVED: "bg-sky-50 text-sky-700 border-sky-200",
  ASSIGNED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  REPAIRING: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_FOR_PARTS: "bg-purple-50 text-purple-700 border-purple-200",
  READY_FOR_DELIVERY: "bg-teal-50 text-teal-700 border-teal-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function StatusBadge({ status }) {
  const badgeStyle = statusStyles[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase ${badgeStyle}`}
    >
      {statusLabels[status] || status || "Unassigned"}
    </span>
  );
}
