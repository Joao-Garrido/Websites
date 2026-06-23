"""Demonstração: reproduz os exemplos do §13 imprimindo os números do engine.

    python3 demo_section13.py
"""
from engine import (Imovel, Premissas, amortizacao_extra, avaliar, break_evens,
                    farol, pontuar, price, sac, taxa_mensal)

TAXA, N, PRECO = 0.115, 360, 700_000
im = taxa_mensal(TAXA)
print(f"i_m efetiva = {im*100:.4f}%/mês  (§13: 0,9107%)\n")

print("== SAC (700k, 360m, 11,5%) ==")
print(f"{'entrada':>10} {'financiado':>12} {'1ª parcela':>12} {'juros totais':>14}")
for entrada in (200_000, 300_000, 400_000):
    t = sac(PRECO - entrada, N, im)
    print(f"{entrada:>10,} {PRECO-entrada:>12,} {t.primeira_parcela:>12,.2f} "
          f"{t.total_juros:>14,.2f}")

print("\n== Price (500k, 360m, 11,5%) ==")
tp = price(500_000, N, im)
print(f"parcela fixa = {tp.primeira_parcela:,.2f}  | juros totais = {tp.total_juros:,.2f}")

print("\n== Amortização extra SAC (500k, 360m, reduz prazo) ==")
for extra in (500, 1000):
    r = amortizacao_extra(500_000, N, im, extra, modo="prazo")
    print(f"+R${extra}/mês -> quita em {r.prazo_novo} meses | "
          f"economia ~R${r.economia_juros:,.0f}")

print("\n== Desembolso líquido (§13) ==")
p = Premissas(taxa_aa=TAXA, prazo_meses=N)
imv = Imovel(preco=PRECO, aluguel_estimado=3000, condominio_mensal=800,
             iptu_anual=3600, area_m2=70, vagas=1, quartos=2,
             preco_m2_mediana_regiao=11_000, aluguel_origem="informado")
av = avaliar(imv, p, entrada=200_000)
print(f"parcela={av.tabela.primeira_parcela:,.2f}  custos_posse={av.custos.total:,.2f}  "
      f"aluguel_liq={av.aluguel.liquido:,.2f}")
print(f"DESEMBOLSO LÍQUIDO = R${av.desembolso_liquido:,.2f}/mês  "
      f"farol={farol(av.desembolso_liquido, p.limite_amarelo).upper()}")
print(f"% parcela coberta = {av.pct_coberta*100:.1f}%  cap_rate={av.cap_rate*100:.2f}%  "
      f"TIR(10a)={(av.tir.tir_anual or 0)*100:.1f}%")

print("\n-- break-evens (o que zera o desembolso) --")
be = break_evens(PRECO, 3000, 200_000, p, condominio=800, iptu_anual=3600)
print(f"entrada de equilíbrio = R${be.entrada_equilibrio:,.0f}"
      if be.entrada_equilibrio else "entrada: n/d")
print(f"aluguel de equilíbrio = R${be.aluguel_equilibrio:,.0f}"
      if be.aluguel_equilibrio else "aluguel: n/d")
print(f"prazo de equilíbrio   = {be.prazo_equilibrio} meses"
      if be.prazo_equilibrio else "prazo: nem prazo infinito zera (juros > cobertura)")

print("\n-- Opportunity Score --")
res = pontuar(av)
print(res.breakdown.explicar())
print(f"farol={res.farol}  tag={res.tag!r}")
