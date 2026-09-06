import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Filter,
  Users,
} from "lucide-react";
import { supervisorApi } from "../../services/supervisor.api";
import { connectOperatorSocket } from "../../sockets/serviceRequest.socket";
import Loading from "../../components/common/Loading";

export default function SupervisorDashboard() {
  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("MONTHLY"); // YEARLY | MONTHLY | WEEKLY | DAILY | CUSTOM
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const load = async () => {
    try {
      setRawData(await supervisorApi.overview());
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    const cleanup = connectOperatorSocket({
      "serviceRequest:created": load,
      "serviceRequest:assigned": load,
      "serviceRequest:statusUpdated": load,
    });
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  // Filter requests based on selected period
  const filteredRequests = useMemo(() => {
    if (!rawData?.requests) return [];
    const now = new Date();
    const requests = rawData.requests;

    if (period === "DAILY") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return requests.filter((r) => new Date(r.created_at) >= startOfDay);
    }
    if (period === "WEEKLY") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return requests.filter((r) => new Date(r.created_at) >= sevenDaysAgo);
    }
    if (period === "MONTHLY") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return requests.filter((r) => new Date(r.created_at) >= thirtyDaysAgo);
    }
    if (period === "YEARLY") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return requests.filter((r) => new Date(r.created_at) >= startOfYear);
    }
    if (period === "CUSTOM") {
      if (!customStart && !customEnd) return requests;
      const start = customStart ? new Date(customStart) : new Date(0);
      const end = customEnd ? new Date(`${customEnd}T23:59:59`) : new Date();
      return requests.filter((r) => {
        const d = new Date(r.created_at);
        return d >= start && d <= end;
      });
    }
    return requests;
  }, [rawData, period, customStart, customEnd]);

  // Compute metrics based on filtered requests
  const metrics = useMemo(() => {
    if (!rawData) return null;
    const reqs = filteredRequests;
    const terminalStatuses = ["COMPLETED", "FAILED", "CANCELLED"];

    const totalRequests = reqs.length;
    const activeRepairs = reqs.filter((r) => !terminalStatuses.includes(r.status)).length;
    const completed = reqs.filter((r) => r.status === "COMPLETED").length;
    const overdue = reqs.filter(
      (r) =>
        r.expected_delivery_at &&
        new Date(r.expected_delivery_at) < new Date() &&
        !["COMPLETED", "CANCELLED"].includes(r.status),
    ).length;

    const totalRevenue = reqs.reduce((sum, r) => sum + Number(r.payment_amount || 0), 0);

    // Revenue by Status
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

    const revenueByStatus = statuses.map((status) => ({
      status,
      count: reqs.filter((r) => r.status === status).length,
      revenue: reqs
        .filter((r) => r.status === status)
        .reduce((sum, r) => sum + Number(r.payment_amount || 0), 0),
    }));

    // Priority Distribution
    const priorities = ["NORMAL", "HIGH", "URGENT"];
    const priorityCounts = priorities.map((p) => ({
      priority: p,
      count: reqs.filter((r) => r.priority === p).length,
    }));

    return {
      totalRequests,
      activeRepairs,
      completed,
      overdue,
      totalRevenue,
      averageValue: completed ? totalRevenue / completed : 0,
      revenueByStatus,
      priorityCounts,
    };
  }, [rawData, filteredRequests]);

  if (error)
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
        <button
          className="rounded-lg bg-tech-blue px-4 py-2 text-sm font-bold text-white cursor-pointer"
          onClick={load}
        >
          Retry
        </button>
      </div>
    );

  if (!rawData || !metrics) return <Loading label="Loading operations dashboard..." />;

  // Dynamic Chart Labels & Groups
  const maxRevenueStatus = Math.max(...metrics.revenueByStatus.map((s) => s.revenue), 1);
  const totalPriorityCount = Math.max(metrics.priorityCounts.reduce((s, p) => s + p.count, 0), 1);

  return (
    <div className="space-y-7">
      {/* Header & Reporting Period Filter */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-tech-blue">
            Executive Overview & Intelligence
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Operations & Financial Dashboard
          </h1>
          <p className="mt-1 text-sm text-tech-muted">
            Live metrics, financial analytics, and interactive period performance insights.
          </p>
        </div>

        {/* Reporting Period Selector */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-tech-line bg-white p-2 shadow-2xs">
          <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-500">
            <Filter size={15} />
            <span>Period:</span>
          </div>

          {["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"].map((p) => (
            <button
              key={p}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                period === p
                  ? "bg-tech-blue text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {period === "CUSTOM" && (
        <div className="flex items-center gap-4 rounded-xl border border-sky-200 bg-sky-50 p-4 max-sm:flex-col max-sm:items-stretch">
          <div className="flex items-center gap-2 text-xs font-bold text-tech-blue">
            <Calendar size={16} />
            <span>Custom Date Range:</span>
          </div>
          <div className="flex items-center gap-3 flex-1 max-sm:flex-col">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              From:
              <input
                type="date"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-tech-blue"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              To:
              <input
                type="date"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-tech-blue"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      {/* Section 1: Live Operational Metrics Cards */}
      <section className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {[
          [
            ClipboardList,
            "Total Requests",
            metrics.totalRequests,
            "text-tech-blue",
            "bg-tech-blue-soft",
          ],
          [
            Activity,
            "Active Repairs",
            metrics.activeRepairs,
            "text-amber-700",
            "bg-amber-50",
          ],
          [
            CheckCircle2,
            "Completed",
            metrics.completed,
            "text-green-700",
            "bg-green-50",
          ],
          [
            AlertTriangle,
            "Overdue",
            metrics.overdue,
            "text-red-700",
            "bg-red-50",
          ],
        ].map(([Icon, label, value, text, bg]) => (
          <div
            className="rounded-xl border border-tech-line bg-white p-5 shadow-2xs flex items-center justify-between"
            key={label}
          >
            <div>
              <p className="text-xs font-semibold text-tech-muted">{label}</p>
              <strong className="mt-2 block text-3xl font-extrabold text-slate-900">
                {value}
              </strong>
            </div>
            <div
              className={`grid size-12 place-items-center rounded-xl ${bg} ${text}`}
            >
              <Icon size={22} />
            </div>
          </div>
        ))}
      </section>

      {/* Section 2: High-Level Stat Cards (Customers, Operators, Revenue) */}
      <section className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <div className="rounded-xl border border-tech-line bg-white p-5 shadow-2xs flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-blue-50 text-tech-blue">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-tech-muted">Total Customers</p>
            <strong className="text-2xl font-bold text-slate-900">
              {rawData.customers?.length || 0}
            </strong>
          </div>
        </div>

        <div className="rounded-xl border border-tech-line bg-white p-5 shadow-2xs flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-purple-50 text-purple-700">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-tech-muted">Active Operators</p>
            <strong className="text-2xl font-bold text-slate-900">
              {rawData.operators?.length || 0}
            </strong>
          </div>
        </div>

        <div className="rounded-xl border border-tech-line bg-white p-5 shadow-2xs flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-tech-muted">
              Period Revenue ({period.toLowerCase()})
            </p>
            <strong className="text-2xl font-bold text-emerald-700">
              ৳ {metrics.totalRevenue.toLocaleString("en-BD")}
            </strong>
            <span className="block text-[11px] text-tech-muted mt-0.5">
              Avg service value: ৳{" "}
              {Math.round(metrics.averageValue).toLocaleString("en-BD")}
            </span>
          </div>
        </div>
      </section>

      {/* Section 3: Interactive Status Donut Chart & Priority Breakdown */}
      <section className="grid grid-cols-12 gap-5">
        {/* SVG Donut Chart for Service Request Status */}
        <div className="col-span-8 max-xl:col-span-12 rounded-xl border border-tech-line bg-white p-6 shadow-2xs">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Service Request Status Distribution
              </h2>
              <p className="mt-0.5 text-xs text-tech-muted">
                Percentage breakdown of all service requests across pipeline statuses.
              </p>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {metrics.totalRequests} total requests
            </span>
          </div>

          {(() => {
            const statusConfig = [
              { status: "RECEIVED", label: "Received", color: "#3B82F6" }, // Blue
              { status: "ASSIGNED", label: "Assigned", color: "#8B5CF6" }, // Purple
              { status: "REPAIRING", label: "Repairing", color: "#F59E0B" }, // Amber
              { status: "WAITING_FOR_PARTS", label: "Waiting for Parts", color: "#EC4899" }, // Pink
              { status: "READY_FOR_DELIVERY", label: "Ready for Delivery", color: "#06B6D4" }, // Cyan
              { status: "COMPLETED", label: "Completed", color: "#10B981" }, // Emerald Green
              { status: "FAILED", label: "Failed", color: "#EF4444" }, // Red
              { status: "CANCELLED", label: "Cancelled", color: "#64748B" }, // Slate
            ];

            const total = metrics.totalRequests;

            // Calculate raw counts and percentages ensuring sum equals 100%
            let items = statusConfig.map((cfg) => {
              const count = filteredRequests.filter((r) => r.status === cfg.status).length;
              const rawPct = total > 0 ? (count / total) * 100 : 0;
              return {
                ...cfg,
                count,
                rawPct,
                pct: Math.round(rawPct),
              };
            });

            // Adjust percentage rounding to ensure sum is exactly 100% if total > 0
            if (total > 0) {
              const currentSum = items.reduce((sum, item) => sum + item.pct, 0);
              const diff = 100 - currentSum;
              if (diff !== 0) {
                // Adjust segment with largest non-zero count
                const maxItem = [...items].sort((a, b) => b.count - a.count)[0];
                if (maxItem && maxItem.count > 0) {
                  maxItem.pct += diff;
                }
              }
            }

            // Build SVG Donut stroke segments
            let cumulativePercent = 0;
            const segments = items.map((item) => {
              const startPercent = cumulativePercent;
              cumulativePercent += item.rawPct;
              return {
                ...item,
                startPercent,
                endPercent: cumulativePercent,
              };
            });

            return (
              <div className="grid grid-cols-12 gap-6 items-center">
                {/* SVG Donut */}
                <div className="col-span-5 max-md:col-span-12 flex justify-center py-2">
                  <div className="relative size-56 sm:size-64">
                    <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                      {/* Background Ring when total is 0 */}
                      {total === 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#E2E8F0"
                          strokeWidth="14"
                        />
                      )}
                      {total > 0 &&
                        segments.map((seg) => {
                          if (seg.count === 0) return null;
                          const strokeDasharray = `${seg.rawPct} ${100 - seg.rawPct}`;
                          const strokeDashoffset = -seg.startPercent;

                          return (
                            <circle
                              key={seg.status}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke={seg.color}
                              strokeWidth="14"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              pathLength="100"
                              className="transition-all duration-500 hover:opacity-90"
                            />
                          );
                        })}
                    </svg>

                    {/* Donut Center Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {total}
                      </span>
                      <span className="text-[11px] font-bold text-tech-muted uppercase tracking-wider mt-0.5">
                        Total Requests
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Segment Legend */}
                <div className="col-span-7 max-md:col-span-12 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(({ status, label, color, count, pct }) => (
                      <div
                        key={status}
                        className={`flex items-center justify-between rounded-lg border p-2.5 transition ${
                          count > 0 ? "border-slate-200 bg-slate-50/70" : "border-slate-100 bg-slate-50/20 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-bold text-slate-800 truncate" title={label}>
                            {label}
                          </span>
                        </div>
                        <div className="text-right text-xs font-mono">
                          <span className="font-bold text-slate-900">{count}</span>
                          <span className="ml-1 text-[11px] font-semibold text-slate-500">
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Bar Footer */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Summary Distribution</span>
                    <span className="font-mono text-tech-blue font-bold">100% Total</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Priority Breakdown Chart */}
        <div className="col-span-4 max-xl:col-span-12 rounded-xl border border-tech-line bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Priority Breakdown</h2>
            <p className="mt-0.5 text-xs text-tech-muted">
              Distribution of service request urgency levels.
            </p>

            <div className="my-6 space-y-4">
              {metrics.priorityCounts.map(({ priority, count }) => {
                const pct = Math.round((count / totalPriorityCount) * 100);
                const colorClass =
                  priority === "URGENT"
                    ? "bg-red-500 text-red-700"
                    : priority === "HIGH"
                      ? "bg-amber-500 text-amber-700"
                      : "bg-slate-400 text-slate-700";

                return (
                  <div key={priority} className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-slate-800">{priority}</span>
                      <span className="font-mono font-bold text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colorClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg bg-tech-blue-soft p-3 text-center text-xs font-semibold text-tech-blue">
            Filter dynamically updates all charts & metrics
          </div>
        </div>
      </section>
    </div>
  );
}
