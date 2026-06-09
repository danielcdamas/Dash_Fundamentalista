// ---------------------------------------------------------------------------
// Serverless Function (Vercel) — fundamentos de um ativo via brapi.dev.
//
// Mesma arquitetura segura do api/quote.js: o BRAPI_TOKEN vive apenas no
// servidor (process.env, sem prefixo VITE_) e o navegador chama /api/
// fundamentals?ticker=ITUB4 na própria origem (sem CORS, sem token exposto).
//
// Além de repassar os campos da brapi, esta função CALCULA os indicadores
// derivados (Earning Yield, Dív. Líquida/EBITDA, CAGR do lucro) no servidor,
// para o frontend receber tudo pronto e normalizado.
//
// Obs.: alguns módulos da brapi podem não estar disponíveis no plano
// gratuito ou para todos os tickers — campos ausentes voltam como null e o
// frontend os exibe como "—".
// ---------------------------------------------------------------------------

// Converte fração (0.215) em percentual (21.5), preservando null.
function pct(frac) {
  return frac != null && Number.isFinite(Number(frac)) ? Number(frac) * 100 : null
}

function num(v) {
  return v != null && Number.isFinite(Number(v)) ? Number(v) : null
}

export default async function handler(req, res) {
  const token = process.env.BRAPI_TOKEN

  // Sanitiza: um único ticker, só letras e números.
  const ticker = (req.query.ticker || '')
    .toString()
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()

  if (!ticker) {
    return res.status(400).json({ error: 'Informe ?ticker=XXXX4' })
  }
  if (!token) {
    return res
      .status(503)
      .json({ error: 'BRAPI_TOKEN não configurado no servidor' })
  }

  try {
    const modules = 'defaultKeyStatistics,financialData,incomeStatementHistory'
    const url =
      `https://brapi.dev/api/quote/${ticker}` +
      `?token=${token}&fundamental=true&modules=${modules}`

    const upstream = await fetch(url)
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `brapi respondeu ${upstream.status}` })
    }

    const json = await upstream.json()
    const q = json.results?.[0]
    if (!q) {
      return res.status(404).json({ error: `Ticker ${ticker} não encontrado` })
    }

    const stats = q.defaultKeyStatistics ?? {}
    const fin = q.financialData ?? {}
    // A brapi segue o formato Yahoo: o histórico pode vir aninhado.
    const history =
      q.incomeStatementHistory?.incomeStatementHistory ??
      (Array.isArray(q.incomeStatementHistory) ? q.incomeStatementHistory : [])

    // --- Indicadores diretos -------------------------------------------------
    const marketCap = num(q.marketCap)
    const pl = num(q.priceEarnings) ?? num(stats.trailingPE)
    const pvp = num(stats.priceToBook)
    const netMargin = pct(fin.profitMargins)
    const roe = pct(fin.returnOnEquity)
    const ebit = num(history[0]?.ebit)

    // --- Derivados (calculados aqui no servidor) -----------------------------
    // Earning Yield = inverso do P/L (L/P), em %.
    const earningsYield = pl != null && pl > 0 ? 100 / pl : null

    // Dívida Líquida / EBITDA = (dívida total - caixa) / EBITDA.
    const totalDebt = num(fin.totalDebt)
    const totalCash = num(fin.totalCash)
    const ebitda = num(fin.ebitda)
    const netDebtToEbitda =
      totalDebt != null && totalCash != null && ebitda != null && ebitda !== 0
        ? (totalDebt - totalCash) / ebitda
        : null

    // CAGR do lucro líquido sobre o histórico anual disponível (só faz
    // sentido com lucro positivo nas duas pontas).
    let netIncomeCagr = null
    const incomes = history
      .map((h) => ({ date: h.endDate, value: num(h.netIncome) }))
      .filter((h) => h.value != null && h.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    if (incomes.length >= 2) {
      const first = incomes[0]
      const last = incomes[incomes.length - 1]
      const years =
        (new Date(last.date) - new Date(first.date)) / (365.25 * 24 * 3600e3)
      if (first.value > 0 && last.value > 0 && years >= 1) {
        netIncomeCagr = ((last.value / first.value) ** (1 / years) - 1) * 100
      }
    }

    // Tempo de IPO: a brapi/Yahoo informa o primeiro pregão para parte dos
    // tickers; quando ausente, devolvemos null.
    const firstTradeMs =
      num(q.firstTradeDateMilliseconds) ??
      (num(stats.firstTradeDateEpochUtc) != null
        ? num(stats.firstTradeDateEpochUtc) * 1000
        : null)
    const ipoDate = firstTradeMs ? new Date(firstTradeMs).toISOString() : null

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return res.status(200).json({
      data: {
        ticker: q.symbol,
        name: q.longName ?? q.shortName ?? q.symbol,
        marketCap,
        ipoDate,
        pl,
        pvp,
        earningsYield,
        netMargin,
        roe,
        netIncomeCagr,
        netDebtToEbitda,
        ebit,
      },
    })
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
