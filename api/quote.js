// ---------------------------------------------------------------------------
// Serverless Function (Vercel) — proxy SEGURO para a API da brapi.dev.
//
// Por que isto existe:
//   Num app frontend, qualquer variável exposta ao navegador (prefixo VITE_)
//   vai embutida no bundle e fica visível para qualquer pessoa. Para proteger
//   o token, a chamada que o usa precisa rodar no SERVIDOR.
//
//   Esta função roda na infraestrutura da Vercel e lê `process.env.BRAPI_TOKEN`
//   (SEM o prefixo VITE_), então o token nunca chega ao navegador. O frontend
//   chama o próprio endpoint `/api/quote` — mesma origem, sem CORS.
//
// Configuração:
//   Vercel -> Project Settings -> Environment Variables -> BRAPI_TOKEN
//   (gere o token gratuito em https://brapi.dev)
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  const token = process.env.BRAPI_TOKEN

  // Sanitiza a entrada: só letras, números e vírgula (evita injeção / SSRF).
  const raw = (req.query.tickers || 'ITUB4,VALE3').toString()
  const tickers = raw.replace(/[^A-Za-z0-9,]/g, '').toUpperCase()

  if (!token) {
    // Sem token no servidor: o frontend fará fallback para dados simulados.
    return res
      .status(503)
      .json({ error: 'BRAPI_TOKEN não configurado no servidor' })
  }

  try {
    const url = `https://brapi.dev/api/quote/${tickers}?token=${token}`
    const upstream = await fetch(url)

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `brapi respondeu ${upstream.status}` })
    }

    const json = await upstream.json()
    const data = (json.results ?? []).map((q) => ({
      ticker: q.symbol,
      name: q.longName ?? q.shortName ?? q.symbol,
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent ?? 0,
      currency: q.currency ?? 'BRL',
    }))

    // Cache leve na edge da Vercel para aliviar a brapi e acelerar respostas.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return res.status(200).json({ data })
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
