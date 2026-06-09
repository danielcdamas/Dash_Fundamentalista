// ---------------------------------------------------------------------------
// Camada de serviço de dados financeiros (ativos / portfólio).
//
// A cotação real vem da brapi.dev, mas o navegador NÃO fala com a brapi
// diretamente: ele chama a função serverless `/api/quote` (ver api/quote.js),
// que guarda o token no servidor (process.env.BRAPI_TOKEN, SEM prefixo VITE_).
// Assim o token nunca é exposto no bundle do frontend — e ainda evita CORS,
// já que a chamada é para a mesma origem.
//
// Em caso de falha (token ausente no servidor, offline, etc.), o serviço faz
// FALLBACK automático para dados mockados. O retorno informa a origem (`source`).
//
// Obs.: em desenvolvimento local com `npm run dev` (Vite puro) a rota /api não
// existe — a chamada falha e cai no mock. Para exercitar a função localmente,
// use `vercel dev`.
// ---------------------------------------------------------------------------

// Tickers monitorados por padrão no dashboard.
export const DEFAULT_TICKERS = ['ITUB4', 'VALE3']

// Dados mockados usados como fallback (mesmo formato já normalizado).
const MOCK_QUOTES = {
  ITUB4: { ticker: 'ITUB4', name: 'Itaú Unibanco PN', price: 36.42, changePercent: 0.85, currency: 'BRL' },
  VALE3: { ticker: 'VALE3', name: 'Vale ON', price: 58.17, changePercent: -1.23, currency: 'BRL' },
}

function mockResult(tickers) {
  return {
    source: 'mock',
    data: tickers.map((t) => MOCK_QUOTES[t]).filter(Boolean),
  }
}

/**
 * Busca as cotações dos tickers via proxy serverless `/api/quote`.
 * Em caso de falha, retorna dados mockados.
 *
 * @param {string[]} tickers - ex: ['ITUB4', 'VALE3']
 * @returns {Promise<{source: 'live'|'mock', data: Array}>}
 */
export async function fetchPortfolio(tickers = DEFAULT_TICKERS) {
  try {
    const res = await fetch(`/api/quote?tickers=${tickers.join(',')}`)
    if (!res.ok) throw new Error(`proxy /api/quote respondeu ${res.status}`)

    const json = await res.json()
    const data = json.data ?? []

    // Sem resultados válidos (ex.: token ausente no servidor) -> fallback.
    if (data.length === 0) return mockResult(tickers)

    return { source: 'live', data }
  } catch (err) {
    // Falha de rede / rota inexistente (dev local) -> degrada para o mock.
    console.warn('[financeApi] usando fallback mockado:', err.message)
    return mockResult(tickers)
  }
}
