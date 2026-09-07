import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, RefreshCw, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { serviceRequestApi } from "../../services/serviceRequest.api";
import { connectOperatorSocket } from "../../sockets/serviceRequest.socket";
import RequestTable from "../../components/serviceRequest/RequestTable";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import SelectField from "../../components/common/SelectField";

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const load = () => {
    setLoading(true);
    serviceRequestApi
      .list({ sortBy, sortOrder, status, priority, search: query })
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
  }, [sortBy, sortOrder, status, priority]);

  const filtered = useMemo(
    () =>
      requests
        .filter((item) => {
          const haystack =
            `${item.id} ${item.customer?.name || ""} ${item.device_info} ${item.technician?.name || ""}`.toLowerCase();
          return (
            haystack.includes(query.toLowerCase()) &&
            (status === "ALL" || item.status === status) &&
            (priority === "ALL" || item.priority === priority)
          );
        })
        .sort((a, b) => {
          let valA = a[sortBy];
          let valB = b[sortBy];
          if (sortBy === "customer") {
            valA = a.customer?.name || "";
            valB = b.customer?.name || "";
          } else if (sortBy === "created_at" || sortBy === "updated_at") {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
          }
          if (valA < valB) return sortOrder === "asc" ? -1 : 1;
          if (valA > valB) return sortOrder === "asc" ? 1 : -1;
          return 0;
        }),
    [requests, query, status, priority, sortBy, sortOrder],
  );
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-tech-blue">Operations</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">Service requests</h1>
          <p className="mt-1 text-sm text-tech-muted">
            Track every repair from intake through delivery.
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
            Create request
          </Link>
        </div>
      </div>
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      <section className="rounded-2xl border border-tech-line bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-tech-line p-4 bg-slate-50/50">
          <label className="flex h-10 flex-1 min-w-[240px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 focus-within:border-tech-blue focus-within:ring-2 focus-within:ring-tech-blue/20 transition">
            <Search size={17} />
            <input
              className="w-full border-0 bg-transparent text-xs outline-none text-slate-800 placeholder-slate-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, customer, device..."
            />
          </label>
          <SelectField
            className="w-44"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            {[
              "RECEIVED",
              "ASSIGNED",
              "REPAIRING",
              "WAITING_FOR_PARTS",
              "READY_FOR_DELIVERY",
              "COMPLETED",
              "FAILED",
              "CANCELLED",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </SelectField>
          <SelectField
            className="w-36"
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="ALL">All priorities</option>
            <option>NORMAL</option>
            <option>HIGH</option>
            <option>URGENT</option>
          </SelectField>
          <SelectField
            className="w-44"
            aria-label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_at">Sort: Created Date</option>
            <option value="updated_at">Sort: Updated Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="progress">Sort: Progress</option>
          </SelectField>
          <SelectField
            className="w-36"
            aria-label="Sort direction"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </SelectField>
          <span className="ml-auto text-xs font-bold text-slate-500">{filtered.length} requests</span>
        </div>
        {loading ? (
          <Loading />
        ) : filtered.length ? (
          <RequestTable requests={filtered} />
        ) : (
          <EmptyState
            title="No matching requests"
            description="Try adjusting your search or filters."
          />
        )}
      </section>
    </>
  );
}
