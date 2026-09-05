import { Bell, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { connectOperatorSocket } from "../../sockets/serviceRequest.socket";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  useEffect(
    () =>
      connectOperatorSocket({
        "serviceRequest:created": ({ serviceRequest }) =>
          setNotifications((current) =>
            [
              {
                id: `created-${serviceRequest.id}`,
                text: `New request SR-${serviceRequest.id} was created`,
                time: new Date(),
              },
              ...current,
            ].slice(0, 5),
          ),
        "serviceRequest:assigned": ({ serviceRequest }) =>
          setNotifications((current) =>
            [
              {
                id: `assigned-${serviceRequest.id}`,
                text: `Technician assigned to SR-${serviceRequest.id}`,
                time: new Date(),
              },
              ...current,
            ].slice(0, 5),
          ),
        "serviceRequest:statusUpdated": ({ serviceRequest }) =>
          setNotifications((current) =>
            [
              {
                id: `status-${serviceRequest.id}-${serviceRequest.updated_at}`,
                text: `SR-${serviceRequest.id} status changed to ${serviceRequest.status}`,
                time: new Date(),
              },
              ...current,
            ].slice(0, 5),
          ),
      }),
    [],
  );
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-tech-line bg-white px-9 max-sm:px-4">
      <div className="hidden text-[17px] font-extrabold max-sm:block">
        Tech<span className="text-amber-600">Star</span>
      </div>
      <label className="flex h-[38px] w-80 items-center gap-2 rounded-lg border border-tech-line bg-slate-50 px-3 text-slate-400 max-sm:hidden">
        <Search size={17} />
        <input
          className="w-full border-0 bg-transparent text-xs outline-none"
          placeholder="Search service requests..."
        />
      </label>
      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            className="relative border-0 bg-transparent text-slate-500"
            aria-label="Notifications"
            onClick={() => setOpen((current) => !current)}
          >
            <Bell size={19} />
            {notifications.length > 0 && (
              <i className="absolute right-0 top-0 size-1.5 rounded-full bg-amber-500" />
            )}
          </button>
          {open && (
            <div className="absolute right-[-8px] top-9 z-10 w-[290px] rounded-xl border border-tech-line bg-white p-3.5 shadow-xl shadow-slate-900/10">
              <div className="flex items-center justify-between border-b border-tech-line pb-2.5 text-xs">
                <strong>Notifications</strong>
                <button
                  className="border-0 bg-transparent text-slate-400"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                >
                  <X size={14} />
                </button>
              </div>
              {notifications.length ? (
                notifications.map((item) => (
                  <div
                    className="flex gap-2 border-b border-slate-100 px-0.5 py-3 text-xs leading-5 text-slate-600"
                    key={item.id}
                  >
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-tech-blue" />
                    <span>{item.text}</span>
                  </div>
                ))
              ) : (
                <p className="my-3.5 text-xs text-tech-muted">
                  You are all caught up.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="grid size-8 place-items-center rounded-full bg-tech-blue-soft text-[10px] text-tech-blue">
            OP
          </span>
          <span className="max-sm:hidden">Operator</span>
        </div>
      </div>
    </header>
  );
}
