import { useEffect, useState } from "react";
import { ArrowLeft, Check, Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { serviceRequestApi } from "../../services/serviceRequest.api";
import { technicianApi } from "../../services/technician.api";
import {
  connectOperatorSocket,
  setTechnicianReservation,
} from "../../sockets/serviceRequest.socket";
import { useAuth } from "../../context/AuthContext";
import SelectField from "../../components/common/SelectField";
import StatusBadge from "../../components/serviceRequest/StatusBadge";
import StatusTimeline from "../../components/serviceRequest/StatusTimeline";
import PrintableServiceRequest from "../../components/serviceRequest/PrintableServiceRequest";
import Loading from "../../components/common/Loading";

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
const date = (value, withTime = false) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        ...(withTime ? { timeStyle: "short" } : {}),
      }).format(new Date(value))
    : "Not set";

export default function ServiceRequestDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const operatorId = user?.id || null;
  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [reservations, setReservations] = useState({});
  const [selectedTech, setSelectedTech] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [item, events, allTechnicians] = await Promise.all([
        serviceRequestApi.get(id),
        serviceRequestApi.history(id),
        technicianApi.list(),
      ]);
      setRequest(item);
      setHistory(events);
      setTechnicians(allTechnicians);
      setSelectedTech(item.technician_id || "");
      setSelectedStatus(item.status);
      setProgress(item.progress || 0);
      setPaymentAmount(
        item.payment_amount !== null && item.payment_amount !== undefined
          ? String(item.payment_amount)
          : "",
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    const cleanup = connectOperatorSocket({
      "serviceRequest:assigned": ({ serviceRequest }) => {
        if (String(serviceRequest.id) === id) setRequest(serviceRequest);
      },
      "serviceRequest:statusUpdated": ({ serviceRequest }) => {
        if (String(serviceRequest.id) === id) {
          setRequest(serviceRequest);
          setSelectedStatus(serviceRequest.status);
          setProgress(serviceRequest.progress || 0);
        }
      },
      "technician:reservationChanged": ({ technicianId, reserved }) =>
        setReservations((current) => ({
          ...current,
          [technicianId]: Math.max(
            0,
            (current[technicianId] || 0) + (reserved ? 1 : -1),
          ),
        })),
    });
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [id]);

  const mutate = async (type, action) => {
    setSaving(type);
    setError("");
    setMessage("");
    try {
      const updated = await action();
      setRequest(updated);
      setHistory(await serviceRequestApi.history(id));
      setMessage("Saved successfully");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving("");
    }
  };

  const changeTechnician = (event) => {
    const nextId = event.target.value;
    if (selectedTech && selectedTech !== nextId)
      setTechnicianReservation({
        technicianId: selectedTech,
        requestId: id,
        reserved: false,
      });
    if (nextId)
      setTechnicianReservation({
        technicianId: nextId,
        requestId: id,
        reserved: true,
      });
    setSelectedTech(nextId);
  };

  const assign = async () => {
    const updated = await serviceRequestApi.assign(id, {
      technicianId: selectedTech,
      changedBy: operatorId,
    });
    setTechnicianReservation({
      technicianId: selectedTech,
      requestId: id,
      reserved: false,
    });
    return updated;
  };

  if (loading) return <Loading label="Loading request..." />;
  if (!request)
    return <div className="alert error">{error || "Request not found"}</div>;

  return (
    <>
      <div className="print:hidden">
        <div className="page-heading compact">
          <div>
            <Link className="back-link" to="/operator/requests">
              <ArrowLeft size={16} />
              Back to requests
            </Link>
            <div className="title-line">
              <h1>Request SR-{request.id}</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="subtitle">
              Created {date(request.created_at, true)} · Updated{" "}
              {date(request.updated_at, true)}
            </p>
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        {message && (
          <div className="alert success">
            <Check size={16} />
            {message}
          </div>
        )}
        <div className="details-grid">
          <div className="details-main">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Request details</h2>
                  <p>Customer, device, and delivery information</p>
                </div>
                <span
                  className={`priority priority-${request.priority.toLowerCase()}`}
                >
                  {request.priority}
                </span>
              </div>
              <div className="info-grid">
                <div>
                  <span>Customer name</span>
                  <strong>
                    {request.customer?.name || "Customer unavailable"}
                  </strong>
                </div>
                <div>
                  <span>Phone & email</span>
                  <strong>
                    {request.customer?.phone || "No phone"}
                    <br />
                    {request.customer?.email || "No email"}
                  </strong>
                </div>
                <div>
                  <span>Expected delivery</span>
                  <strong>{date(request.expected_delivery_at)}</strong>
                </div>
                <div>
                  <span>Assigned technician</span>
                  <strong>{request.technician?.name || "Unassigned"}</strong>
                </div>
                <div>
                  <span>Service Amount</span>
                  <strong>
                    {request.payment_amount !== null &&
                    request.payment_amount !== undefined
                      ? `৳ ${Number(request.payment_amount).toLocaleString("en-BD")}`
                      : "Not set"}
                  </strong>
                </div>

                <div className="wide">
                  <span>Device information</span>
                  <strong>{request.device_info}</strong>
                </div>
                <div className="wide">
                  <span>Problem description</span>
                  <strong className="long-copy">
                    {request.problem_description}
                  </strong>
                </div>
              </div>
            </section>
            <section className="panel grid grid-cols-[1fr_auto_auto] items-center gap-5 border-sky-100 bg-sky-50 max-[700px]:grid-cols-1 print:border print:border-black print:shadow-none">
              <div className="print:hidden">
                <span className="text-[11px] font-extrabold uppercase tracking-[1.3px] text-tech-blue">
                  Customer handoff
                </span>
                <h2 className="my-1 text-base">Printed tracking access</h2>
                <p className="m-0 text-xs text-tech-muted">
                  Give the customer this request ID and six-digit code.
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-sky-100 bg-white px-4 py-3 text-center max-[700px]:items-start max-[700px]:text-left">
                <span className="text-[11px] text-tech-muted">
                  Request ID: SR-{request.id}
                </span>
                <strong className="font-mono text-[22px] tracking-[3px] text-tech-blue">
                  {request.customer_access_code || "Not available"}
                </strong>
              </div>
              <button
                className="button secondary max-[700px]:w-full print:hidden"
                type="button"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                Print access slip
              </button>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Request history</h2>
                  <p>Every update recorded against this request</p>
                </div>
              </div>
              <StatusTimeline history={history} />
            </section>
          </div>
          <aside className="details-side">
            <section className="panel action-panel">
              <h2>Technician assignment</h2>
              <p>Live count includes reservations made by other operators.</p>
              <SelectField
                label="Technician"
                value={selectedTech}
                onChange={changeTechnician}
              >
                <option value="">Select technician</option>
                {technicians.map((tech) => {
                  const selected = reservations[tech.user_id] || 0;
                  const total = tech.active_jobs + selected;
                  const full = total >= tech.max_capacity;
                  return (
                    <option
                      disabled={full}
                      key={tech.user_id}
                      value={tech.user_id}
                    >
                      {tech.user?.name || "Technician unavailable"} · Active{" "}
                      {tech.active_jobs} · Selected {selected} · Total {total}/
                      {tech.max_capacity}
                      {full ? " · Full" : ""}
                    </option>
                  );
                })}
              </SelectField>
              <button
                className="button primary full"
                disabled={!selectedTech || saving === "assign" || !operatorId}
                onClick={() => mutate("assign", assign)}
              >
                {saving === "assign" ? "Assigning..." : "Assign technician"}
              </button>
              <div className="assigned">
                <span>Current technician</span>
                <strong>{request.technician?.name || "Unassigned"}</strong>
              </div>
            </section>
            <section className="panel action-panel">
              <h2>Progress & status</h2>
              <SelectField
                label="Status"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
              >
                {statuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </SelectField>
              <button
                className="button secondary full"
                disabled={
                  saving === "status" ||
                  selectedStatus === request.status ||
                  !operatorId
                }
                onClick={() =>
                  mutate("status", () =>
                    serviceRequestApi.status(id, {
                      status: selectedStatus,
                      changedBy: operatorId,
                    }),
                  )
                }
              >
                {saving === "status" ? "Updating..." : "Update status"}
              </button>
              <label className="progress-label">
                Progress <strong>{progress}%</strong>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(event) => setProgress(Number(event.target.value))}
                />
              </label>
              <button
                className="button secondary full"
                disabled={
                  saving === "progress" ||
                  progress === request.progress ||
                  !operatorId
                }
                onClick={() =>
                  mutate("progress", () =>
                    serviceRequestApi.progress(id, {
                      progress,
                      changedBy: operatorId,
                    }),
                  )
                }
              >
                {saving === "progress" ? "Saving..." : "Save progress"}
              </button>
            </section>

            <section className="panel action-panel">
              <h2>Payment & Billing</h2>
              {selectedStatus === "COMPLETED" ||
              request.status === "COMPLETED" ? (
                <>
                  <label className="text-xs font-semibold text-slate-600 block">
                    Payment Amount (৳)
                    <input
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold focus:border-tech-blue outline-none"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter final payment amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </label>
                  <button
                    className="button primary full mt-3 cursor-pointer"
                    disabled={
                      saving === "payment" ||
                      !operatorId ||
                      (paymentAmount === String(request.payment_amount ?? "") &&
                        selectedStatus === request.status)
                    }
                    onClick={() =>
                      mutate("payment", () =>
                        serviceRequestApi.update(id, {
                          ...(selectedStatus !== request.status
                            ? { status: selectedStatus }
                            : {}),
                          paymentAmount:
                            paymentAmount !== "" ? Number(paymentAmount) : null,
                          changedBy: operatorId,
                          note: `Payment amount set to ৳${paymentAmount || 0}${selectedStatus !== request.status ? ` and status set to ${selectedStatus}` : ""}`,
                        }),
                      )
                    }
                  >
                    {saving === "payment"
                      ? "Updating Payment..."
                      : "Save Payment & Completed Status"}
                  </button>
                </>
              ) : (
                <p className="text-xs text-tech-muted italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                  Payment amount becomes applicable when the service status is
                  set to <strong>COMPLETED</strong>.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>

      {/* Print-only slip — hidden on screen, shown during window.print() */}
      <PrintableServiceRequest request={request} />
    </>
  );
}
