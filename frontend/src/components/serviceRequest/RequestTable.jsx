import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

const date = (value) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Not set'

export default function RequestTable({ requests }) {
  return <div className="table-wrap"><table><thead><tr><th>Request</th><th>Customer</th><th>Device</th><th>Priority</th><th>Status</th><th>Technician</th><th>Delivery</th><th /></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td><Link className="request-link" to={`/operator/requests/${request.id}`}>SR-{request.id}</Link><small>{date(request.created_at)}</small></td><td><strong>{request.customer?.name || 'Customer unavailable'}</strong><small>{request.customer?.phone || request.customer?.email || ''}</small></td><td className="truncate">{request.device_info}</td><td><span className={`priority priority-${request.priority?.toLowerCase()}`}>{request.priority}</span></td><td><StatusBadge status={request.status} /></td><td>{request.technician?.name || 'Unassigned'}</td><td>{date(request.expected_delivery_at)}</td><td><Link className="text-action" to={`/operator/requests/${request.id}`}>View</Link></td></tr>)}</tbody></table></div>
}
