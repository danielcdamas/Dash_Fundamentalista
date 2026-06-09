// Pequeno selo que indica a origem do dado exibido:
//   - 'live' -> dado real, vindo de uma API
//   - 'mock' -> dado simulado (fallback)

export default function SourceBadge({ source, className = '' }) {
  const isLive = source === 'live'
  const color = isLive
    ? 'bg-positive/10 text-positive'
    : 'bg-slate-200 text-slate-500'
  const dot = isLive ? 'bg-positive' : 'bg-slate-400'
  const label = isLive ? 'ao vivo' : 'simulado'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${color} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
