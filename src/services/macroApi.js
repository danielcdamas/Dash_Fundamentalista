// ---------------------------------------------------------------------------
// Camada de serviço de indicadores macroeconômicos brasileiros.
//
// Dados MOCKADOS por enquanto. A taxa Selic recebe destaque e pode ser
// atualizada manualmente pela interface (ver componente MacroIndicators).
//
// >>> ONDE INSERIR A API REAL <<<
// O Banco Central do Brasil expõe séries temporais públicas e gratuitas
// (SGS - Sistema Gerenciador de Séries Temporais), sem necessidade de token:
//   - Selic meta (% a.a.) -> série 432
//   - IPCA (% mês)        -> série 433
//   - CDI                 -> série 12
//   - Dólar (PTAX venda)  -> série 1
//
// Exemplo de endpoint (último valor da Selic):
//   https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json
//
// Exemplo de implementação real (descomentar e adaptar futuramente):
//
//   export async function fetchSelic() {
//     const url =
//       'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json'
//     const res = await fetch(url)
//     if (!res.ok) throw new Error('Falha ao consultar a Selic no BCB')
//     const [{ valor }] = await res.json()
//     return Number(valor)
//   }
// ---------------------------------------------------------------------------

// Valor fixo atual da Selic (meta, % a.a.). Atualize aqui ou pela interface.
export const CURRENT_SELIC = 15.0

// Demais indicadores macro mockados.
const MOCK_MACRO = [
  { id: 'ipca', label: 'IPCA (12 meses)', value: 4.62, unit: '%', hint: 'Inflação oficial' },
  { id: 'cdi', label: 'CDI', value: 14.9, unit: '% a.a.', hint: 'Referência de renda fixa' },
  { id: 'dolar', label: 'Dólar (PTAX)', value: 5.43, unit: 'R$', hint: 'Câmbio comercial' },
  { id: 'pib', label: 'PIB (var. anual)', value: 2.1, unit: '%', hint: 'Crescimento econômico' },
]

/**
 * Busca os indicadores macroeconômicos secundários (exceto Selic).
 *
 * Simula latência de rede e devolve dados mockados. Substituir pelo
 * fetch real do BCB/SGS no futuro (ver bloco comentado acima).
 *
 * @returns {Promise<Array<{id,label,value,unit,hint}>>}
 */
export async function fetchMacroIndicators() {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return MOCK_MACRO
}
