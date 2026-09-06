import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  description = "Are you sure you want to proceed with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary", // "primary" | "danger" | "amber"
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const buttonStyle =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : variant === "amber"
        ? "bg-amber-600 hover:bg-amber-700 text-white"
        : "bg-tech-blue hover:bg-blue-700 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-tech-line transition-all"
        role="dialog"
        aria-modal="true"
      >
        <button
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${
              variant === "danger"
                ? "bg-red-100 text-red-600"
                : variant === "amber"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-tech-blue-soft text-tech-blue"
            }`}
          >
            <AlertTriangle size={20} />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-tech-muted leading-relaxed">
              {description}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                type="button"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </button>
              <button
                className={`rounded-lg px-4 py-2 text-sm font-bold cursor-pointer transition disabled:opacity-50 ${buttonStyle}`}
                type="button"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? "Processing..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
