import { ArrowLeft, Check, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { serviceRequestApi } from "../../services/serviceRequest.api";
import PublicNavbar from "../../components/layout/PublicNavbar";
import Footer from "../../components/layout/Footer";
import StatusBadge from "../../components/serviceRequest/StatusBadge";

const date = (value, withTime = false) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        ...(withTime ? { timeStyle: "short" } : {}),
      }).format(new Date(value))
    : "Not set";

export default function CustomerTracking() {
  const [requestId, setRequestId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      setResult(
        await serviceRequestApi.track(requestId.trim(), accessCode.trim()),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-tech-ink">
      <PublicNavbar />
      <main className="mx-auto max-w-[700px] px-6 py-16 max-sm:px-5 max-sm:py-12">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-tech-muted"
          to="/"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-[1.3px] text-tech-blue">
            Customer service access
          </span>
          <h1 className="my-4 text-[40px] font-bold tracking-tight max-sm:text-[34px]">
            Track your repair
          </h1>
          <p className="text-[15px] leading-7 text-tech-muted">
            Enter the request ID and six-digit code printed when your service
            request was created.
          </p>
        </div>
        <section className="mt-8 rounded-xl border border-tech-line bg-white p-7 shadow-xl shadow-slate-900/5 max-sm:p-5">
          <form
            className="grid grid-cols-2 gap-[18px] max-sm:grid-cols-1"
            onSubmit={submit}
          >
            <label className="flex flex-col gap-2 text-[13px] font-semibold text-slate-600">
              Request ID
              <input
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-tech-blue focus:ring-4 focus:ring-tech-blue-soft"
                required
                inputMode="numeric"
                value={requestId}
                onChange={(event) => setRequestId(event.target.value)}
                placeholder="Example: 1024"
              />
            </label>
            <label className="flex flex-col gap-2 text-[13px] font-semibold text-slate-600">
              Six-digit access code
              <input
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-tech-blue focus:ring-4 focus:ring-tech-blue-soft"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength="6"
                value={accessCode}
                onChange={(event) =>
                  setAccessCode(event.target.value.replace(/\D/g, ""))
                }
                placeholder="000000"
              />
            </label>
            {error && (
              <p className="col-span-full m-0 text-sm text-red-600">{error}</p>
            )}
            <button
              className="col-span-full flex h-11 items-center justify-center gap-2 rounded-lg border-0 bg-tech-blue !text-white text-sm font-bold disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              <Search size={16} />
              {loading ? "Finding request..." : "View service status"}
            </button>
          </form>
        </section>
        {result && (
          <section className="mt-8 rounded-xl border border-tech-line bg-white p-7 shadow-xl shadow-slate-900/5 max-sm:p-5">
            <div className="flex items-start justify-between gap-5 border-b border-tech-line pb-5 max-sm:block">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-[1.3px] text-tech-blue">
                  Service request #{result.request.id}
                </span>
                <h2 className="my-2 text-[22px] font-bold">
                  {result.request.device_info}
                </h2>
                <p className="m-0 text-sm text-tech-muted">
                  Last updated {date(result.request.updated_at, true)}
                </p>
              </div>
              <span className="max-sm:mt-4 max-sm:inline-flex">
                <StatusBadge status={result.request.status} />
              </span>
            </div>
            <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-5 border-b border-tech-line py-6 max-sm:grid-cols-1">
              <div>
                <span className="mb-1.5 block text-xs text-tech-muted">
                  Progress
                </span>
                <strong className="text-sm">{result.request.progress}%</strong>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <i
                    className="block h-full rounded-full bg-tech-blue"
                    style={{ width: `${result.request.progress}%` }}
                  />
                </div>
              </div>
              <div>
                <span className="mb-1.5 block text-xs text-tech-muted">
                  Expected delivery
                </span>
                <strong className="text-sm">
                  {date(result.request.expected_delivery_at)}
                </strong>
              </div>
              <div>
                <span className="mb-1.5 block text-xs text-tech-muted">
                  Priority
                </span>
                <strong className="text-sm">{result.request.priority}</strong>
              </div>
            </div>
            <div className="pt-5 space-y-1">
              {(() => {
                const seenStatuses = new Set();
                const uniqueHistory = (result.history || []).filter((item) => {
                  const statusKey = item.new_status;
                  if (!statusKey) return true;
                  if (seenStatuses.has(statusKey)) return false;
                  seenStatuses.add(statusKey);
                  return true;
                });

                if (uniqueHistory.length === 0) {
                  return (
                    <p className="text-xs text-tech-muted italic">
                      No status steps recorded yet.
                    </p>
                  );
                }

                return uniqueHistory.map((item) => (
                  <div className="flex gap-3 py-3 border-b border-slate-100 last:border-0" key={item.id}>
                    <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-tech-blue-soft text-tech-blue mt-0.5">
                      {item.new_status === result.request.status && (
                        <Check size={12} />
                      )}
                    </span>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">
                        {item.new_status?.replaceAll("_", " ")}
                      </strong>
                      <p className="my-0.5 text-xs text-tech-muted">
                        {item.note || "Request status updated"}
                      </p>
                      <small className="text-[11px] text-slate-400 font-medium">
                        {date(item.created_at, true)}
                      </small>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
