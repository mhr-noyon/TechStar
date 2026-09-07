import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ClipboardList, Filter, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { supervisorApi } from "../../services/supervisor.api";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/serviceRequest/StatusBadge";
import Dropdown from "../../components/common/Dropdown";
import { connectOperatorSocket } from "../../sockets/serviceRequest.socket";

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

const priorityWeight = { URGENT: 3, HIGH: 2, NORMAL: 1 };

export default function SupervisorServiceRequests() {
  const [requests, setRequests] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [error, setError] = useState("");

  const load = () => {
    supervisorApi
      .requests()
      .then(setRequests)
      .catch((requestError) => setError(requestError.message));
  };

  useEffect(() => {
    load();
    return connectOperatorSocket({
      "serviceRequest:created": load,
      "serviceRequest:assigned": load,
      "serviceRequest:statusUpdated": load,
    });
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Status distribution counts
  const statusCounts = useMemo(() => {
    if (!requests) return {};
    return Object.fromEntries(
      statuses.map((s) => [s, requests.filter((r) => r.status === s).length]),
    );
  }, [requests]);

  // Filtered & Sorted Requests
  const processedRequests = useMemo(() => {
    if (!requests) return [];

    return requests
      .filter((item) => {
        const matchesQuery = `${item.id} ${item.customer?.name || ""} ${item.device_info} ${item.status}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
        const matchesPriority = priorityFilter === "ALL" || item.priority === priorityFilter;
        return matchesQuery && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === "customer") {
          valA = a.customer?.name || "";
          valB = b.customer?.name || "";
        } else if (sortBy === "priority") {
          valA = priorityWeight[a.priority] || 0;
          valB = priorityWeight[b.priority] || 0;
        } else if (sortBy === "created_at" || sortBy === "updated_at" || sortBy === "expected_delivery_at") {
          valA = valA ? new Date(valA).getTime() : 0;
          valB = valB ? new Date(valB).getTime() : 0;
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [requests, query, statusFilter, priorityFilter, sortBy, sortOrder]);

  if (error)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );

  if (!requests) return <Loading label="Loading service requests..." />;

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="text-tech-blue" />
    ) : (
      <ArrowDown size={14} className="text-tech-blue" />
    );
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-tech-blue">
          Service operations
        </p>
        <h1 className="mt-2 text-3xl font-bold">All service requests</h1>
        <p className="mt-2 text-sm text-tech-muted">
          Monitor, filter, and sort every request across your repair operation.
        </p>
      </div>

      {/* Request Status Distribution Section (Moved from Dashboard) */}
      <section className="rounded-xl border border-tech-line bg-white p-6 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Request status distribution</h2>
            <p className="mt-0.5 text-xs text-tech-muted">
              Current operational queue by status
            </p>
          </div>
          <ClipboardList className="text-slate-300" size={20} />
        </div>

        <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
          {statuses.map((st) => {
            const count = statusCounts[st] || 0;
            const pct = requests.length ? Math.round((count / requests.length) * 100) : 0;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(statusFilter === st ? "ALL" : st)}
                className={`flex flex-col justify-between rounded-lg p-3 border text-left transition cursor-pointer ${
                  statusFilter === st
                    ? "border-tech-blue bg-tech-blue-soft/50 ring-2 ring-tech-blue/20"
                    : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">
                    {st.replaceAll("_", " ")}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-tech-blue rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters & Table Section */}
      <section className="overflow-hidden rounded-xl border border-tech-line bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-tech-line p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
            <input
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-tech-blue"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, customer, device..."
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter size={15} />
              <span>Status:</span>
              <div className="w-44">
                <Dropdown
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </Dropdown>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span>Priority:</span>
              <div className="w-36">
                <Dropdown
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </Dropdown>
              </div>
            </div>

            {(statusFilter !== "ALL" || priorityFilter !== "ALL" || query) && (
              <button
                className="text-xs text-tech-blue font-bold hover:underline cursor-pointer"
                onClick={() => {
                  setStatusFilter("ALL");
                  setPriorityFilter("ALL");
                  setQuery("");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {processedRequests.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {[
                    ["id", "ID"],
                    ["customer", "Customer"],
                    ["device_info", "Device"],
                    ["priority", "Priority"],
                    ["status", "Status"],
                    ["technician", "Technician"],
                    ["progress", "Progress"],
                    ["expected_delivery_at", "Expected delivery"],
                    ["created_at", "Created"],
                  ].map(([field, label]) => (
                    <th
                      className="px-4 py-3 min-w-[80px] cursor-pointer select-none hover:bg-slate-100 transition"
                      key={field}
                      onClick={() => handleSort(field)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{label}</span>
                        <SortIcon field={field} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedRequests.map((request) => (
                  <tr className="border-t border-slate-100 hover:bg-slate-50/50" key={request.id}>
                    <td className="px-4 py-4 font-bold text-tech-blue">
                      <Link to={`/supervisor/service-requests/${request.id}`}>
                        SR-{request.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {request.customer?.name || "Unavailable"}
                    </td>
                    <td className="max-w-48 truncate px-4 py-4 text-slate-600">
                      {request.device_info}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`priority priority-${request.priority.toLowerCase()}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {request.technician?.name || "Unassigned"}
                    </td>
                    <td className="px-4 py-4 font-bold">{request.progress}%</td>
                    <td className="px-4 py-4 text-tech-muted">
                      {request.expected_delivery_at
                        ? new Date(request.expected_delivery_at).toLocaleDateString()
                        : "Not set"}
                    </td>
                    <td className="px-4 py-4 text-tech-muted">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No requests found"
            description="No requests match your current filters or search terms."
          />
        )}
      </section>
    </div>
  );
}
