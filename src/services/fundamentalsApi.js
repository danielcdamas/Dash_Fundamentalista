// ---------------------------------------------------------------------------
// Camada de serviço de fundamentos de um ativo.
//
// Os dados vêm da função serverless /api/fundamentals (ver api/fundamentals.js),
// que consulta a brapi.dev com o token guardado no servidor e já devolve os
// indicadores derivados calculados (Earning Yield, Dív.Líq/EBITDA, CAGR).
//
// TAG ALONG: não existe API gratuita com esse dado (é informação de
// governança da B3), então mantemos uma tabela manual abaixo — o valor muda
// raramente (só em eventos societários). Fonte: B3 / estatuto das companhias.
//
// Como nos demais serviços, falha de rede ou token ausente degrada para
// dados mockados (`source: 'mock'`), sem quebrar a interface.
// ---------------------------------------------------------------------------

// Tabela manual de Tag Along (% do valor pago ao controlador estendido às
// demais ações em caso de venda do controle). Atualizar manualmente.
export const TAG_ALONG = {
  ITUB4: 80, // PN — tag along de 80%
  VALE3: 100, // ON, Novo Mercado — 100%
}

// Fundamentos mockados usados como fallback (valores ilustrativos).
const MOCK_FUNDAMENTALS = {
  ITUB4: {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco PN',
    marketCap: 358e9,
    ipoDate: null,
    pl: 9.8,
    pvp: 1.9,
    earningsYield: 10.2,
    netMargin: 21.5,
    roe: 21.0,
    netIncomeCagr: 12.4,
    netDebtToEbitda: null, // métrica não se aplica bem a bancos
    ebit: null,
  },
  VALE3: {
    ticker: 'VALE3',
    name: 'Vale ON',
    marketCap: 330e9,
    ipoDate: null,
    pl: 6.1,
    pvp: 1.4,
    earningsYield: 16.4,
    netMargin: 18.7,
    roe: 23.5,
    netIncomeCagr: 8.9,
    netDebtToEbitda: 0.5,
    ebit: 70e9,
  },
}

function withTagAlong(data) {
  return { ...data, tagAlong: TAG_ALONG[data.ticker] ?? null }
}

/**
 * Busca os fundamentos de um ticker via proxy serverless /api/fundamentals.
 * Em caso de falha, retorna dados mockados.
 *
 * @param {string} ticker - ex: 'ITUB4'
 * @returns {Promise<{source: 'live'|'mock', data: object}>}
 */
export async function fetchFundamentals(ticker) {
  try {
    const res = await fetch(`/api/fundamentals?ticker=${ticker}`)
    if (!res.ok) throw new Error(`proxy /api/fundamentals respondeu ${res.status}`)

    const json = await res.json()
    if (!json.data) throw new Error('resposta sem dados')

    return { source: 'live', data: withTagAlong(json.data) }
  } catch (err) {
    console.warn('[fundamentalsApi] usando fallback mockado:', err.message)
    const mock = MOCK_FUNDAMENTALS[ticker]
    return mock
      ? { source: 'mock', data: withTagAlong(mock) }
      : { source: 'mock', data: null }
  }
}
