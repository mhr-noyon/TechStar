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
  const filtered = useMemo(
    () =>
      requests.filter((item) => {
        const haystack =
          `${item.id} ${item.customer_id} ${item.device_info} ${item.technician_id || ""}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (status === "ALL" || item.status === status) &&
          (priority === "ALL" || item.priority === priority)
        );
      }),
    [requests, query, status, priority],
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Service requests</h1>
          <p className="subtitle">
            Track every repair from intake through delivery.
          </p>
        </div>
        <div className="heading-actions">
          <button className="button secondary" onClick={load}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link className="button primary" to="/operator/requests/new">
            <Plus size={17} />
            Create request
          </Link>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      <section className="panel request-panel">
        <div className="filters">
          <label className="search filter-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, customer, device..."
            />
          </label>
          <SelectField
            className="select-filter"
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
            className="select-filter"
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="ALL">All priorities</option>
            <option>NORMAL</option>
            <option>HIGH</option>
            <option>URGENT</option>
          </SelectField>
          <span className="result-count">{filtered.length} requests</span>
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
