// Painel de análise fundamentalista de um ativo selecionável.
// Consome /api/fundamentals via fundamentalsApi.js (brapi no servidor) e a
// tabela manual de Tag Along. Campos indisponíveis na fonte aparecem como "—".

import { useEffect, useState } from 'react'
import { DEFAULT_TICKERS } from '../services/financeApi'
import { fetchFundamentals } from '../services/fundamentalsApi'
import SourceBadge from './SourceBadge'

// --- Formatadores ------------------------------------------------------------

const nf = (digits) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits })

// Valores monetários grandes: R$ 358,4 bi / R$ 70,1 mi.
function fmtMoney(v) {
  if (v == null) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e9) return `R$ ${nf(1).format(v / 1e9)} bi`
  if (abs >= 1e6) return `R$ ${nf(1).format(v / 1e6)} mi`
  return `R$ ${nf(2).format(v)}`
}

function fmtPct(v) {
  return v == null ? '—' : `${nf(1).format(v)}%`
}

function fmtRatio(v) {
  return v == null ? '—' : `${nf(2).format(v)}x`
}

// Tempo de IPO: "32 anos (1993)".
function fmtIpo(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  const years = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 3600e3))
  return `${years} anos (${date.getFullYear()})`
}

// Configuração dos cards exibidos (ordem da grade).
const METRICS = [
  { key: 'marketCap', label: 'Valor de mercado', fmt: fmtMoney, hint: 'Preço × total de ações' },
  { key: 'ipoDate', label: 'Tempo de IPO', fmt: fmtIpo, hint: 'Desde o primeiro pregão' },
  { key: 'pl', label: 'P/L', fmt: fmtRatio, hint: 'Preço / lucro por ação' },
  { key: 'pvp', label: 'P/VP', fmt: fmtRatio, hint: 'Preço / valor patrimonial' },
  { key: 'tagAlong', label: 'Tag Along', fmt: fmtPct, hint: 'Proteção ao minoritário', source: 'manual' },
  { key: 'earningsYield', label: 'Earning Yield', fmt: fmtPct, hint: 'Inverso do P/L (L/P)' },
  { key: 'netMargin', label: 'Margem Líquida', fmt: fmtPct, hint: 'Lucro líquido / receita' },
  { key: 'roe', label: 'ROE', fmt: fmtPct, hint: 'Retorno sobre o patrimônio' },
  { key: 'netIncomeCagr', label: 'CAGR Lucro Líquido', fmt: fmtPct, hint: 'Crescimento anual composto' },
  { key: 'netDebtToEbitda', label: 'Dív. Líquida/EBITDA', fmt: fmtRatio, hint: 'Alavancagem financeira' },
  { key: 'ebit', label: 'EBIT', fmt: fmtMoney, hint: 'Lucro operacional' },
]

export default function FundamentalsPanel() {
  const [ticker, setTicker] = useState(DEFAULT_TICKERS[0])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      const res = await fetchFundamentals(ticker)
      if (active) {
        setResult(res)
        setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [ticker])

  const data = result?.data

  return (
    <section className="rounded-2xl bg-slate-50 p-5 lg:col-span-2">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-700">
            Análise Fundamentalista
          </h2>
          {!loading && result && <SourceBadge source={result.source} />}
        </div>

        {/* Seletor do ativo analisado */}
        <select
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500"
          aria-label="Selecionar ativo"
        >
          {DEFAULT_TICKERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </header>

      {loading && <p className="text-sm text-slate-500">Carregando fundamentos…</p>}

      {!loading && !data && (
        <p className="text-sm text-negative">
          Não foi possível carregar os fundamentos de {ticker}.
        </p>
      )}

      {!loading && data && (
        <>
          <p className="mb-4 text-sm text-slate-500">{data.name}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {METRICS.map((m) => (
              <div
                key={m.key}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs text-slate-500">{m.label}</p>
                  {m.source === 'manual' && <SourceBadge source="manual" />}
                </div>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {m.fmt(data[m.key])}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{m.hint}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            "—" indica dado não disponível na fonte para este ativo. Tag Along é
            mantido manualmente (não há API gratuita para esse dado).
          </p>
        </>
      )}
    </section>
  )
}
