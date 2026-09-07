import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Calendar,
  Clock3,
  DollarSign,
  FileText,
  Filter,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Truck,
  UserCheck,
  Wifi,
  Wrench,
} from "lucide-react";
import { supervisorApi } from "../../services/supervisor.api";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import Dropdown from "../../components/common/Dropdown";
import { useAuth } from "../../context/AuthContext";
import { connectOperatorSocket } from "../../sockets/serviceRequest.socket";

const getLogIconConfig = (status, note = "") => {
  const n = (note || "").toLowerCase();
  if (n.includes("payment")) {
    return {
      Icon: DollarSign,
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }
  if (n.includes("assigned")) {
    return {
      Icon: UserCheck,
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
  }
  switch (status) {
    case "RECEIVED":
      return {
        Icon: PlusCircle,
        color: "bg-sky-100 text-sky-700 border-sky-200",
      };
    case "ASSIGNED":
      return {
        Icon: UserCheck,
        color: "bg-indigo-100 text-indigo-700 border-indigo-200",
      };
    case "REPAIRING":
      return {
        Icon: Wrench,
        color: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "WAITING_FOR_PARTS":
      return {
        Icon: Clock3,
        color: "bg-orange-100 text-orange-700 border-orange-200",
      };
    case "READY_FOR_DELIVERY":
      return {
        Icon: Truck,
        color: "bg-teal-100 text-teal-700 border-teal-200",
      };
    case "COMPLETED":
      return {
        Icon: PackageCheck,
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case "FAILED":
      return {
        Icon: AlertTriangle,
        color: "bg-rose-100 text-rose-700 border-rose-200",
      };
    case "CANCELLED":
      return {
        Icon: Ban,
        color: "bg-slate-100 text-slate-600 border-slate-200",
      };
    default:
      return {
        Icon: FileText,
        color: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
};

export default function SupervisorLogs() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { user } = useAuth();

  const load = () => {
    supervisorApi
      .overview()
      .then((data) => setLogs(data.logs || []))
      .catch((requestError) => setError(requestError.message));
  };

  useEffect(() => {
    load();
    const handleIncomingHistory = (payload) => {
      const entry = payload?.history || payload;
      if (!entry || (!entry.id && !entry.service_request_id)) return;

      setLogs((currentLogs) => {
        if (!currentLogs) return [entry];
        // Only reject if exact same ID exists, or if duplicate payload received within 1 second
        if (
          currentLogs.some(
            (item) =>
              (item.id && entry.id && item.id === entry.id) ||
              (item.service_request_id === entry.service_request_id &&
                item.new_status === entry.new_status &&
                item.new_progress === entry.new_progress &&
                item.note === entry.note &&
                Math.abs(
                  new Date(item.created_at || Date.now()).getTime() -
                    new Date(entry.created_at || Date.now()).getTime(),
                ) < 1000),
          )
        ) {
          return currentLogs;
        }
        return [entry, ...currentLogs];
      });
    };

    return connectOperatorSocket(
      {
        "serviceRequest:historyCreated": handleIncomingHistory,
      },
      "supervisors",
      user,
    );
  }, [user]);

  // Filtered logs ordered descending chronologically (newest first)
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    return logs
      .filter((log) => {
        const matchesStatus =
          statusFilter === "ALL" || log.new_status === statusFilter;
        const actorName = log.changed_by_user?.name || log.changed_by || "";
        const noteText = log.note || "";
        const matchesQuery =
          `${log.service_request_id || ""} ${log.new_status || ""} ${actorName} ${noteText}`
            .toLowerCase()
            .includes(query.toLowerCase());

        let matchesDate = true;
        if (startDate) {
          matchesDate =
            matchesDate && new Date(log.created_at) >= new Date(startDate);
        }
        if (endDate) {
          matchesDate =
            matchesDate &&
            new Date(log.created_at) <= new Date(`${endDate}T23:59:59`);
        }

        return matchesStatus && matchesQuery && matchesDate;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      );
  }, [logs, query, statusFilter, startDate, endDate]);

  if (error)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 flex items-center gap-3">
        <ShieldAlert size={20} />
        <span>{error}</span>
      </div>
    );

  if (!logs) return <Loading label="Loading live activity logs..." />;

  return (
    <div className="space-y-6">
      {/* Page Heading Header */}
      <div className="flex items-end justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-tech-blue">
            Audit Trail & History
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Activity logs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-tech-muted">
            Chronological audit log with live WebSocket streaming and date-range
            filtering.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            onClick={load}
          >
            <RefreshCw size={14} />
            Refresh Logs
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-2xs">
            <Wifi size={14} className="animate-pulse text-emerald-600" />
            Live Socket Stream
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-tech-line bg-white p-4 sm:p-6 shadow-2xs space-y-4">
        {/* Search & Filter Controls */}
        <div className="space-y-3 border-b border-slate-100 pb-4">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-3 text-slate-400"
              size={17}
            />
            <input
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-xs font-medium outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition"
              placeholder="Search logs by request ID, actor, or note..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Calendar size={15} className="text-slate-400" />
                <span>From:</span>
                <input
                  type="date"
                  className="h-9 rounded-xl border border-slate-200 px-2.5 text-xs font-medium outline-none focus:border-tech-blue"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span>To:</span>
                <input
                  type="date"
                  className="h-9 rounded-xl border border-slate-200 px-2.5 text-xs font-medium outline-none focus:border-tech-blue"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Filter size={14} className="text-slate-400" />
                <div className="w-44">
                  <Dropdown
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="REPAIRING">REPAIRING</option>
                    <option value="WAITING_FOR_PARTS">
                      WAITING_FOR_PARTS
                    </option>
                    <option value="READY_FOR_DELIVERY">
                      READY_FOR_DELIVERY
                    </option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </Dropdown>
                </div>
              </div>

              {(startDate ||
                endDate ||
                statusFilter !== "ALL" ||
                query) && (
                <button
                  className="text-xs font-bold text-tech-blue hover:underline cursor-pointer"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setStatusFilter("ALL");
                    setQuery("");
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Swipe Hint for Mobile View */}
        <div className="block sm:hidden text-[11px] font-bold text-slate-400 tracking-wide text-right">
          ← Scroll horizontally to view details →
        </div>

        {/* Horizontal Slider / Compact Table Container */}
        {filteredLogs.length ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[760px] divide-y divide-slate-100">
              {/* Header Columns */}
              <div className="grid grid-cols-[80px_160px_200px_100px_100px] md:grid-cols-[140px_180px_1fr_150px_140px] gap-1 md:gap-3 px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/80 rounded-lg mb-1">
                <div>Request</div>
                <div>Action / Status</div>
                <div>Note</div>
                <div>Actor</div>
                <div className="text-right">Timestamp</div>
              </div>

              {/* Rows with Divider Line */}
              {filteredLogs.map((log, index) => {
                const actor = log.changed_by_user;
                const actorName = actor?.name || "System / Operator";
                const actorRole = actor?.role || "";
                const { Icon, color } = getLogIconConfig(
                  log.new_status,
                  log.note,
                );

                return (
                  <div
                    key={log.id ? `${log.id}-${index}` : index}
                    className="grid grid-cols-[80px_120px_200px_120px_120px] md:grid-cols-[140px_180px_1fr_150px_140px] gap-3 px-3 py-2.5 items-center text-xs hover:bg-slate-50 transition-colors border-b border-slate-100/80 last:border-b-0"
                  >
                    {/* Column 1: Icon + Request ID */}
                    <div className="flex items-center gap-1 md:gap-2 min-w-0">
                      <div
                        className={`grid size-7 shrink-0 place-items-center rounded-lg border ${color}`}
                      >
                        <Icon size={14} />
                      </div>
                      <span className="font-mono text-xs font-extrabold text-tech-blue truncate">
                        SR-{log.service_request_id}
                      </span>
                    </div>

                    {/* Column 2: Action / Status Badge + Progress */}
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="font-extrabold text-slate-900 truncate">
                        {log.new_status?.replaceAll("_", " ") || "Event"}
                      </span>
                      {log.new_progress !== null &&
                        log.new_progress !== undefined && (
                          <span className="text-[10px] rounded-md bg-sky-50 px-1.5 py-0.2 text-tech-blue font-extrabold border border-sky-100">
                            {log.new_progress}%
                          </span>
                        )}
                    </div>

                    {/* Column 3: Note */}
                    <div className="text-slate-600 font-medium truncate pr-2" title={log.note || ""}>
                      {log.note || "No note recorded."}
                    </div>

                    {/* Column 4: Actor Name & Role */}
                    <div className="min-w-0 truncate">
                      <span className="font-bold text-slate-800 block truncate">
                        {actorName}
                      </span>
                      {actorRole && (
                        <span className="text-[9px] font-extrabold uppercase tracking-wide text-tech-blue">
                          {actorRole}
                        </span>
                      )}
                    </div>

                    {/* Column 5: Timestamp */}
                    <div className="text-right text-[11px] text-slate-400 font-medium whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No activity logs found"
            description="No activity logs match your selected date range or filter criteria."
          />
        )}
      </section>
    </div>
  );
}
