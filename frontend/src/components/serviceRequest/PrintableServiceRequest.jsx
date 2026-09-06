/**
 * PrintableServiceRequest
 *
 * A reusable, print-only component that renders a clean service request slip.
 * Hidden on screen; displayed only via @media print or when forced visible.
 *
 * Usage:
 *   <PrintableServiceRequest request={requestObject} />
 *
 * The parent page should call `window.print()` to trigger the browser's
 * print dialog, and the @media print styles in App.css will hide everything
 * except this component.
 */

const fmt = (value, withTime = false) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        ...(withTime ? { timeStyle: "short" } : {}),
      }).format(new Date(value))
    : "—";

export default function PrintableServiceRequest({ request }) {
  if (!request) return null;

  const isCompleted = request.status === "COMPLETED";

  return (
    <div className="print-slip" aria-hidden="true">
      {/* ---- Header ---- */}
      <div className="print-slip__header">
        <div className="print-slip__brand">
          <div className="print-slip__brand-mark">TS</div>
          <span>
            Tech<span className="print-slip__brand-accent">Star</span>
          </span>
        </div>
        <div className="print-slip__tagline">Service Request Slip</div>
      </div>

      <hr className="print-slip__divider" />

      {/* ---- Access Code (most prominent) ---- */}
      <div className="print-slip__access">
        <div className="print-slip__access-label">Customer Access Code</div>
        <div className="print-slip__access-code">
          {request.customer_access_code || "N/A"}
        </div>
        <div className="print-slip__access-hint">
          Request ID: <strong>SR-{request.id}</strong>
        </div>
      </div>

      <hr className="print-slip__divider" />

      {/* ---- Customer Information ---- */}
      <table className="print-slip__table">
        <tbody>
          <tr>
            <td className="print-slip__label">Customer</td>
            <td>{request.customer?.name || "—"}</td>
          </tr>
          <tr>
            <td className="print-slip__label">Phone</td>
            <td>{request.customer?.phone || "—"}</td>
          </tr>
          <tr>
            <td className="print-slip__label">Email</td>
            <td>{request.customer?.email || "—"}</td>
          </tr>
        </tbody>
      </table>

      <hr className="print-slip__divider" />

      {/* ---- Device & Problem ---- */}
      <table className="print-slip__table">
        <tbody>
          <tr>
            <td className="print-slip__label">Device</td>
            <td>{request.device_info || "—"}</td>
          </tr>
          <tr>
            <td className="print-slip__label">Problem</td>
            <td>{request.problem_description || "—"}</td>
          </tr>
          <tr>
            <td className="print-slip__label">Priority</td>
            <td>{request.priority || "NORMAL"}</td>
          </tr>
          <tr>
            <td className="print-slip__label">Status</td>
            <td>{(request.status || "").replaceAll("_", " ")}</td>
          </tr>
        </tbody>
      </table>

      <hr className="print-slip__divider" />

      {/* ---- Dates & Assignment ---- */}
      <table className="print-slip__table">
        <tbody>
          <tr>
            <td className="print-slip__label">Created</td>
            <td>{fmt(request.created_at, true)}</td>
          </tr>
          <tr>
            <td className="print-slip__label">Expected Delivery</td>
            <td>{fmt(request.expected_delivery_at)}</td>
          </tr>
          <tr>
            <td className="print-slip__label">Technician</td>
            <td>{request.technician?.name || "Unassigned"}</td>
          </tr>
          {isCompleted && (
            <>
              <tr>
                <td className="print-slip__label">Completed</td>
                <td>{fmt(request.completed_at, true)}</td>
              </tr>
              <tr>
                <td className="print-slip__label">Payment Amount</td>
                <td>
                  {request.payment_amount !== null &&
                  request.payment_amount !== undefined
                    ? `৳ ${Number(request.payment_amount).toLocaleString("en-BD")}`
                    : "—"}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* ---- Footer ---- */}
      <div className="print-slip__footer">
        <p>
          Use Request ID <strong>SR-{request.id}</strong> and Access Code{" "}
          <strong>{request.customer_access_code}</strong> to track your repair
          online.
        </p>
        <p className="print-slip__footer-brand">TechStar Repair Services</p>
      </div>
    </div>
  );
}
