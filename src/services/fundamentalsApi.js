// ---------------------------------------------------------------------------
// Camada de serviço de fundamentos de um ativo.
//
// Os dados vêm de DUAS fontes combinadas:
//   1. /api/fundamentals (brapi via servidor) -> Valor de mercado, P/L, P/VP,
//      Margem Líquida, ROE, Earning Yield, etc.
//   2. CVM (dados abertos) -> EBIT, CAGR do lucro, dívida líquida e "listado
//      desde", que o plano gratuito da brapi não entrega. Esses valores são
//      pré-processados pelo script `npm run fetch:cvm` e ficam em
//      src/data/cvmFundamentals.json (commitado no repo).
//
// A CVM apenas PREENCHE LACUNAS: se a brapi já trouxe o campo, ele prevalece.
//
// TAG ALONG: não existe API gratuita (é dado de governança da B3), então
// mantemos uma tabela manual abaixo — muda raramente.
//
// Falha de rede / token ausente degrada para dados mockados, sem quebrar a UI.
// ---------------------------------------------------------------------------

import cvm from '../data/cvmFundamentals.json'

// Tabela manual de Tag Along (% estendido aos minoritários na venda do
// controle). Atualizar manualmente em eventos societários.
export const TAG_ALONG = {
  ITUB4: 80, // PN — tag along de 80%
  VALE3: 100, // ON, Novo Mercado — 100%
}

// Fundamentos mockados usados como fallback (valores ilustrativos).
const MOCK_FUNDAMENTALS = {
  ITUB4: {
    ticker: 'ITUB4', name: 'Itaú Unibanco PN', marketCap: 358e9, ipoDate: null,
    pl: 9.8, pvp: 1.9, earningsYield: 10.2, netMargin: 21.5, roe: 21.0,
    netIncomeCagr: 12.4, netDebtToEbitda: null, ebit: null,
  },
  VALE3: {
    ticker: 'VALE3', name: 'Vale ON', marketCap: 330e9, ipoDate: null,
    pl: 6.1, pvp: 1.4, earningsYield: 16.4, netMargin: 18.7, roe: 23.5,
    netIncomeCagr: 8.9, netDebtToEbitda: 0.5, ebit: 70e9,
  },
}

function withTagAlong(data) {
  return { ...data, tagAlong: TAG_ALONG[data.ticker] ?? null }
}

// Normaliza a data da CVM para ISO (o cadastro usa AAAA-MM-DD; alguns
// arquivos antigos usam DD/MM/AAAA), para o cálculo de "tempo de IPO".
function cvmDateToIso(d) {
  if (!d) return null
  const s = String(d)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return `${s.slice(0, 10)}T00:00:00.000Z`
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[2]}-${m[1]}T00:00:00.000Z` : null
}

// Preenche, com dados da CVM, apenas os campos que vieram vazios da brapi.
function overlayCvm(data) {
  const c = cvm?.data?.[data.ticker]
  if (!c) return data
  return {
    ...data,
    ebit: data.ebit ?? c.ebit ?? null,
    netIncomeCagr: data.netIncomeCagr ?? c.netIncomeCagr ?? null,
    netDebtToEbitda: data.netDebtToEbitda ?? c.netDebtToEbitda ?? null,
    ipoDate: data.ipoDate ?? cvmDateToIso(c.listedSince),
  }
}

/**
 * Busca os fundamentos de um ticker via proxy serverless /api/fundamentals,
 * combinando com os dados pré-processados da CVM. Em caso de falha, usa mock.
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

    return { source: 'live', data: overlayCvm(withTagAlong(json.data)) }
  } catch (err) {
    console.warn('[fundamentalsApi] usando fallback mockado:', err.message)
    const mock = MOCK_FUNDAMENTALS[ticker]
    return mock
      ? { source: 'mock', data: overlayCvm(withTagAlong(mock)) }
      : { source: 'mock', data: null }
  }
}
