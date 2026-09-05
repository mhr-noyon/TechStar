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
      <div className="page-heading">
        <div>
          <p className="eyebrow">Operator workspace</p>
          <h1>Good morning</h1>
          <p className="subtitle">
            Here is what is happening across your repair operation today.
          </p>
        </div>
        <div className="heading-actions">
          <button className="button secondary" onClick={load}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link className="button primary" to="/operator/requests/new">
            <Plus size={17} />
            New request
          </Link>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <Loading label="Loading dashboard..." />
      ) : (
        <>
          <section className="metric-grid">
            {cards.map(({ label, value, icon: Icon, tone }) => (
              <div className="metric-card" key={label}>
                <div className={`metric-icon ${tone}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <ArrowUpRight className="metric-arrow" size={17} />
              </div>
            ))}
          </section>
          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent service requests</h2>
                  <p>Latest activity from the repair queue</p>
                </div>
                <Link className="text-action" to="/operator/requests">
                  View all <ArrowUpRight size={15} />
                </Link>
              </div>
              {requests.length ? (
                <div className="recent-list">
                  {requests.slice(0, 6).map((item) => (
                    <Link
                      className="recent-row"
                      to={`/operator/requests/${item.id}`}
                      key={item.id}
                    >
                      <span className="request-symbol">SR</span>
                      <div>
                        <strong>SR-{item.id}</strong>
                        <span>{item.device_info}</span>
                      </div>
                      <StatusBadge status={item.status} />
                      <small>{date(item.created_at)}</small>
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
            <div className="panel status-overview">
              <div className="panel-heading">
                <div>
                  <h2>Queue overview</h2>
                  <p>Requests by current status</p>
                </div>
              </div>
              {statuses.map((status) => (
                <div className="status-line" key={status}>
                  <span>{status.replaceAll("_", " ")}</span>
                  <strong>{counts[status] || 0}</strong>
                  <div>
                    <i
                      style={{
                        width: `${requests.length ? ((counts[status] || 0) / requests.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
