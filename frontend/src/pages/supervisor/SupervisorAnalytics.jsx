import { useEffect, useState } from "react";
import { supervisorApi } from "../../services/supervisor.api";
import Loading from "../../components/common/Loading";
import { connectOperatorSocket } from "../../sockets/serviceRequest.socket";

export default function SupervisorAnalytics({ sales = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const load = () =>
      supervisorApi
        .overview()
        .then(setData)
        .catch((requestError) => setError(requestError.message));
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
  if (error)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  if (!data) return <Loading label="Loading analytics..." />;
  const source = sales ? data.revenueByStatus : data.statusDistribution;
  const completedRevenue =
    data.revenueByStatus.find((item) => item.status === "COMPLETED")?.value ||
    0;
  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-tech-blue">
          {sales ? "Financial intelligence" : "Management intelligence"}
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {sales ? "Sales & revenue" : "Analytics"}
        </h1>
        <p className="mt-2 text-sm text-tech-muted">
          Live aggregated values from service requests.
        </p>
      </div>
      <section className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        {[
          [
            sales ? "Total revenue" : "Total requests",
            sales
              ? `৳ ${data.kpis.totalRevenue.toLocaleString("en-BD")}`
              : data.kpis.totalRequests,
          ],
          [
            sales ? "Average service value" : "Active repairs",
            sales
              ? `৳ ${Math.round(data.kpis.averageServiceValue).toLocaleString("en-BD")}`
              : data.kpis.activeRepairs,
          ],
          [
            sales ? "Completed revenue" : "Overdue requests",
            sales
              ? `৳ ${completedRevenue.toLocaleString("en-BD")}`
              : data.kpis.overdue,
          ],
        ].map(([label, value]) => (
          <div
            className="rounded-xl border border-tech-line bg-white p-5 shadow-sm"
            key={label}
          >
            <p className="text-sm text-tech-muted">{label}</p>
            <strong className="mt-2 block text-3xl font-bold">{value}</strong>
          </div>
        ))}
      </section>
      <section className="rounded-xl border border-tech-line bg-white p-6 shadow-sm">
        <h2 className="font-bold">
          {sales ? "Revenue by service status" : "Request status distribution"}
        </h2>
        <p className="mt-1 text-sm text-tech-muted">
          Values are calculated from current database records.
        </p>
        <div className="mt-7 space-y-5">
          {source.map((item) => {
            const max = Math.max(
              ...source.map((entry) => Number(entry.value)),
              1,
            );
            return (
              <div key={item.status}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{item.status.replaceAll("_", " ")}</span>
                  <strong>
                    {sales
                      ? `৳ ${Number(item.value).toLocaleString("en-BD")}`
                      : item.value}
                  </strong>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <i
                    className="block h-full rounded-full bg-tech-blue"
                    style={{ width: `${(Number(item.value) / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="rounded-xl border border-tech-line bg-white p-6 shadow-sm">
        <h2 className="font-bold">Priority distribution</h2>
        <div className="mt-5 grid grid-cols-3 gap-4 max-sm:grid-cols-1">
          {data.priorityDistribution.map((item) => (
            <div className="rounded-lg bg-slate-50 p-4" key={item.priority}>
              <p className="text-xs text-tech-muted">{item.priority}</p>
              <strong className="mt-1 block text-2xl">{item.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
