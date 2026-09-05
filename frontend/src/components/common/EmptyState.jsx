export default function EmptyState({ title = 'Nothing here yet', description = 'New records will appear here.' }) {
  return <div className="empty-state"><strong>{title}</strong><span>{description}</span></div>
}
