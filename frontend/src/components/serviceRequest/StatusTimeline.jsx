import { statusLabels } from './statusLabels';

const date = (value) =>
  value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '';

export default function StatusTimeline({ history = [] }) {
  if (!history.length)
    return <div className="text-xs text-slate-400 italic">No history recorded.</div>;

  const seenStatuses = new Set();
  const uniqueHistory = history.filter((item) => {
    const statusKey = item.new_status;
    if (!statusKey) return true;
    if (seenStatuses.has(statusKey)) return false;
    seenStatuses.add(statusKey);
    return true;
  });

  return (
    <div className="relative border-l-2 border-slate-100 pl-4 space-y-4 my-2">
      {uniqueHistory.map((item) => (
        <div className="relative group" key={item.id}>
          <span className="absolute -left-[21px] top-1 grid size-2.5 place-items-center rounded-full bg-tech-blue ring-4 ring-white" />
          <div className="text-xs">
            <strong className="block font-bold text-slate-800">
              {statusLabels[item.new_status] || item.new_status || 'Request update'}
            </strong>
            <p className="text-slate-600 my-0.5">{item.note || 'Status or progress updated'}</p>
            <small className="text-[11px] text-slate-400 font-medium">
              {date(item.created_at)} {item.changed_by ? `· ${item.changed_by}` : ''}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
