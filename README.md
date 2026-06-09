# Dash_Fundamentalista

Análise de ativos negociados na bolsa de valores.

Dashboard de Análise Fundamentalista para monitorar ativos e indicadores
macroeconômicos de forma limpa e direta, construído com **React + Vite** e
**Tailwind CSS**.

## Funcionalidades

- **Resumo de Portfólio** — cards dos tickers `ITUB4` e `VALE3` com preço e
  variação (dados mockados, prontos para integração com API real).
- **Indicadores Macroeconômicos** — destaque para a taxa **Selic** (valor
  inicial fixo em 15%, editável diretamente na interface), além de IPCA, CDI,
  dólar e PIB.
- **Layout responsivo** em grid, focado em visualização rápida.

## Como rodar

```bash
npm install
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção
npm run preview  # pré-visualiza o build
```

## Estrutura

```
src/
├── App.jsx                      # layout principal (grid responsivo)
├── components/
│   ├── AssetCard.jsx            # card de um ativo
│   ├── PortfolioSummary.jsx     # resumo do portfólio
│   └── MacroIndicators.jsx      # indicadores macro + Selic em destaque
└── services/
    ├── financeApi.js            # cotações (mock + placeholder da API real)
    └── macroApi.js              # indicadores macro (mock + placeholder)
```

## Integração com API real

Os dados hoje são **mockados**. Os pontos onde plugar a API real estão
comentados em `src/services/financeApi.js` e `src/services/macroApi.js`.

Sugestões de APIs gratuitas:

- **Cotações da B3:** [brapi.dev](https://brapi.dev)
- **Indicadores macro:** [API de Séries Temporais do Banco Central (SGS)](https://dadosabertos.bcb.gov.br/)
  — a série `432` retorna a meta da Selic, sem necessidade de token.
