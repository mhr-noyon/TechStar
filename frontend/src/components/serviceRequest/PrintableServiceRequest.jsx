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
      className="hidden print:block mx-auto w-full max-w-[600px] p-5 font-sans text-[#17212b]"
    >
      {" "}
      {/* Header */}{" "}
      <div className="flex items-center justify-between">
        {" "}
        <div className="flex items-center gap-2.5 text-[22px] font-extrabold">
          {" "}
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1769aa] text-xs font-extrabold text-white">
            {" "}
            TS{" "}
          </div>{" "}
          <span>
            {" "}
            Tech<span className="text-[#e49433]">Star</span>{" "}
          </span>{" "}
        </div>{" "}
        <div className="text-sm font-semibold text-[#697784]">
          {" "}
          Service Request Slip{" "}
        </div>{" "}
      </div>{" "}
      <hr className="my-3.5 border-0 border-t border-[#d5dbe0]" />{" "}
      {/* Access Code */}{" "}
      <div className="py-4 text-center">
        {" "}
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[1.5px] text-[#697784]">
          {" "}
          Customer Access Code{" "}
        </div>{" "}
        <div className="my-2 font-mono text-4xl font-extrabold tracking-[6px] text-[#1769aa]">
          {" "}
          {request.customer_access_code || "N/A"}{" "}
        </div>{" "}
        <div className="text-xs text-[#697784]">
          {" "}
          Request ID:{" "}
          <strong className="font-bold text-[#17212b]">
            {" "}
            SR-{request.id}{" "}
          </strong>{" "}
        </div>{" "}
      </div>{" "}
      <hr className="my-3.5 border-0 border-t border-[#d5dbe0]" />{" "}
      {/* Customer Information */}{" "}
      <table className="my-1 w-full border-collapse text-left">
        {" "}
        <tbody>
          {" "}
          <tr>
            {" "}
            <td className="w-[140px] whitespace-nowrap border-b border-[#eef1f4] py-1.5 text-xs font-semibold text-[#697784]">
              {" "}
              Customer{" "}
            </td>{" "}
            <td className="border-b border-[#eef1f4] py-1.5 text-xs">
              {" "}
              {request.customer?.name || "—"}{" "}
            </td>{" "}
          </tr>{" "}
          <tr>
            {" "}
            <td className="w-[140px] whitespace-nowrap border-b border-[#eef1f4] py-1.5 text-xs font-semibold text-[#697784]">
              {" "}
              Phone{" "}
            </td>{" "}
            <td className="border-b border-[#eef1f4] py-1.5 text-xs">
              {" "}
              {request.customer?.phone || "—"}{" "}
            </td>{" "}
          </tr>{" "}
          <tr>
            {" "}
            <td className="w-[140px] whitespace-nowrap border-b border-[#eef1f4] py-1.5 text-xs font-semibold text-[#697784]">
              {" "}
              Email{" "}
            </td>{" "}
            <td className="border-b border-[#eef1f4] py-1.5 text-xs">
              {" "}
              {request.customer?.email || " — "}
            </td>{" "}
          </tr>
        </tbody>
      </table>{" "}
      <hr className="my-3.5 border-0 border-t border-[#d5dbe0]" />{" "}
      {/* Device & Problem */}{" "}
      <table className="my-1 w-full border-collapse text-left">
        {" "}
        <tbody>
          {" "}
          <tr>
            {" "}
            <td className="w-[140px] whitespace-nowrap border-b border-[#eef1f4] py-1.5 align-top text-xs font-semibold text-[#697784]">
              {" "}
              Device{" "}
            </td>{" "}
            <td className="border-b border-[#eef1f4] py-1.5 align-top text-xs">
              {" "}
              {request.device_info || "—"}{" "}
            </td>{" "}
          </tr>{" "}
          <tr>
            {" "}
            <td className="w-[140px] whitespace-nowrap border-b border-[#eef1f4] py-1.5 align-top text-xs font-semibold text-[#697784]">
              {" "}
              Problem{" "}
            </td>{" "}
            <td className="border-b border-[#eef1f4] py-1.5 align-top text-xs leading-relaxed">
              {" "}
              {request.problem_description || "—"}{" "}
            </td>{" "}
          </tr>{" "}
          <tr>
            {" "}
            <td className="w-[140px] whitespace-nowrap border-b border-[#eef1f4] py-1.5 text-xs font-semibold text-[#697784]">
              {" "}
              Status{" "}
            </td>{" "}
            <td className="border-b border-[#eef1f4] py-1.5 text-xs">
              {" "}
              {(request.status || "").replaceAll("_", " ")}{" "}
            </td>{" "}
          </tr>{" "}
        </tbody>{" "}
      </table>{" "}
      <hr className="my-3.5 border-0 border-t border-[#d5dbe0]" /> {/* Dates */}{" "}
      <table className="my-1 w-full border-collapse text-left">
        {" "}
        <tbody>
          {" "}
          <tr>
            {" "}
            <td className="w-[140px] whitespace-nowrap border-b border-[#eef1f4] py-1.5 text-xs font-semibold text-[#697784]">
              {" "}
              Created{" "}
            </td>{" "}
            <td className="border-b border-[#eef1f4] py-1.5 text-xs">
              {" "}
              {fmt(request.created_at, true)}{" "}
            </td>{" "}
          </tr>{" "}
          <tr>
            {" "}
            <td className="w-[140px] whitespace-nowrap border-b border-[#eef1f4] py-1.5 text-xs font-semibold text-[#697784]">
              {" "}
              Expected Delivery{" "}
            </td>{" "}
            <td className="border-b border-[#eef1f4] py-1.5 text-xs">
              {" "}
              {fmt(request.expected_delivery_at)}{" "}
            </td>{" "}
          </tr>{" "}
          {isCompleted && (
            <>
              {" "}
              <tr>
                {" "}
                <td className="w-[140px] whitespace-nowrap border-b border-[#eef1f4] py-1.5 text-xs font-semibold text-[#697784]">
                  {" "}
                  Completed{" "}
                </td>{" "}
                <td className="border-b border-[#eef1f4] py-1.5 text-xs">
                  {" "}
                  {fmt(request.completed_at, true)}{" "}
                </td>{" "}
              </tr>{" "}
              <tr>
                {" "}
                <td className="w-[140px] whitespace-nowrap py-1.5 text-xs font-semibold text-[#697784]">
                  {" "}
                  Payment Amount{" "}
                </td>{" "}
                <td className="py-1.5 text-xs font-semibold">
                  {" "}
                  {request.payment_amount !== null &&
                  request.payment_amount !== undefined
                    ? `৳ ${Number(request.payment_amount).toLocaleString("en-BD")}`
                    : "—"}{" "}
                </td>{" "}
              </tr>{" "}
            </>
          )}{" "}
        </tbody>{" "}
      </table>{" "}
      {/* Footer */}{" "}
      <div className="mt-5 border-t-2 border-[#1769aa] pt-3 text-center text-[11px] text-[#697784]">
        {" "}
        <p className="my-1">
          {" "}
          Use Request ID{" "}
          <strong className="text-[#17212b]">- {request.id}</strong> and Access
          Code{" "}
          <strong className="text-[#17212b]">
            {" "}
            {request.customer_access_code}{" "}
          </strong>{" "}
          to track your repair online.{" "}
        </p>{" "}
        <p className="mt-1.5 text-xs font-extrabold text-[#1769aa]">
          {" "}
          TechStar Repair Services{" "}
        </p>{" "}
      </div>{" "}
    </div>
  );
}
