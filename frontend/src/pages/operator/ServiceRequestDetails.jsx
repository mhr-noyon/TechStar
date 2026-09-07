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
        <div className="mb-6">
          <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-tech-blue hover:underline mb-2" to="/operator/requests">
            <ArrowLeft size={16} />
            Back to requests
          </Link>
          <div className="flex items-center gap-3 my-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Request SR-{request.id}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-xs text-tech-muted">
            Created {date(request.created_at, true)} · Updated{" "}
            {date(request.updated_at, true)}
          </p>
        </div>
        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        {message && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <Check size={16} />
            {message}
          </div>
        )}
        <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
          <div className="col-span-2 space-y-6 max-lg:col-span-1">
            <section className="rounded-2xl border border-tech-line bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Request details</h2>
                  <p className="text-xs text-tech-muted">Customer, device, and delivery information</p>
                </div>
                <span
                  className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${
                    request.priority === "URGENT"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : request.priority === "HIGH"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {request.priority}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs max-sm:grid-cols-1">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Customer name</span>
                  <strong className="text-sm font-bold text-slate-800">
                    {request.customer?.name || "Customer unavailable"}
                  </strong>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Phone & email</span>
                  <strong className="text-sm font-bold text-slate-800">
                    {request.customer?.phone || "No phone"}
                    <br />
                    {request.customer?.email || "No email"}
                  </strong>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Expected delivery</span>
                  <strong className="text-sm font-bold text-slate-800">{date(request.expected_delivery_at)}</strong>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned technician</span>
                  <strong className="text-sm font-bold text-slate-800">{request.technician?.name || "Unassigned"}</strong>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Service Amount</span>
                  <strong className="text-sm font-bold text-slate-800">
                    {request.payment_amount !== null &&
                    request.payment_amount !== undefined
                      ? `৳ ${Number(request.payment_amount).toLocaleString("en-BD")}`
                      : "Not set"}
                  </strong>
                </div>

                <div className="col-span-2 max-sm:col-span-1">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Device information</span>
                  <strong className="text-sm font-semibold text-slate-800">{request.device_info}</strong>
                </div>
                <div className="col-span-2 max-sm:col-span-1">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Problem description</span>
                  <strong className="text-sm font-medium text-slate-700 leading-relaxed block mt-0.5">
                    {request.problem_description}
                  </strong>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-sky-100 bg-sky-50 p-6 shadow-2xs grid grid-cols-[1fr_auto_auto] items-center gap-5 max-[700px]:grid-cols-1 print:border print:border-black print:shadow-none">
              <div className="print:hidden">
                <span className="text-[11px] font-extrabold uppercase tracking-[1.3px] text-tech-blue">
                  Customer handoff
                </span>
                <h2 className="my-1 text-base font-extrabold text-slate-900">Printed tracking access</h2>
                <p className="m-0 text-xs text-tech-muted">
                  Give the customer this request ID and six-digit code.
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-sky-100 bg-white px-4 py-3 text-center max-[700px]:items-start max-[700px]:text-left">
                <span className="text-[11px] font-bold text-tech-muted">
                  Request ID: SR-{request.id}
                </span>
                <strong className="font-mono text-[22px] tracking-[3px] text-tech-blue font-extrabold">
                  {request.customer_access_code || "Not available"}
                </strong>
              </div>
              <button
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer max-[700px]:w-full print:hidden"
                type="button"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                Print access slip
              </button>
            </section>
            <section className="rounded-2xl border border-tech-line bg-white p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900">Request history</h2>
                <p className="text-xs text-tech-muted">Every update recorded against this request</p>
              </div>
              <StatusTimeline history={history} />
            </section>
          </div>
          <aside className="space-y-6">
            <section className="rounded-2xl border border-tech-line bg-white p-6 shadow-2xs space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">Technician assignment</h2>
              <p className="text-xs text-tech-muted">Live count includes reservations made by other operators.</p>
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-tech-blue px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-sky-700 transition disabled:opacity-50 cursor-pointer"
                disabled={!selectedTech || saving === "assign" || !operatorId}
                onClick={() => mutate("assign", assign)}
              >
                {saving === "assign" ? "Assigning..." : "Assign technician"}
              </button>
              <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                <span className="text-slate-500 font-semibold">Current technician</span>
                <strong className="font-bold text-slate-900">{request.technician?.name || "Unassigned"}</strong>
              </div>
            </section>
            <section className="rounded-2xl border border-tech-line bg-white p-6 shadow-2xs space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">Progress & status</h2>
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
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span>Progress</span>
                  <strong className="text-tech-blue">{progress}%</strong>
                </div>
                <input
                  className="w-full accent-tech-blue cursor-pointer"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(event) => setProgress(Number(event.target.value))}
                />
              </label>
              <button
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
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

            <section className="rounded-2xl border border-tech-line bg-white p-6 shadow-2xs space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">Payment & Billing</h2>
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
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-tech-blue px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-sky-700 transition disabled:opacity-50 cursor-pointer mt-3"
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
