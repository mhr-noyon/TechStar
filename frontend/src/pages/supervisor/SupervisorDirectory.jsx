import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Save, Wrench, X } from "lucide-react";
import { supervisorApi } from "../../services/supervisor.api";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";

const config = {
  customers: {
    title: "Customers",
    role: "CUSTOMER",
    subtitle: "Customer accounts connected to service history.",
  },
  customer: {
    title: "Customers",
    role: "CUSTOMER",
    subtitle: "Customer accounts connected to service history.",
  },
  operators: {
    title: "Operators",
    role: "OPERATOR",
    subtitle: "Operator accounts and operational ownership.",
  },
  operator: {
    title: "Operators",
    role: "OPERATOR",
    subtitle: "Operator accounts and operational ownership.",
  },
  technicians: {
    title: "Technicians",
    role: "TECHNICIAN",
    subtitle: "Technician capacity, availability, and workload.",
  },
  technician: {
    title: "Technicians",
    role: "TECHNICIAN",
    subtitle: "Technician capacity, availability, and workload.",
  },
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "",
  maxCapacity: "5",
};

export default function SupervisorDirectory({ type = "technicians" }) {
  const page = config[type] || config.technicians;
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const load = () => {
    const isTech = type === "technicians" || type === "technician";
    const request = isTech
      ? typeof supervisorApi.technicians === "function"
        ? supervisorApi.technicians()
        : supervisorApi.users("TECHNICIAN")
      : supervisorApi.users(page.role);
    request
      .then(setRows)
      .catch((requestError) => setError(requestError.message));
  };

  useEffect(() => {
    setEditing(null);
    setShowForm(false);
    setForm(emptyForm);
    load();
  }, [type, page.role]);

  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleToggleAvailability = async (techRow) => {
    try {
      await supervisorApi.updateTechnician(techRow.id, {
        isAvailable: !techRow.is_available,
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitTrigger = (event) => {
    event.preventDefault();
    setConfirmModal({ isOpen: true });
  };

  const executeSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        if (type === "technicians") {
          await supervisorApi.updateTechnician(editing.id, {
            name: form.name,
            email: form.email,
            phone: form.phone,
            ...(form.password ? { password: form.password } : {}),
            specialization: form.specialization,
            maxCapacity: form.maxCapacity,
          });
        } else {
          await supervisorApi.updateUser(editing.id, {
            name: form.name,
            email: form.email,
            phone: form.phone,
            ...(form.password ? { password: form.password } : {}),
          });
        }
      } else if (type === "operators") {
        await supervisorApi.createOperator(form);
      } else {
        await supervisorApi.createTechnician(form);
      }
      setEditing(null);
      setShowForm(false);
      setForm(emptyForm);
      setConfirmModal({ isOpen: false });
      load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row) => {
    const user = row.user || row;
    setEditing(row);
    setShowForm(true);
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      specialization: row.specialization || "",
      maxCapacity: String(row.max_capacity || 5),
    });
  };

  const cancelForm = () => {
    setEditing(null);
    setShowForm(false);
    setForm(emptyForm);
  };

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    if (!rows) return [];
    return rows
      .filter((row) => {
        const u = row?.user || row || {};
        const name = u.name || "";
        const email = u.email || "";
        const phone = u.phone || "";
        const spec = row?.specialization || "";
        return `${name} ${email} ${phone} ${spec}`
          .toLowerCase()
          .includes((query || "").toLowerCase());
      })
      .sort((a, b) => {
        const userA = a?.user || a || {};
        const userB = b?.user || b || {};
        let valA = userA[sortBy];
        let valB = userB[sortBy];

        if (sortBy === "created_at") {
          valA = valA ? new Date(valA).getTime() : 0;
          valB = valB ? new Date(valB).getTime() : 0;
        } else {
          valA = String(valA || "").toLowerCase();
          valB = String(valB || "").toLowerCase();
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [rows, query, sortBy, sortOrder]);

  if (!rows) return <Loading label={`Loading ${page.title.toLowerCase()}...`} />;

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="text-tech-blue" />
    ) : (
      <ArrowDown size={14} className="text-tech-blue" />
    );
  };

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-tech-blue">
            People management
          </p>
          <h1 className="mt-2 text-3xl font-bold">{page.title}</h1>
          <p className="mt-2 text-sm text-tech-muted">{page.subtitle}</p>
        </div>
        {type !== "customers" && (
          <button
            className="flex items-center gap-2 rounded-lg bg-tech-blue px-4 py-2.5 text-sm font-bold text-white cursor-pointer shadow-2xs"
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setShowForm(true);
            }}
          >
            <Plus size={16} />
            {`Create ${type === "operators" ? "operator" : "technician"}`}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Technician Capacity Overview Section (Moved from Dashboard) */}
      {type === "technicians" && (
        <section className="rounded-xl border border-tech-line bg-white p-6 shadow-2xs">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Technician Workload & Capacity</h2>
              <p className="mt-0.5 text-xs text-tech-muted">
                Active jobs against max capacity in the repair shop
              </p>
            </div>
            <Wrench className="text-slate-300" size={20} />
          </div>

          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {rows.map((tech) => {
              const pct = Math.min(100, Math.round((tech.active_jobs / tech.max_capacity) * 100));
              return (
                <div key={tech.id} className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-800">
                      {tech.user?.name || "Technician"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(tech)}
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md cursor-pointer transition ${
                        tech.is_available
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {tech.is_available ? "Available" : "Unavailable"}
                    </button>
                  </div>
                  <div className="flex justify-between text-xs text-tech-muted mb-1.5">
                    <span>Active Workload</span>
                    <span className="font-bold text-slate-900">
                      {tech.active_jobs} / {tech.max_capacity}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-tech-blue rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && (
        <form
          className="rounded-xl border border-tech-line bg-white p-6 shadow-md transition-all"
          onSubmit={handleSubmitTrigger}
        >
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900">
              {editing
                ? `Update ${type === "operators" ? "Operator" : "Technician"}`
                : `Create ${type === "operators" ? "Operator" : "Technician"}`}
            </h2>
            <button
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              type="button"
              onClick={cancelForm}
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <label className="text-xs font-semibold text-slate-600">
              Name
              <input
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-tech-blue outline-none"
                required
                name="name"
                value={form.name}
                onChange={update}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Email
              <input
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-tech-blue outline-none"
                required
                type="email"
                name="email"
                value={form.email}
                onChange={update}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Phone
              <input
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-tech-blue outline-none"
                required
                name="phone"
                value={form.phone}
                onChange={update}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              {editing ? "Password (leave empty to keep current)" : "Password"}
              <input
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-tech-blue outline-none"
                required={!editing}
                minLength={editing ? 0 : 8}
                type="password"
                name="password"
                value={form.password}
                onChange={update}
              />
            </label>
            {type === "technicians" && (
              <>
                <label className="text-xs font-semibold text-slate-600">
                  Specialization
                  <input
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-tech-blue outline-none"
                    name="specialization"
                    value={form.specialization}
                    onChange={update}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Maximum capacity
                  <input
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-tech-blue outline-none"
                    required
                    min="1"
                    type="number"
                    name="maxCapacity"
                    value={form.maxCapacity}
                    onChange={update}
                  />
                </label>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              className="flex items-center gap-2 rounded-lg bg-tech-blue px-4 py-2.5 text-sm font-bold text-white cursor-pointer disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              <Save size={16} />
              {saving ? "Saving..." : editing ? "Save changes" : "Create account"}
            </button>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              type="button"
              onClick={cancelForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Directory Data Table */}
      <section className="overflow-hidden rounded-xl border border-tech-line bg-white shadow-2xs">
        <div className="border-b border-tech-line p-4">
          <input
            className="h-10 w-full max-w-sm rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-tech-blue"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${page.title.toLowerCase()}...`}
          />
        </div>

        {processedRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer select-none hover:bg-slate-100 transition"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Name</span>
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th
                    className="px-4 py-3 cursor-pointer select-none hover:bg-slate-100 transition"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Created Date</span>
                      <SortIcon field="created_at" />
                    </div>
                  </th>
                  {type === "technicians" && (
                    <>
                      <th className="px-4 py-3">Specialization</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Availability</th>
                    </>
                  )}
                  {type !== "customers" && <th className="px-4 py-3">Action</th>}
                </tr>
              </thead>
              <tbody>
                {processedRows.map((row) => {
                  const user = row?.user || row || {};
                  const rowId = row?.id || user?.id;
                  return (
                    <tr className="border-t border-slate-100 hover:bg-slate-50/50" key={rowId}>
                      <td className="px-4 py-4 font-semibold text-slate-900">{user.name || "N/A"}</td>
                      <td className="px-4 py-4 text-tech-muted">{user.email || "N/A"}</td>
                      <td className="px-4 py-4 text-tech-muted">{user.phone || "N/A"}</td>
                      <td className="px-4 py-4 text-tech-muted">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      {type === "technicians" && (
                        <>
                          <td className="px-4 py-4">
                            {row.specialization || "General repair"}
                          </td>
                          <td className="px-4 py-4 font-semibold">
                            {row.active_jobs} / {row.max_capacity}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(row)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition ${
                                row.is_available
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                            >
                              {row.is_available ? "Available" : "Unavailable"}
                            </button>
                          </td>
                        </>
                      )}
                      {type !== "customers" && (
                        <td className="px-4 py-4">
                          <button
                            className="font-bold text-tech-blue hover:underline cursor-pointer"
                            onClick={() => startEdit(row)}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={`No ${page.title.toLowerCase()}`}
            description="Records will appear here when available."
          />
        )}
      </section>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          editing
            ? `Update ${type === "operators" ? "Operator" : "Technician"} Account`
            : `Create ${type === "operators" ? "Operator" : "Technician"} Account`
        }
        description={`Are you sure you want to ${
          editing ? "save changes to" : "create account for"
        } ${form.name || "this user"} (${form.email})?`}
        confirmText={editing ? "Save Changes" : "Create Account"}
        loading={saving}
        onConfirm={executeSave}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}
