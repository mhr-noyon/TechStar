import { statusLabels } from './statusLabels'

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status?.toLowerCase()}`}>{statusLabels[status] || status || 'Unassigned'}</span>
}
