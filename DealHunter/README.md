# DealHunter Imobiliário

Motor de **descoberta e triagem de imóveis** para compra alavancada onde **o
aluguel paga a maior parte da parcela** — você dá a entrada, financia o resto,
aluga, e o inquilino paga a parcela. O app caça imóveis em escala, pontua cada um
por um **Opportunity Score** com **farol** 🟢🟡🔴, detecta pechinchas e monitora
quedas de preço.

Stack completo, todas as 6 fases da especificação implementadas:

- **Engine financeiro** — Python puro, fonte de verdade da matemática (`engine/`).
- **API + persistência** — FastAPI + SQLAlchemy/SQLite, pronto p/ Postgres (`api/`).
- **Descoberta** — extractors por portal + Firecrawl + dedupe + comparáveis (`discovery/`).
- **Frontend** — Next.js 14 + Tailwind + Recharts + Leaflet (`frontend/`).

```
engine/      Fase 1  SAC/Price, aluguel líq., desembolso, métricas, break-evens, score
api/         Fase 2  CRUD, feed, detalhe/cenário, histórico       + Fase 5 (alertas/mapa)
discovery/   Fase 3  sweeps, extractors isolados, comparáveis, estimativa de aluguel
api/services Fase 6  heatmap de sensibilidade + Monte Carlo
frontend/    Fase 4  feed, detalhe c/ sliders, busca NL, mapa, comparador, premissas
```

## Rodar tudo

```bash
# Backend
pip install -r requirements.txt
uvicorn api.main:app --reload          # http://localhost:8000  (docs em /docs)

# Frontend (outro terminal)
cd frontend && npm install && npm run dev   # http://localhost:3000

# Ou os dois de uma vez:
./run_dev.sh
```

Sem chaves de API o app funciona offline: a varredura usa dados sintéticos
(`discovery/sample_data.py`) e a busca em linguagem natural cai para o parser
heurístico. Com `ANTHROPIC_API_KEY` a busca NL usa Claude; com
`FIRECRAWL_API_KEY` a varredura/monitoramento usam Firecrawl real.

## Testes

```bash
python3 -m pytest                       # 58 testes (engine + API), inclui §13
cd frontend && npm run test:engine      # espelho TS bate com o §13
cd frontend && npm run build            # type-check + build de produção
```

---

## Fase 1 — Engine financeiro (fonte de verdade)

## Conceito núcleo — Desembolso Líquido Mensal (§2)

```
desembolso_liquido = parcela + condominio + iptu_mensal + manutencao - aluguel_liquido
```

- `> 0` consome caixa · `≈ 0` se paga · `< 0` cash-flow positivo.

## O que está implementado

| Módulo | Conteúdo |
|---|---|
| `engine/assumptions.py` | `Premissas` (defaults conservadores §12), tabela IR carnê-leão 2026, pesos do score |
| `engine/financing.py` | SAC, Price, taxa efetiva (+TR), seguros (MIP/DFI/adm), CET, amortização extra, IRR |
| `engine/rental.py` | Aluguel líquido (§7.6): vacância, admin imobiliária, IR carnê-leão por faixa |
| `engine/costs.py` | Custos de posse mensais (§7.7) e capital investido / custos de transação (§7.5) |
| `engine/cashflow.py` | Desembolso líquido (§2) + waterfall + % da parcela coberta |
| `engine/metrics.py` | Cap rate, yield, cash-on-cash, ROE, LTV, **TIR/VPL do equity** (§7.10), payback |
| `engine/breakeven.py` | "Resolver pra equilíbrio": entrada / aluguel / prazo que zeram o desembolso (§8) |
| `engine/scoring.py` | **Farol** 🟢🟡🔴 (§3.1) e **Opportunity Score 0–100 com breakdown** (§3.2) |
| `engine/evaluate.py` | `avaliar()` — amarra tudo num resultado por imóvel |

Demonstração isolada do engine: `python3 demo_section13.py`.

## Validação §13 (reproduzido pelo engine, ±R$1)

`i_m = (1 + 0,115)^(1/12) - 1 = 0,9112%/mês`

| Entrada | Financiado | 1ª parcela SAC | Juros totais |
|---|---|---|---|
| R$200.000 | R$500.000 | 5.945,12 | 822.400,28 |
| R$300.000 | R$400.000 | 4.756,10 | 657.920,22 |
| R$400.000 | R$300.000 | 3.567,07 | 493.440,17 |

- **Price** (500k/360m/11,5%): parcela 4.737,06 · juros totais 1.205.341,99
- **Amort. extra SAC** +R$500/mês → 265 meses, economia ~R$217.089 · +R$1.000/mês → 210 meses, ~R$343.305
- **Desembolso** (entrada 200k, aluguel 3.000, cond 800, IPTU 300/mês, vacância 1 mês/ano, sem imobiliária, manut 0,5%): aluguel líquido 2.750 → **desembolso R$4.586,79/mês → 🔴 VERMELHO**

## Princípios (§12)

- **Toda taxa é efetiva**; matemática só vive no Python e é testada.
- Defaults **conservadores**: vacância ≥ 1 mês/ano, manutenção ≥ 0,5% a.a., IR sobre aluguel ligado.
- Dado estimado nunca vira "informado" — `Imovel.aluguel_origem ∈ {informado, comparaveis, yield}`.
- Opportunity Score **nunca é caixa-preta**: sempre acompanha o breakdown por componente (`ScoreBreakdown.explicar()`).

> Disclaimer: estimativas, não recomendação de investimento. O IR é aproximação
> isolada por imóvel. Valorização passada ≠ futura.

---

## Fases 2–6 — App completo

### API (FastAPI) — principais rotas
- `GET /imoveis` — feed ranqueado por Opportunity Score (com filtros).
- `POST /imoveis/{id}/detalhe` — cenário completo: cascata, cronograma
  saldo×patrimônio, break-evens, breakdown do score (aceita overrides p/ sliders).
- `GET /imoveis/{id}/historico` · `POST /imoveis/{id}/heatmap` · `/montecarlo`.
- `POST /busca/nl` — busca em linguagem natural (Claude + fallback heurístico).
- `POST /descoberta/sweep` · `POST /descoberta/importar` (CSV/JSON).
- `GET|PUT /premissas` (re-pontua a carteira) · `/perfis` · `/alertas` · `/mapa`
  · `/comparar`.

Documentação interativa em `http://localhost:8000/docs`.

### Descoberta (`discovery/`)
Extractor **isolado por portal** (ZAP, VivaReal, QuintoAndar, Imovelweb, OLX,
Chaves na Mão) com falha graciosa — se um quebra, os outros seguem. Dedupe por
assinatura (bairro+área+preço), comparáveis/subvalorização por microrregião,
estimativa de aluguel rotulada (`informado|comparaveis|yield`) e pontuação
automática na ingestão. Firecrawl para scraping/monitoramento real; importador
CSV/JSON e amostra sintética como fallback offline.

### Frontend (`frontend/`)
Next.js 14 + Tailwind + Recharts + Leaflet. Sliders usam um **espelho TS do
engine** (`frontend/lib/engine.ts`) para feedback instantâneo, validado contra o
§13 (`npm run test:engine`) — mas o valor autoritativo vem sempre da API (Python).
Ver `frontend/README.md`.

### Configuração (variáveis de ambiente)
| Var | Efeito |
|---|---|
| `DATABASE_URL` | troca SQLite por Postgres (`postgresql+psycopg://…`) |
| `ANTHROPIC_API_KEY` | busca NL via Claude (senão, parser heurístico) |
| `FIRECRAWL_API_KEY` | varredura/monitoramento reais (senão, amostra offline) |
| `NEXT_PUBLIC_API_URL` | URL da API usada pelo frontend |
