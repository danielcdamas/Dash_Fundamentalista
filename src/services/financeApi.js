// ---------------------------------------------------------------------------
// Camada de serviço de dados financeiros (ativos / portfólio).
//
// Neste primeiro momento os dados são MOCKADOS para permitir o desenvolvimento
// da interface sem depender de uma chave de API. A função `fetchPortfolio`
// abaixo já tem a assinatura assíncrona que a API real terá, então a troca
// no futuro será transparente para os componentes.
//
// >>> ONDE INSERIR A API REAL <<<
// Sugestões de APIs financeiras gratuitas para a B3:
//   - brapi.dev          -> https://brapi.dev/api/quote/ITUB4,VALE3?token=SEU_TOKEN
//   - Alpha Vantage      -> https://www.alphavantage.co/
//   - Yahoo Finance (não oficial)
//
// Exemplo de implementação real (descomentar e adaptar quando houver token):
//
//   export async function fetchPortfolio(tickers) {
//     const token = import.meta.env.VITE_BRAPI_TOKEN
//     const url = `https://brapi.dev/api/quote/${tickers.join(',')}?token=${token}`
//     const res = await fetch(url)
//     if (!res.ok) throw new Error('Falha ao consultar a API de cotações')
//     const json = await res.json()
//     return json.results.map((r) => ({
//       ticker: r.symbol,
//       name: r.longName ?? r.shortName,
//       price: r.regularMarketPrice,
//       changePercent: r.regularMarketChangePercent,
//       currency: r.currency ?? 'BRL',
//     }))
//   }
// ---------------------------------------------------------------------------

// Tickers monitorados por padrão no dashboard.
export const DEFAULT_TICKERS = ['ITUB4', 'VALE3']

// Dados mockados que imitam o formato já normalizado pela camada de serviço.
const MOCK_QUOTES = {
  ITUB4: {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco PN',
    price: 36.42,
    changePercent: 0.85,
    currency: 'BRL',
  },
  VALE3: {
    ticker: 'VALE3',
    name: 'Vale ON',
    price: 58.17,
    changePercent: -1.23,
    currency: 'BRL',
  },
}

/**
 * Busca as cotações dos tickers informados.
 *
 * Simula a latência de uma chamada de rede e devolve dados mockados.
 * Quando a API real for plugada, basta substituir o corpo desta função
 * (ver bloco comentado no topo do arquivo) mantendo o mesmo retorno.
 *
 * @param {string[]} tickers - lista de tickers, ex: ['ITUB4', 'VALE3']
 * @returns {Promise<Array<{ticker,name,price,changePercent,currency}>>}
 */
export async function fetchPortfolio(tickers = DEFAULT_TICKERS) {
  // Simula o tempo de resposta da rede.
  await new Promise((resolve) => setTimeout(resolve, 600))

  return tickers
    .map((t) => MOCK_QUOTES[t])
    .filter(Boolean)
}
