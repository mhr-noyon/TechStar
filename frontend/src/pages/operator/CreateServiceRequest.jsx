import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { serviceRequestApi } from "../../services/serviceRequest.api";
import { technicianApi } from "../../services/technician.api";
import { userApi } from "../../services/user.api";
import {
  connectOperatorSocket,
  setTechnicianReservation,
} from "../../sockets/serviceRequest.socket";
import Loading from "../../components/common/Loading";
import SelectField from "../../components/common/SelectField";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value)
    : "Choose delivery days";

export default function CreateServiceRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    priority: "NORMAL",
    paymentAmount: "",
    deviceInfo: "",
    problemDescription: "",
    expectedDays: "15",
    technicianId: "",
  });
  const { user } = useAuth();
  const operatorId = user?.id || null;
  const [technicians, setTechnicians] = useState([]);
  const [reservations, setReservations] = useState({});
  const [customer, setCustomer] = useState(null);
  const [lookupState, setLookupState] = useState("idle");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, pendingData: null });

  useEffect(() => {
    technicianApi
      .list()
      .then(setTechnicians)
      .catch(() => {});
    return connectOperatorSocket({
      "technician:reservationChanged": ({ technicianId, reserved }) =>
        setReservations((current) => ({
          ...current,
          [technicianId]: Math.max(
            0,
            (current[technicianId] || 0) + (reserved ? 1 : -1),
          ),
        })),
    });
  }, []);

  const deliveryDate = useMemo(() => {
    const days = Number(form.expectedDays);
    if (!Number.isFinite(days) || days < 0) return null;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }, [form.expectedDays]);

  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  const lookupCustomer = async () => {
    if (!form.phone.trim()) return;
    setLookupState("loading");
    try {
      const found = await userApi.findCustomerByPhone(form.phone.trim());
      if (found) {
        setCustomer(found);
        setForm((current) => ({
          ...current,
          name: found.name,
          email: found.email,
        }));
        setLookupState("found");
      } else {
        setCustomer(null);
        setLookupState("new");
      }
    } catch (requestError) {
      setLookupState("new");
      setError(requestError.message);
    }
  };

  const selectTechnician = (event) => {
    const nextId = event.target.value;
    if (form.technicianId && form.technicianId !== nextId)
      setTechnicianReservation({
        technicianId: form.technicianId,
        requestId: `new-${operatorId}`,
        reserved: false,
      });
    if (nextId)
      setTechnicianReservation({
        technicianId: nextId,
        requestId: `new-${operatorId}`,
        reserved: true,
      });
    setForm((current) => ({ ...current, technicianId: nextId }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      let customerUser = customer;
      if (!customerUser)
        customerUser = await userApi.createCustomer({
          name: form.name,
          email: form.email,
          phone: form.phone,
        });
      const created = await serviceRequestApi.create({
        customerId: customerUser.id,
        createdBy: operatorId,
        deviceInfo: form.deviceInfo,
        problemDescription: form.problemDescription,
        priority: form.priority,
        paymentAmount: form.paymentAmount ? Number(form.paymentAmount) : null,
        expectedDeliveryAt: deliveryDate?.toISOString() || null,
      });

      if (form.technicianId) {
        await serviceRequestApi.assign(created.id, {
          technicianId: form.technicianId,
          changedBy: operatorId,
        });
        setTechnicianReservation({
          technicianId: form.technicianId,
          requestId: `new-${operatorId}`,
          reserved: false,
        });
      }
      navigate(`/operator/requests/${created.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (!technicians && !error) return <Loading label="Loading technicians..." />;
  return (
    <>
      <div className="mb-8">
        <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-tech-blue hover:underline mb-2" to="/operator/requests">
          <ArrowLeft size={16} />
          Back to requests
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create service request</h1>
        <p className="mt-1 text-sm text-tech-muted">
          Capture the customer, repair issue, and delivery commitment in one
          step.
        </p>
      </div>
      {!operatorId && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">You are not logged in.</div>
      )}
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      <form className="space-y-6 max-w-4xl" onSubmit={submit}>
        <section className="rounded-2xl border border-tech-line bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-lg bg-sky-50 px-2 py-0.5 text-xs font-black text-tech-blue">01</span>
                Customer
              </h2>
              <p className="text-xs text-tech-muted mt-0.5">Existing customers are matched by phone number.</p>
            </div>
            {lookupState === "found" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <Check size={14} />
                Registered customer
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            <label className="block text-xs font-bold text-slate-700 space-y-1.5">
              <span>Phone number</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition"
                required
                name="phone"
                value={form.phone}
                onChange={update}
                onBlur={lookupCustomer}
                placeholder="+1 555 0100"
              />
            </label>
            <label className="block text-xs font-bold text-slate-700 space-y-1.5">
              <span>Customer name</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition"
                required
                name="name"
                value={form.name}
                onChange={update}
                placeholder="Full name"
              />
            </label>
            <label className="block text-xs font-bold text-slate-700 space-y-1.5">
              <span>Email address</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition"
                required
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                placeholder="name@example.com"
              />
            </label>
          </div>
          {lookupState === "loading" && (
            <p className="text-xs font-semibold text-slate-500">Checking registered customers...</p>
          )}
          {lookupState === "new" && (
            <p className="text-xs font-semibold text-amber-600">
              No customer found for this phone. A new customer profile will be
              created.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-tech-line bg-white p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-lg bg-sky-50 px-2 py-0.5 text-xs font-black text-tech-blue">02</span>
              Repair request
            </h2>
            <p className="text-xs text-tech-muted mt-0.5">Describe what needs attention and set the urgency.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <SelectField
              label="Priority"
              name="priority"
              value={form.priority}
              onChange={update}
            >
              <option>NORMAL</option>
              <option>HIGH</option>
              <option>URGENT</option>
            </SelectField>
            <label className="block text-xs font-bold text-slate-700 space-y-1.5">
              <span>Expected delivery days</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition"
                required
                min="0"
                type="number"
                name="expectedDays"
                value={form.expectedDays}
                onChange={update}
              />
            </label>

            <div className="flex items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-xs font-semibold text-tech-blue col-span-2 max-sm:col-span-1">
              <CalendarDays size={18} />
              <span>
                Estimated delivery: <strong className="ml-1 text-slate-900 font-bold">{formatDate(deliveryDate)}</strong>
              </span>
            </div>
            <label className="block text-xs font-bold text-slate-700 space-y-1.5 col-span-2 max-sm:col-span-1">
              <span>Device information</span>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition"
                required
                name="deviceInfo"
                value={form.deviceInfo}
                onChange={update}
                placeholder="Brand, model, serial number..."
                rows="3"
              />
            </label>
            <label className="block text-xs font-bold text-slate-700 space-y-1.5 col-span-2 max-sm:col-span-1">
              <span>Problem description</span>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition"
                required
                name="problemDescription"
                value={form.problemDescription}
                onChange={update}
                placeholder="Describe the issue reported by the customer..."
                rows="5"
              />
            </label>
          </div>
        </section>
        <section className="rounded-2xl border border-tech-line bg-white p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-lg bg-sky-50 px-2 py-0.5 text-xs font-black text-tech-blue">03</span>
              Technician assignment
            </h2>
            <p className="text-xs text-tech-muted mt-0.5">
              Optional now. You can assign this request later from its details.
            </p>
          </div>
          <SelectField
            label="Assign technician"
            value={form.technicianId}
            onChange={selectTechnician}
          >
            <option value="">Leave unassigned</option>
            {technicians.map((tech) => {
              const live = reservations[tech.user_id] || 0;
              const total = tech.active_jobs + live;
              const full = total >= tech.max_capacity;
              return (
                <option disabled={full} key={tech.user_id} value={tech.user_id}>
                  {tech.user?.name || "Technician unavailable"} · Active{" "}
                  {tech.active_jobs} · Selected {live} · Total {total}/
                  {tech.max_capacity}
                  {full ? " · Full" : ""}
                </option>
              );
            })}
          </SelectField>
        </section>
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
            to="/operator/requests"
          >
            Cancel
          </Link>
          <button
            className="flex items-center gap-2 rounded-xl bg-tech-blue px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-sky-700 transition disabled:opacity-50 cursor-pointer"
            disabled={saving || !operatorId}
          >
            <Save size={16} />
            {saving ? "Creating request..." : "Create request"}
          </button>
        </div>
      </form>
    </>
  );
}
