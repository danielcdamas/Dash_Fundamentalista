// ---------------------------------------------------------------------------
// Camada de serviço de indicadores macroeconômicos brasileiros.
//
// Integração REAL com APIs públicas e gratuitas (sem necessidade de token):
//   - Banco Central / SGS          -> Selic (432), IPCA 12m (13522), CDI (4389)
//   - Banco Central / Expectativas -> PIB (mediana do mercado, Focus)
//   - AwesomeAPI                   -> Dólar (USD-BRL)
//
// Toda chamada tem FALLBACK automático para um valor mockado, então a
// interface nunca quebra caso uma API esteja indisponível ou bloqueada
// por CORS. Cada indicador informa sua origem (`source`: 'live' | 'mock').
// ---------------------------------------------------------------------------

// Valor fixo atual da Selic (meta, % a.a.). Serve de fallback e de valor
// inicial editável na interface.
export const CURRENT_SELIC = 15.0

// Endpoint das séries temporais do SGS do Banco Central.
const SGS = (serie) =>
  `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/1?formato=json`

/**
 * Busca o último valor de uma série temporal do SGS/BCB.
 * @param {number|string} serie - código da série (ex: 432 = Selic meta)
 * @returns {Promise<number|null>} valor numérico ou null em caso de falha
 */
async function fetchSgsLast(serie) {
  try {
    const res = await fetch(SGS(serie))
    if (!res.ok) throw new Error(`SGS ${serie} respondeu ${res.status}`)
    const json = await res.json()
    const valor = json?.[0]?.valor
    return valor != null ? Number(valor) : null
  } catch (err) {
    console.warn(`[macroApi] série ${serie} indisponível:`, err.message)
    return null
  }
}

/**
 * Busca a cotação do dólar (USD-BRL) na AwesomeAPI.
 * @returns {Promise<number|null>}
 */
async function fetchUsdBrl() {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
    if (!res.ok) throw new Error(`AwesomeAPI respondeu ${res.status}`)
    const json = await res.json()
    const bid = json?.USDBRL?.bid
    return bid != null ? Number(bid) : null
  } catch (err) {
    console.warn('[macroApi] dólar indisponível:', err.message)
    return null
  }
}

/**
 * Busca a expectativa de mercado (mediana, Focus/BCB) para o PIB Total anual.
 * Usa a API de Expectativas (Olinda) do Banco Central.
 * @returns {Promise<number|null>} variação % esperada ou null em caso de falha
 */
async function fetchPibFocus() {
  try {
    const base =
      'https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais'
    const query =
      "?$top=1&$orderby=Data desc&$format=json&$select=Mediana" +
      "&$filter=Indicador eq 'PIB Total'"
    const res = await fetch(base + encodeURI(query))
    if (!res.ok) throw new Error(`Expectativas respondeu ${res.status}`)
    const json = await res.json()
    const mediana = json?.value?.[0]?.Mediana
    return mediana != null ? Number(mediana) : null
  } catch (err) {
    console.warn('[macroApi] PIB (Focus) indisponível:', err.message)
    return null
  }
}

/**
 * Busca a taxa Selic meta (% a.a.) no BCB.
 * @returns {Promise<{source:'live'|'mock', value:number}>}
 */
export async function fetchSelic() {
  const value = await fetchSgsLast(432) // 432 = Meta Selic definida pelo Copom
  return value != null
    ? { source: 'live', value }
    : { source: 'mock', value: CURRENT_SELIC }
}

// Helper: monta o objeto de um indicador com fallback transparente.
function buildIndicator(base, liveValue) {
  return liveValue != null
    ? { ...base, value: liveValue, source: 'live' }
    : { ...base, source: 'mock' }
}

/**
 * Busca os indicadores macroeconômicos secundários (exceto Selic).
 * Faz as chamadas em paralelo e aplica fallback indicador a indicador.
 *
 * @returns {Promise<Array<{id,label,value,unit,hint,source}>>}
 */
export async function fetchMacroIndicators() {
  const [ipca12, usd, cdi, pib] = await Promise.all([
    fetchSgsLast(13522), // 13522 = IPCA acumulado em 12 meses
    fetchUsdBrl(),
    fetchSgsLast(4389), // 4389 = Taxa CDI anualizada (base 252)
    fetchPibFocus(), // PIB Total anual (expectativa de mercado / Focus)
  ])

  return [
    buildIndicator(
      { id: 'ipca', label: 'IPCA (12 meses)', value: 4.62, unit: '%', hint: 'Inflação oficial' },
      ipca12,
    ),
    buildIndicator(
      { id: 'dolar', label: 'Dólar (PTAX)', value: 5.43, unit: 'R$', hint: 'Câmbio comercial' },
      usd != null ? Number(usd.toFixed(2)) : null,
    ),
    buildIndicator(
      { id: 'cdi', label: 'CDI', value: 14.9, unit: '% a.a.', hint: 'Referência de renda fixa' },
      cdi,
    ),
    buildIndicator(
      { id: 'pib', label: 'PIB (var. anual)', value: 2.1, unit: '%', hint: 'Expectativa de mercado (Focus/BCB)' },
      pib,
    ),
  ]
}
