import { statusLabels } from './statusLabels'

const date = (value) => value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : ''

export default function StatusTimeline({ history = [] }) {
  if (!history.length) return <div className="muted">No history recorded.</div>
  return <div className="timeline">{history.map((item) => <div className="timeline-item" key={item.id}><span className="timeline-dot" /><div><strong>{statusLabels[item.new_status] || item.new_status || 'Request update'}</strong><p>{item.note || 'Status or progress updated'}</p><small>{date(item.created_at)} · {item.changed_by}</small></div></div>)}</div>
}
