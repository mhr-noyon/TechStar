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
      <div className="page-heading compact">
        <div>
          <Link className="back-link" to="/operator/requests">
            <ArrowLeft size={16} />
            Back to requests
          </Link>
          <h1>Create service request</h1>
          <p className="subtitle">
            Capture the customer, repair issue, and delivery commitment in one
            step.
          </p>
        </div>
      </div>
      {!operatorId && (
        <div className="alert warning">You are not logged in.</div>
      )}
      {error && <div className="alert error">{error}</div>}
      <form className="request-form" onSubmit={submit}>
        <section className="panel form-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">01</span>
              <h2>Customer</h2>
              <p>Existing customers are matched by phone number.</p>
            </div>
            {lookupState === "found" && (
              <span className="inline-success">
                <Check size={14} />
                Registered customer
              </span>
            )}
          </div>
          <div className="form-grid customer-grid">
            <label>
              Phone number
              <input
                required
                name="phone"
                value={form.phone}
                onChange={update}
                onBlur={lookupCustomer}
                placeholder="+1 555 0100"
              />
            </label>
            <label>
              Customer name
              <input
                required
                name="name"
                value={form.name}
                onChange={update}
                placeholder="Full name"
              />
            </label>
            <label>
              Email address
              <input
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
            <p className="field-note">Checking registered customers...</p>
          )}
          {lookupState === "new" && (
            <p className="field-note">
              No customer found for this phone. A new customer profile will be
              created.
            </p>
          )}
        </section>
        <section className="panel form-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">02</span>
              <h2>Repair request</h2>
              <p>Describe what needs attention and set the urgency.</p>
            </div>
          </div>
          <div className="form-grid">
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
            <label>
              Expected delivery days
              <input
                required
                min="0"
                type="number"
                name="expectedDays"
                value={form.expectedDays}
                onChange={update}
              />
            </label>


            <label className="delivery-preview">
              <CalendarDays size={16} />
              <span>
                Estimated delivery<strong>{formatDate(deliveryDate)}</strong>
              </span>
            </label>
            <label className="wide">
              Device information
              <textarea
                required
                name="deviceInfo"
                value={form.deviceInfo}
                onChange={update}
                placeholder="Brand, model, serial number..."
                rows="3"
              />
            </label>
            <label className="wide">
              Problem description
              <textarea
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
        <section className="panel form-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">03</span>
              <h2>Technician assignment</h2>
              <p>
                Optional now. You can assign this request later from its
                details.
              </p>
            </div>
          </div>
          <SelectField
            className="technician-field"
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
        <div className="form-actions">
          <Link className="button secondary" to="/operator/requests">
            Cancel
          </Link>
          <button className="button primary" disabled={saving || !operatorId}>
            <Save size={16} />
            {saving ? "Creating request..." : "Create request"}
          </button>
        </div>
      </form>
    </>
  );
}
