import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const date = (value) =>
  value
    ? new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value))
    : 'Not set';

const priorityBadgeStyles = {
  URGENT: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  NORMAL: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function RequestTable({ requests }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
          <tr>
            <th className="px-4 py-3">Request</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Device</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Technician</th>
            <th className="px-4 py-3">Delivery</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.map((request) => {
            const pStyle =
              priorityBadgeStyles[request.priority] ||
              priorityBadgeStyles.NORMAL;
            return (
              <tr
                key={request.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-4 py-3.5">
                  <Link
                    className="font-bold text-tech-blue hover:underline block"
                    to={`/operator/requests/${request.id}`}
                  >
                    SR-{request.id}
                  </Link>
                  <span className="text-[11px] text-slate-400">
                    {date(request.created_at)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <strong className="block text-slate-800 font-semibold">
                    {request.customer?.name || 'Customer unavailable'}
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    {request.customer?.phone || request.customer?.email || ''}
                  </span>
                </td>
                <td className="px-4 py-3.5 max-w-[200px] truncate text-slate-600">
                  {request.device_info}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${pStyle}`}
                  >
                    {request.priority}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {request.technician?.name || 'Unassigned'}
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">
                  {date(request.expected_delivery_at)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    className="inline-flex items-center text-xs font-bold text-tech-blue hover:underline"
                    to={`/operator/requests/${request.id}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
