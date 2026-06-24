"""Break-evens (§8): que entrada / aluguel / prazo zeram o desembolso líquido.

A resposta que mais importa: "este imóvel se paga? com que ajuste?".
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .assumptions import Premissas
from .cashflow import desembolso_liquido
from .costs import custos_posse_mensal
from .financing import (entrada_minima, simular, taxa_mensal, valor_financiado)
from .rental import aluguel_liquido


def _desembolso(preco, aluguel_bruto, entrada, prazo, condominio, iptu_anual,
                seguro_mensal, p: Premissas) -> float:
    im = taxa_mensal(p.taxa_aa, p.tr_aa)
    financiado = valor_financiado(preco, entrada)
    tabela = simular(financiado, prazo, im, p.sistema)
    custos = custos_posse_mensal(preco, p, condominio, iptu_anual, seguro_mensal)
    al = aluguel_liquido(aluguel_bruto, p, condominio, iptu_anual / 12.0)
    return desembolso_liquido(tabela.primeira_parcela, custos, al).desembolso_liquido


@dataclass
class BreakEvens:
    entrada_equilibrio: Optional[float]
    aluguel_equilibrio: Optional[float]
    prazo_equilibrio: Optional[int]


def entrada_equilibrio(preco, aluguel_bruto, p: Premissas,
                       condominio=0.0, iptu_anual=0.0, seguro_mensal=0.0,
                       prazo: Optional[int] = None) -> Optional[float]:
    """Entrada que zera o desembolso. Mais entrada -> menor parcela -> menor
    desembolso (monótono). Bisseção entre a entrada mínima e o preço."""
    prazo = prazo or p.prazo_meses
    lo = entrada_minima(preco, p.ltv_max)
    hi = preco

    def f(e):
        return _desembolso(preco, aluguel_bruto, e, prazo, condominio,
                           iptu_anual, seguro_mensal, p)

    f_lo, f_hi = f(lo), f(hi)
    if f_lo <= 0:
        return lo  # já se paga com a entrada mínima
    if f_hi > 0:
        return None  # nem comprando à vista (sem financiamento) zera
    for _ in range(100):
        mid = (lo + hi) / 2.0
        fm = f(mid)
        if abs(fm) < 0.5:
            return mid
        if fm > 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2.0


def aluguel_equilibrio(preco, entrada, p: Premissas,
                       condominio=0.0, iptu_anual=0.0, seguro_mensal=0.0,
                       prazo: Optional[int] = None) -> Optional[float]:
    """Aluguel bruto que zera o desembolso. Mais aluguel -> menor desembolso."""
    prazo = prazo or p.prazo_meses
    lo, hi = 0.0, preco  # teto largo

    def f(a):
        return _desembolso(preco, a, entrada, prazo, condominio,
                           iptu_anual, seguro_mensal, p)

    if f(lo) <= 0:
        return lo
    if f(hi) > 0:
        return None
    for _ in range(100):
        mid = (lo + hi) / 2.0
        fm = f(mid)
        if abs(fm) < 0.5:
            return mid
        if fm > 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2.0


def prazo_equilibrio(preco, aluguel_bruto, entrada, p: Premissas,
                     condominio=0.0, iptu_anual=0.0, seguro_mensal=0.0,
                     prazo_max: int = 600) -> Optional[int]:
    """Menor prazo (em meses) que torna o desembolso <= 0. Prazo maior ->
    parcela menor -> menor desembolso."""
    for n in range(12, prazo_max + 1, 1):
        d = _desembolso(preco, aluguel_bruto, entrada, n, condominio,
                        iptu_anual, seguro_mensal, p)
        if d <= 0:
            return n
    return None


def break_evens(preco, aluguel_bruto, entrada, p: Premissas,
                condominio=0.0, iptu_anual=0.0, seguro_mensal=0.0) -> BreakEvens:
    return BreakEvens(
        entrada_equilibrio=entrada_equilibrio(
            preco, aluguel_bruto, p, condominio, iptu_anual, seguro_mensal),
        aluguel_equilibrio=aluguel_equilibrio(
            preco, entrada, p, condominio, iptu_anual, seguro_mensal),
        prazo_equilibrio=prazo_equilibrio(
            preco, aluguel_bruto, entrada, p, condominio, iptu_anual,
            seguro_mensal),
    )
