"""Métricas de investimento (§7.9 e §7.10): cap rate, cash-on-cash, ROE,
TIR/VPL do equity, payback, LTV."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from .assumptions import Premissas
from .costs import CustosPosse
from .financing import TabelaFinanciamento, _irr_mensal, _npv, taxa_mensal, simular
from .rental import AluguelLiquido, aluguel_liquido


def cap_rate(aluguel_bruto: float, vacancia: float, admin: float,
             custos_posse_mensal: float, preco: float) -> float:
    """NOI anual / preço. Sem financiamento, sem IR (§7.9)."""
    noi_mensal = aluguel_bruto - vacancia - admin - custos_posse_mensal
    return (noi_mensal * 12.0) / preco


def yield_bruto(aluguel_bruto: float, preco: float) -> float:
    return (aluguel_bruto * 12.0) / preco


def cash_on_cash(desembolso_liquido_mensal: float,
                 capital_investido_total: float) -> float:
    """Cash-on-cash ano 1 = (-desembolso anual) / capital investido."""
    return (-desembolso_liquido_mensal * 12.0) / capital_investido_total


def roe_economico(amortizacao_ano: float, valorizacao_ano: float,
                  desembolso_anual: float,
                  capital_investido_total: float) -> float:
    """ROE econômico ano 1 (§7.9)."""
    return ((amortizacao_ano + valorizacao_ano - desembolso_anual)
            / capital_investido_total)


def ltv(valor_financiado: float, preco: float) -> float:
    return valor_financiado / preco


@dataclass
class ResultadoTIR:
    tir_mensal: Optional[float]
    tir_anual: Optional[float]
    vpl: float
    fluxo: List[float]              # fluxo mensal de equity (t0..tN)


def tir_vpl_equity(preco: float, entrada: float, capital_investido_total: float,
                   tabela: TabelaFinanciamento,
                   aluguel_bruto: float,
                   custos: CustosPosse,
                   p: Premissas,
                   horizonte_anos: Optional[int] = None) -> ResultadoTIR:
    """TIR/VPL do equity num horizonte N (§7.10).

    t0:        -capital_investido
    t1..N:     -desembolso_liquido_t (aluguel cresce por inflação; parcela SAC
               cai; custos sobem por inflação)
    tN (saída):+ preco*(1+valoriz)**N - saldo_devedor - corretagem - IR ganho
    """
    n_anos = horizonte_anos if horizonte_anos is not None else p.horizonte_anos
    n_meses = n_anos * 12
    n_meses = min(n_meses, tabela.prazo_efetivo)

    infl_m = (1.0 + p.inflacao_aa) ** (1.0 / 12.0) - 1.0

    fluxo: List[float] = [-capital_investido_total]
    custos_base = custos.total

    for t in range(1, n_meses + 1):
        fator_infl = (1.0 + infl_m) ** (t - 1)
        aluguel_bruto_t = aluguel_bruto * fator_infl
        custos_t = custos_base * fator_infl
        al = aluguel_liquido(aluguel_bruto_t, p,
                             condominio_mensal=custos.condominio * fator_infl,
                             iptu_mensal=custos.iptu_mensal * fator_infl)
        parcela_t = tabela.parcelas[t - 1]
        desembolso_t = parcela_t + custos_t - al.liquido
        fluxo.append(-desembolso_t)

    # Valor de saída no fim do horizonte
    saldo_na_saida = tabela.saldos[n_meses - 1]
    valor_venda = preco * (1.0 + p.valorizacao_aa) ** n_anos
    corretagem = valor_venda * p.corretagem_venda_pct
    ganho = max(0.0, valor_venda - preco)
    ir_ganho = ganho * p.ir_ganho_capital_pct
    saida = valor_venda - saldo_na_saida - corretagem - ir_ganho
    fluxo[-1] += saida

    im = _irr_mensal(fluxo)
    tir_anual = ((1.0 + im) ** 12 - 1.0) if im is not None else None
    taxa_desc_m = (1.0 + p.taxa_desconto_vpl) ** (1.0 / 12.0) - 1.0
    vpl = _npv(taxa_desc_m, fluxo)
    return ResultadoTIR(tir_mensal=im, tir_anual=tir_anual, vpl=vpl, fluxo=fluxo)


def payback_capital_proprio(capital_investido_total: float,
                            fluxo_mensal_liquido: List[float]) -> Optional[int]:
    """Meses até o fluxo acumulado (sem saída) cobrir o capital investido.

    fluxo_mensal_liquido: valores positivos quando entram no bolso
    (ex.: -desembolso quando há cash-flow positivo).
    """
    acumulado = -capital_investido_total
    for t, cf in enumerate(fluxo_mensal_liquido, start=1):
        acumulado += cf
        if acumulado >= 0:
            return t
    return None
