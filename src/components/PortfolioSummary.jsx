// Componente de resumo do portfólio.
// Consome a camada de serviço (financeApi.js) que hoje devolve dados mockados
// e, no futuro, fará o fetch de uma API financeira real.

import { useEffect, useState } from 'react'
import { fetchPortfolio, DEFAULT_TICKERS } from '../services/financeApi'
import AssetCard from './AssetCard'

export default function PortfolioSummary() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        // >>> Aqui é onde a chamada à API real acontece (via financeApi.js).
        const data = await fetchPortfolio(DEFAULT_TICKERS)
        if (active) setAssets(data)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="rounded-2xl bg-slate-50 p-5">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-700">
          Resumo do Portfólio
        </h2>
        <span className="text-xs text-slate-400">Dados simulados</span>
      </header>

      {loading && (
        <p className="text-sm text-slate-500">Carregando cotações…</p>
      )}

      {error && (
        <p className="text-sm text-negative">Erro ao carregar: {error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assets.map((asset) => (
            <AssetCard key={asset.ticker} asset={asset} />
          ))}
        </div>
      )}
    </section>
  )
}
