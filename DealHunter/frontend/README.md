# DealHunter — Frontend (Next.js 14)

Interface do motor de descoberta: feed ranqueado, detalhe com sliders ao vivo,
mapa, perfis monitorados, inbox de alertas, comparador, premissas e import.

## Rodar

```bash
cd frontend
cp .env.local.example .env.local   # aponta para a API (default http://localhost:8000)
npm install
npm run dev        # http://localhost:3000
```

Suba a API antes (ver ../README.md). Em outro terminal:
```bash
cd .. && uvicorn api.main:app --reload
```

## Telas (§10)

| Rota | Tela |
|---|---|
| `/` | Feed de oportunidades + busca em linguagem natural |
| `/imovel/[id]` | Detalhe: sliders, cascata, saldo×patrimônio, histórico, break-evens, breakdown do score |
| `/mapa` | Pins coloridos pelo farol (Leaflet) |
| `/perfis` | Perfis de busca / monitoramento |
| `/alertas` | Inbox (novo, queda de preço, cruzou viabilidade) |
| `/comparar` | Comparador lado a lado |
| `/premissas` | Premissas globais (re-pontua a carteira ao salvar) |
| `/importar` | Import CSV/JSON |

## Espelho do engine (sliders instantâneos)

`lib/engine.ts` replica a matemática do Python para feedback imediato nos
sliders. **Tem que bater com o §13** — verifique:

```bash
npm run test:engine
```

O valor autoritativo continua vindo da API (Python é a fonte de verdade);
o espelho TS é só para a prévia enquanto o usuário arrasta o slider.
