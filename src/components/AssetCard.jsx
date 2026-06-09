// Card individual de um ativo dentro do resumo de portfólio.
// Recebe os dados já normalizados pela camada de serviço (financeApi.js).

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export default function AssetCard({ asset }) {
  const isUp = asset.changePercent >= 0
  const changeColor = isUp ? 'text-positive' : 'text-negative'
  const arrow = isUp ? '▲' : '▼'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-800">{asset.ticker}</p>
          <p className="text-xs text-slate-500">{asset.name}</p>
        </div>
        <span className={`text-sm font-medium ${changeColor}`}>
          {arrow} {Math.abs(asset.changePercent).toFixed(2)}%
        </span>
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {brl.format(asset.price)}
      </p>
    </div>
  )
}
