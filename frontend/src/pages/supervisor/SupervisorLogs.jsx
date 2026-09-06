import { useEffect, useMemo, useState } from "react";
import { Calendar, Filter, RefreshCw, Search, ShieldAlert, Wifi } from "lucide-react";
import { supervisorApi } from "../../services/supervisor.api";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { connectOperatorSocket } from "../../sockets/serviceRequest.socket";

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
                    new Date(entry.created_at || Date.now()).getTime()
                ) < 1000)
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
        const matchesStatus = statusFilter === "ALL" || log.new_status === statusFilter;
        const actorName = log.changed_by_user?.name || log.changed_by || "";
        const noteText = log.note || "";
        const matchesQuery =
          `${log.service_request_id || ""} ${log.new_status || ""} ${actorName} ${noteText}`
            .toLowerCase()
            .includes(query.toLowerCase());

        let matchesDate = true;
        if (startDate) {
          matchesDate = matchesDate && new Date(log.created_at) >= new Date(startDate);
        }
        if (endDate) {
          matchesDate =
            matchesDate && new Date(log.created_at) <= new Date(`${endDate}T23:59:59`);
        }

        return matchesStatus && matchesQuery && matchesDate;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
    <div className="space-y-7">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-tech-blue">
            Audit Trail & History
          </p>
          <h1 className="mt-2 text-3xl font-bold">Activity logs</h1>
          <p className="mt-2 text-sm text-tech-muted">
            Chronological audit log with live WebSocket streaming and date-range filtering.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            onClick={load}
          >
            <RefreshCw size={14} />
            Refresh Logs
          </button>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs">
            <Wifi size={14} className="animate-pulse text-emerald-600" />
            Live Socket Stream
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-tech-line bg-white p-6 shadow-2xs space-y-5">
        {/* Date Range & Filter Bar */}
        <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-5">
          <div className="col-span-5 max-lg:col-span-12 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
            <input
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-tech-blue"
              placeholder="Search logs by request ID, actor, or note..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="col-span-7 max-lg:col-span-12 flex flex-wrap items-center justify-end gap-3 max-lg:justify-start">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Calendar size={15} className="text-slate-400" />
              <span>From:</span>
              <input
                type="date"
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-tech-blue"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>To:</span>
              <input
                type="date"
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-tech-blue"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Filter size={14} className="text-slate-400" />
              <select
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="REPAIRING">REPAIRING</option>
                <option value="WAITING_FOR_PARTS">WAITING_FOR_PARTS</option>
                <option value="READY_FOR_DELIVERY">READY_FOR_DELIVERY</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {(startDate || endDate || statusFilter !== "ALL" || query) && (
              <button
                className="text-xs font-bold text-tech-blue hover:underline cursor-pointer"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setStatusFilter("ALL");
                  setQuery("");
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Audit Log Entries List (Newest First) */}
        {filteredLogs.length ? (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log, index) => {
              const actor = log.changed_by_user;
              const actorName = actor?.name || "System / Operator";
              const actorRole = actor?.role || "";

              return (
                <div
                  className="grid grid-cols-[170px_1fr_220px] gap-4 py-4 text-sm max-md:grid-cols-1 hover:bg-slate-50/50 transition rounded-lg px-2"
                  key={log.id ? `${log.id}-${index}` : index}
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-tech-blue">
                      SR-{log.service_request_id}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-slate-900 font-semibold">
                        {log.new_status?.replaceAll("_", " ") || "Request Event"}
                      </strong>
                      {log.old_status && log.old_status !== log.new_status && (
                        <span className="text-[11px] rounded-md bg-slate-100 px-2 py-0.5 text-slate-500 font-medium">
                          From: {log.old_status.replaceAll("_", " ")}
                        </span>
                      )}
                      {log.new_progress !== null && log.new_progress !== undefined && (
                        <span className="text-[11px] rounded-md bg-sky-50 px-2 py-0.5 text-tech-blue font-bold">
                          Progress: {log.new_progress}%
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-tech-muted leading-relaxed">
                      {log.note || "No note recorded for this action."}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center max-md:items-start text-right max-md:text-left">
                    <span className="text-xs font-bold text-slate-900">{actorName}</span>
                    {actorRole && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-tech-blue">
                        {actorRole}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
