# DealHunter Imobiliário — Motor Financeiro (Fase 1)

Motor de descoberta e triagem de imóveis para compra alavancada onde **o aluguel
paga a maior parte da parcela**. Esta entrega cobre a **Fase 1** da especificação:
o engine financeiro em Python puro, validado por `pytest` contra os exemplos do
§13. **Sem UI ainda** — é a fonte de verdade da matemática sobre a qual as fases
seguintes (API, descoberta, frontend, monitoramento) serão construídas.

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

## Rodar

```bash
cd DealHunter
pip install -r requirements.txt
pytest                  # 43 testes, inclui validação §13
python3 demo_section13.py   # imprime os números do §13
```

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

## Próximas fases

Fase 2 (FastAPI + SQLite/persistência) · Fase 3 (descoberta via Firecrawl,
extractors por portal, comparáveis, estimativa de aluguel) · Fase 4 (frontend
Next.js: feed, detalhe com sliders, busca em linguagem natural) · Fase 5
(monitoramento, alertas, mapa, comparador) · Fase 6 (heatmaps, Monte Carlo).
