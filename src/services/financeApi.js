// ---------------------------------------------------------------------------
// Camada de serviço de dados financeiros (ativos / portfólio).
//
// Integração REAL com a API gratuita da brapi.dev (cotações da B3).
// Caso a chamada falhe (sem token, offline, CORS, etc.), o serviço faz
// FALLBACK automático para dados mockados, garantindo que a interface
// nunca quebre. O retorno informa a origem do dado (`source`).
//
// >>> CONFIGURAÇÃO DA API REAL <<<
// 1. Crie um token gratuito em https://brapi.dev (Dashboard -> Token).
// 2. Defina a variável de ambiente VITE_BRAPI_TOKEN:
//      - localmente: arquivo .env.local  ->  VITE_BRAPI_TOKEN=seu_token
//      - na Vercel:  Project Settings -> Environment Variables
// Sem o token, o app continua funcionando com os dados mockados.
// ---------------------------------------------------------------------------

// Tickers monitorados por padrão no dashboard.
export const DEFAULT_TICKERS = ['ITUB4', 'VALE3']

// Token lido das variáveis de ambiente do Vite (opcional).
const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN

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
 * Busca as cotações dos tickers informados na API real (brapi.dev).
 * Em caso de falha, retorna dados mockados.
 *
 * @param {string[]} tickers - ex: ['ITUB4', 'VALE3']
 * @returns {Promise<{source: 'live'|'mock', data: Array}>}
 */
export async function fetchPortfolio(tickers = DEFAULT_TICKERS) {
  // Sem token configurado: usa mock direto (evita um 401 desnecessário).
  if (!BRAPI_TOKEN) {
    return mockResult(tickers)
  }

  try {
    const url = `https://brapi.dev/api/quote/${tickers.join(',')}?token=${BRAPI_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`brapi respondeu ${res.status}`)

    const json = await res.json()
    const data = (json.results ?? []).map((r) => ({
      ticker: r.symbol,
      name: r.longName ?? r.shortName ?? r.symbol,
      price: r.regularMarketPrice,
      changePercent: r.regularMarketChangePercent ?? 0,
      currency: r.currency ?? 'BRL',
    }))

    // Se a API não devolveu nenhum resultado válido, cai no fallback.
    if (data.length === 0) return mockResult(tickers)

    return { source: 'live', data }
  } catch (err) {
    // Falha de rede/CORS/token -> degrada para os dados mockados.
    console.warn('[financeApi] usando fallback mockado:', err.message)
    return mockResult(tickers)
  }
}
