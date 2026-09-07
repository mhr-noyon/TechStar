import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ClipboardCheck,
  Clock3,
  PackageCheck,
  Plus,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { serviceRequestApi } from "../../services/serviceRequest.api";
import { connectOperatorSocket } from "../../sockets/serviceRequest.socket";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/serviceRequest/StatusBadge";

const statuses = [
  "RECEIVED",
  "ASSIGNED",
  "REPAIRING",
  "WAITING_FOR_PARTS",
  "READY_FOR_DELIVERY",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(value),
      )
    : "-";

export default function OperatorDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    serviceRequestApi
      .list()
      .then(setRequests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    const timer = setTimeout(load, 0);
    const cleanup = connectOperatorSocket({
      "serviceRequest:created": ({ serviceRequest }) =>
        setRequests((current) => [serviceRequest, ...current]),
      "serviceRequest:assigned": ({ serviceRequest }) =>
        setRequests((current) =>
          current.map((item) =>
            item.id === serviceRequest.id ? serviceRequest : item,
          ),
        ),
      "serviceRequest:statusUpdated": ({ serviceRequest }) =>
        setRequests((current) =>
          current.map((item) =>
            item.id === serviceRequest.id ? serviceRequest : item,
          ),
        ),
    });
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        statuses.map((status) => [
          status,
          requests.filter((item) => item.status === status).length,
        ]),
      ),
    [requests],
  );
  const cards = [
    {
      label: "Total requests",
      value: requests.length,
      icon: ClipboardCheck,
      tone: "blue",
    },
    {
      label: "Needs attention",
      value: counts.RECEIVED || 0,
      icon: Clock3,
      tone: "amber",
    },
    {
      label: "In repair",
      value: counts.REPAIRING || 0,
      icon: Wrench,
      tone: "teal",
    },
    {
      label: "Completed",
      value: counts.COMPLETED || 0,
      icon: PackageCheck,
      tone: "green",
    },
  ];
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-tech-blue">Operator workspace</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">Good morning</h1>
          <p className="mt-1 text-sm text-tech-muted">
            Here is what is happening across your repair operation today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
            onClick={load}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link
            className="flex items-center gap-2 rounded-xl bg-tech-blue px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-sky-700 transition"
            to="/operator/requests/new"
          >
            <Plus size={17} />
            New request
          </Link>
        </div>
      </div>
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      {loading ? (
        <Loading label="Loading dashboard..." />
      ) : (
        <>
          <section className="mb-8 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
            {cards.map(({ label, value, icon: Icon, tone }) => {
              const toneStyles = {
                blue: "bg-sky-50 text-tech-blue",
                amber: "bg-amber-50 text-amber-600",
                teal: "bg-teal-50 text-teal-600",
                green: "bg-emerald-50 text-emerald-600",
              }[tone];
              return (
                <div className="relative flex items-center gap-4 rounded-2xl border border-tech-line bg-white p-5 shadow-2xs transition hover:shadow-md" key={label}>
                  <div className={`grid size-12 shrink-0 place-items-center rounded-xl ${toneStyles}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
                    <strong className="block text-2xl font-black text-slate-900">{value}</strong>
                  </div>
                  <ArrowUpRight className="absolute right-4 top-4 text-slate-300" size={17} />
                </div>
              );
            })}
          </section>
          <section className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
            <div className="col-span-2 rounded-2xl border border-tech-line bg-white p-6 shadow-2xs max-lg:col-span-1">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Recent service requests</h2>
                  <p className="text-xs text-tech-muted">Latest activity from the repair queue</p>
                </div>
                <Link className="flex items-center gap-1 text-xs font-bold text-tech-blue hover:underline" to="/operator/requests">
                  View all <ArrowUpRight size={15} />
                </Link>
              </div>
              {requests.length ? (
                <div className="divide-y divide-slate-100">
                  {requests.slice(0, 6).map((item) => (
                    <Link
                      className="flex items-center justify-between py-3.5 px-2 rounded-xl transition hover:bg-slate-50"
                      to={`/operator/requests/${item.id}`}
                      key={item.id}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-lg bg-sky-50 text-xs font-bold text-tech-blue">SR</span>
                        <div>
                          <strong className="block text-sm font-bold text-slate-900">SR-{item.id}</strong>
                          <span className="text-xs text-slate-500">{item.device_info}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={item.status} />
                        <small className="text-xs text-slate-400 font-medium">{date(item.created_at)}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No service requests"
                  description="Create the first request to start the queue."
                />
              )}
            </div>
            <div className="rounded-2xl border border-tech-line bg-white p-6 shadow-2xs space-y-4">
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-lg font-extrabold text-slate-900">Queue overview</h2>
                <p className="text-xs text-tech-muted">Requests by current status</p>
              </div>
              {statuses.map((status) => {
                const pct = requests.length ? ((counts[status] || 0) / requests.length) * 100 : 0;
                return (
                  <div className="space-y-1" key={status}>
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{status.replaceAll("_", " ")}</span>
                      <strong className="text-slate-900">{counts[status] || 0}</strong>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-tech-blue rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </>
  );
}
