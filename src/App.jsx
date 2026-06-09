// Layout principal do Dashboard de Análise Fundamentalista.
// Organiza os blocos em um grid responsivo focado em visualização rápida.

import PortfolioSummary from './components/PortfolioSummary'
import MacroIndicators from './components/MacroIndicators'
import FundamentalsPanel from './components/FundamentalsPanel'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Cabeçalho */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Dash Fundamentalista
          </h1>
          <p className="text-sm text-slate-500">
            Monitoramento de ativos e indicadores macroeconômicos
          </p>
        </div>
      </header>

      {/* Conteúdo: grid responsivo (1 coluna no mobile, 2 colunas no desktop) */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PortfolioSummary />
          <MacroIndicators />
          {/* Painel de fundamentos ocupa a largura inteira da grade */}
          <FundamentalsPanel />
        </div>
      </main>

      {/* Rodapé */}
      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2">
        <p className="text-center text-xs text-slate-400">
          Dados via brapi.dev, Banco Central (SGS) e AwesomeAPI — com fallback
          simulado quando uma fonte está indisponível.
        </p>
      </footer>
    </div>
  )
}
