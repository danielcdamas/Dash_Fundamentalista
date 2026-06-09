// Pequeno selo que indica a origem do dado exibido:
//   - 'live'   -> dado real, vindo de uma API
//   - 'mock'   -> dado simulado (fallback)
//   - 'manual' -> dado mantido à mão no código (ex.: Tag Along)

const VARIANTS = {
  live: { box: 'bg-positive/10 text-positive', dot: 'bg-positive', label: 'ao vivo' },
  mock: { box: 'bg-slate-200 text-slate-500', dot: 'bg-slate-400', label: 'simulado' },
  manual: { box: 'bg-sky-100 text-sky-600', dot: 'bg-sky-500', label: 'manual' },
}

export default function SourceBadge({ source, className = '' }) {
  const v = VARIANTS[source] ?? VARIANTS.mock

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${v.box} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
      {v.label}
    </span>
  )
}
