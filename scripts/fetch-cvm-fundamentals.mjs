// ---------------------------------------------------------------------------
// Coletor de fundamentos a partir dos DADOS ABERTOS da CVM (gratuito).
//
// Os indicadores que o plano gratuito da brapi NÃO entrega (EBIT, CAGR do
// lucro, Dív.Líquida/EBITDA e "listado desde") são extraídos aqui das
// Demonstrações Financeiras Padronizadas (DFP) e do cadastro da CVM.
//
// COMO RODAR (precisa de internet):
//   npm run fetch:cvm
// O script gera/atualiza src/data/cvmFundamentals.json, que é commitado no
// repositório e consumido pelo app (sem custo e sem chamadas pesadas em
// produção). Reexecute quando a CVM publicar novas demonstrações.
//
// IMPORTANTE: este parser segue a estrutura conhecida dos arquivos da CVM,
// mas os códigos de conta podem variar entre empresas/anos. Os valores
// devem ser conferidos após a primeira execução; ajuste o mapa CONTAS se
// algum indicador vier vazio ou divergente.
// ---------------------------------------------------------------------------

import AdmZip from 'adm-zip'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/cvmFundamentals.json')

// Mapa ticker -> código CVM (CD_CVM). Adicione novos ativos aqui.
const TICKERS = {
  ITUB4: { cdCvm: 19348, name: 'Itaú Unibanco Holding S.A.' },
  VALE3: { cdCvm: 4170, name: 'Vale S.A.' },
}

// Quantos anos de DFP baixar (para o CAGR do lucro). 5 anos => CAGR de 4 anos.
const YEARS_BACK = 5
const BASE_DFP = 'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS'
const CAD_URL = 'https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv'

// Códigos de conta (CD_CONTA) usados, no padrão consolidado da CVM.
const CONTAS = {
  ebit: '3.05', // Resultado Antes do Resultado Financeiro e dos Tributos
  lucro: '3.11', // Lucro/Prejuízo Consolidado do Período
  caixa: ['1.01.01', '1.01.02'], // Caixa + Aplicações financeiras (BPA)
  divida: ['2.01.04', '2.02.01'], // Empréstimos CP + LP (BPP)
}

// --- utilidades --------------------------------------------------------------

async function getBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// CSVs da CVM: ';' como separador e encoding ISO-8859-1.
function parseCsv(buf) {
  const text = buf.toString('latin1')
  const [header, ...lines] = text.split(/\r?\n/).filter(Boolean)
  const cols = header.split(';')
  return lines.map((line) => {
    const cells = line.split(';')
    const row = {}
    cols.forEach((c, i) => (row[c] = cells[i]))
    return row
  })
}

function toNumber(v) {
  if (v == null) return null
  const n = Number(String(v).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// Aplica a escala (MIL => x1000) ao valor da conta.
function scaled(row) {
  const v = toNumber(row.VL_CONTA)
  if (v == null) return null
  return /MIL/i.test(row.ESCALA_MOEDA || '') ? v * 1000 : v
}

function findCsvInZip(zip, regex) {
  const entry = zip.getEntries().find((e) => regex.test(e.entryName))
  return entry ? parseCsv(entry.getData()) : null
}

// Soma as contas (do ano corrente, ORDEM_EXERC = ÚLTIMO) de uma empresa.
function sumContas(rows, cdCvm, contas) {
  const set = new Set([].concat(contas))
  return rows
    .filter(
      (r) =>
        Number(r.CD_CVM) === cdCvm &&
        /ÚLTIMO/i.test(r.ORDEM_EXERC || '') &&
        set.has(r.CD_CONTA),
    )
    .reduce((acc, r) => acc + (scaled(r) ?? 0), 0)
}

function pickConta(rows, cdCvm, conta) {
  const r = rows.find(
    (x) =>
      Number(x.CD_CVM) === cdCvm &&
      /ÚLTIMO/i.test(x.ORDEM_EXERC || '') &&
      x.CD_CONTA === conta,
  )
  return r ? scaled(r) : null
}

// --- coleta principal --------------------------------------------------------

async function main() {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: YEARS_BACK }, (_, i) => currentYear - 1 - i)

  // 1) Cadastro: data de registro na CVM ("listado desde").
  let cad = []
  try {
    cad = parseCsv(await getBuffer(CAD_URL))
  } catch (err) {
    console.warn('Cadastro CVM indisponível:', err.message)
  }

  // 2) Baixa as DFPs ano a ano (DRE, BPA, BPP).
  const dfpByYear = {}
  for (const year of years) {
    try {
      console.log(`Baixando DFP ${year}…`)
      const zip = new AdmZip(await getBuffer(`${BASE_DFP}/dfp_cia_aberta_${year}.zip`))
      dfpByYear[year] = {
        dre: findCsvInZip(zip, new RegExp(`DRE_con_${year}\\.csv$`)),
        bpa: findCsvInZip(zip, new RegExp(`BPA_con_${year}\\.csv$`)),
        bpp: findCsvInZip(zip, new RegExp(`BPP_con_${year}\\.csv$`)),
      }
    } catch (err) {
      console.warn(`DFP ${year} indisponível:`, err.message)
    }
  }

  const out = { generatedAt: new Date().toISOString(), data: {} }

  for (const [ticker, { cdCvm, name }] of Object.entries(TICKERS)) {
    // listado desde (DT_REG do cadastro)
    const cadRow = cad.find((r) => Number(r.CD_CVM) === cdCvm)
    const listedSince = cadRow?.DT_REG || null

    // série de lucro líquido (para o CAGR) e EBIT do ano mais recente
    const netIncomeByYear = {}
    let ebit = null
    let latestWithDre = null

    for (const year of years) {
      const dre = dfpByYear[year]?.dre
      if (!dre) continue
      const lucro = pickConta(dre, cdCvm, CONTAS.lucro)
      if (lucro != null) netIncomeByYear[year] = lucro
      if (latestWithDre == null) {
        latestWithDre = year
        ebit = pickConta(dre, cdCvm, CONTAS.ebit)
      }
    }

    // CAGR do lucro líquido entre o ano mais antigo e o mais recente
    let netIncomeCagr = null
    const ys = Object.keys(netIncomeByYear).map(Number).sort((a, b) => a - b)
    if (ys.length >= 2) {
      const first = netIncomeByYear[ys[0]]
      const last = netIncomeByYear[ys[ys.length - 1]]
      const span = ys[ys.length - 1] - ys[0]
      if (first > 0 && last > 0 && span >= 1) {
        netIncomeCagr = ((last / first) ** (1 / span) - 1) * 100
      }
    }

    // Dívida líquida (ano mais recente com balanço). EBITDA não é direto na
    // DFP, então Dív.Líq/EBITDA fica null até termos uma fonte confiável.
    let netDebt = null
    if (latestWithDre && dfpByYear[latestWithDre]) {
      const { bpa, bpp } = dfpByYear[latestWithDre]
      if (bpa && bpp) {
        const caixa = sumContas(bpa, cdCvm, CONTAS.caixa)
        const divida = sumContas(bpp, cdCvm, CONTAS.divida)
        netDebt = divida - caixa
      }
    }

    out.data[ticker] = {
      name,
      listedSince,
      ebit,
      netIncomeCagr: netIncomeCagr != null ? Number(netIncomeCagr.toFixed(1)) : null,
      netDebt,
      netDebtToEbitda: null, // requer EBITDA (não disponível direto na DFP)
      sourceYear: latestWithDre,
    }
    console.log(`${ticker}:`, JSON.stringify(out.data[ticker]))
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`\nGerado: ${OUT}`)
}

main().catch((err) => {
  console.error('Falha na coleta CVM:', err)
  process.exit(1)
})
