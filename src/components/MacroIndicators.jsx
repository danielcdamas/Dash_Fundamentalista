// Componente dedicado aos indicadores macroeconômicos brasileiros.
// Dá destaque para a taxa Selic, que pode ser atualizada manualmente
// por um campo simples na interface enquanto não há fetch da API real.

import { useEffect, useState } from 'react'
import { fetchMacroIndicators, CURRENT_SELIC } from '../services/macroApi'

export default function MacroIndicators() {
  // Selic em destaque — valor inicial fixo (15%), editável pela UI.
  const [selic, setSelic] = useState(CURRENT_SELIC)
  const [indicators, setIndicators] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        // >>> Aqui é onde o fetch real do BCB/SGS acontece (via macroApi.js).
        const data = await fetchMacroIndicators()
        if (active) setIndicators(data)

        // Futuramente, a Selic também virá do fetch real:
        // const selicReal = await fetchSelic()
        // if (active) setSelic(selicReal)
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
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-700">
          Indicadores Macroeconômicos
        </h2>
      </header>

      {/* Destaque: taxa Selic com campo de atualização simples */}
      <div className="mb-5 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white shadow">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium uppercase tracking-wide text-indigo-100">
            Taxa Selic (meta)
          </span>
          <span className="text-xs text-indigo-200">% a.a.</span>
        </div>

        <div className="mt-2 flex items-end gap-2">
          {/* Campo editável para atualização manual da Selic */}
          <input
            type="number"
            step="0.25"
            value={selic}
            onChange={(e) => setSelic(Number(e.target.value))}
            className="w-28 bg-transparent text-4xl font-bold outline-none [appearance:textfield] focus:border-b focus:border-indigo-300 [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Atualizar taxa Selic"
          />
          <span className="pb-1 text-2xl font-semibold text-indigo-100">%</span>
        </div>
        <p className="mt-2 text-xs text-indigo-200">
          Edite o valor acima para simular uma atualização da taxa.
        </p>
      </div>

      {/* Demais indicadores */}
      {loading ? (
        <p className="text-sm text-slate-500">Carregando indicadores…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {indicators.map((ind) => (
            <div
              key={ind.id}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <p className="text-xs text-slate-500">{ind.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-800">
                {ind.unit === 'R$' ? `${ind.unit} ` : ''}
                {ind.value.toLocaleString('pt-BR')}
                {ind.unit !== 'R$' ? ` ${ind.unit}` : ''}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{ind.hint}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
