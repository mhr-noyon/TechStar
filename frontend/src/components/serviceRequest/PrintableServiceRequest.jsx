export default function PrintableServiceRequest({ request }) {
  if (!request) return null;
  const isCompleted = request.status === "COMPLETED";
  const fmt = (value, withTime = false) =>
    value
      ? new Intl.DateTimeFormat("en", {
          dateStyle: "medium",
          ...(withTime ? { timeStyle: "short" } : {}),
        }).format(new Date(value))
      : "—";

  return (
    <div
      aria-hidden="true"
      className="hidden print:block mx-auto w-full max-w-[650px] p-6 font-sans text-slate-900 bg-white [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[21px] font-extrabold tracking-tight">
          <span
            className="grid size-[29px] place-items-center rounded-lg bg-tech-blue text-[11px] font-extrabold text-white"
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
          >
            TS
          </span>
          <span>
            Tech<span className="text-amber-600">Star</span>
          </span>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Service Request Slip
        </div>
      </div>

      <hr className="my-4 border-slate-200" />

      {/* Access Code */}
      <div className="py-3 text-center bg-slate-50/80 rounded-xl border border-slate-200">
        <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">
          Customer Access Code
        </div>
        <div className="my-1.5 font-mono text-3xl font-black tracking-[6px] text-tech-blue">
          {request.customer_access_code || "N/A"}
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Request ID: <strong className="font-bold text-slate-900">SR-{request.id}</strong>
        </div>
      </div>

      <hr className="my-4 border-slate-200" />

      {/* Customer Information */}
      <table className="w-full border-collapse text-left text-xs">
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="w-36 py-2 font-bold uppercase tracking-wider text-slate-400">
              Customer
            </td>
            <td className="py-2 font-semibold text-slate-800">
              {request.customer?.name || "—"}
            </td>
          </tr>
          <tr>
            <td className="w-36 py-2 font-bold uppercase tracking-wider text-slate-400">
              Phone
            </td>
            <td className="py-2 font-semibold text-slate-800">
              {request.customer?.phone || "—"}
            </td>
          </tr>
          <tr>
            <td className="w-36 py-2 font-bold uppercase tracking-wider text-slate-400">
              Email
            </td>
            <td className="py-2 font-semibold text-slate-800">
              {request.customer?.email || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <hr className="my-4 border-slate-200" />

      {/* Device & Problem */}
      <table className="w-full border-collapse text-left text-xs">
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="w-36 py-2 align-top font-bold uppercase tracking-wider text-slate-400">
              Device
            </td>
            <td className="py-2 align-top font-semibold text-slate-800">
              {request.device_info || "—"}
            </td>
          </tr>
          <tr>
            <td className="w-36 py-2 align-top font-bold uppercase tracking-wider text-slate-400">
              Problem
            </td>
            <td className="py-2 align-top font-medium text-slate-700 leading-relaxed">
              {request.problem_description || "—"}
            </td>
          </tr>
          <tr>
            <td className="w-36 py-2 font-bold uppercase tracking-wider text-slate-400">
              Status
            </td>
            <td className="py-2 font-bold text-tech-blue">
              {(request.status || "").replaceAll("_", " ")}
            </td>
          </tr>
        </tbody>
      </table>

      <hr className="my-4 border-slate-200" />

      {/* Dates */}
      <table className="w-full border-collapse text-left text-xs">
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="w-36 py-2 font-bold uppercase tracking-wider text-slate-400">
              Created
            </td>
            <td className="py-2 font-semibold text-slate-800">
              {fmt(request.created_at, true)}
            </td>
          </tr>
          <tr>
            <td className="w-36 py-2 font-bold uppercase tracking-wider text-slate-400">
              Expected Delivery
            </td>
            <td className="py-2 font-semibold text-slate-800">
              {fmt(request.expected_delivery_at)}
            </td>
          </tr>
          {isCompleted && (
            <>
              <tr>
                <td className="w-36 py-2 font-bold uppercase tracking-wider text-slate-400">
                  Completed
                </td>
                <td className="py-2 font-semibold text-slate-800">
                  {fmt(request.completed_at, true)}
                </td>
              </tr>
              <tr>
                <td className="w-36 py-2 font-bold uppercase tracking-wider text-slate-400">
                  Payment Amount
                </td>
                <td className="py-2 font-extrabold text-slate-900">
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

      {/* Footer */}
      <div className="mt-6 border-t-2 border-tech-blue pt-3 text-center text-[11px] text-slate-500">
        <p className="my-1">
          Use Request ID <strong className="text-slate-900">SR-{request.id}</strong> and Access
          Code <strong className="text-slate-900">{request.customer_access_code}</strong> to track your repair online.
        </p>
        <p className="mt-1.5 text-xs font-extrabold text-tech-blue">
          TechStar Repair Services
        </p>
      </div>
    </div>
  );
}
