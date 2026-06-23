"""Desembolso líquido mensal — a métrica núcleo (§2)."""
from __future__ import annotations

from dataclasses import dataclass

from .costs import CustosPosse
from .rental import AluguelLiquido


@dataclass
class Desembolso:
    parcela: float
    custos_posse: float       # condominio + iptu + manutencao + seguro
    aluguel_liquido: float
    desembolso_liquido: float

    @property
    def se_paga(self) -> bool:
        return self.desembolso_liquido <= 0.0

    @property
    def waterfall(self) -> dict:
        """Para o gráfico de cascata: aluguel -> -custos -> parcela -> desembolso."""
        return {
            "aluguel_liquido": self.aluguel_liquido,
            "(-) parcela": -self.parcela,
            "(-) custos_posse": -self.custos_posse,
            "= desembolso_liquido": self.desembolso_liquido,
        }


def desembolso_liquido(parcela: float, custos: CustosPosse,
                       aluguel: AluguelLiquido) -> Desembolso:
    """desembolso = parcela + custos_posse - aluguel_liquido (§2/§7.8)."""
    valor = parcela + custos.total - aluguel.liquido
    return Desembolso(
        parcela=parcela,
        custos_posse=custos.total,
        aluguel_liquido=aluguel.liquido,
        desembolso_liquido=valor,
    )


def pct_parcela_coberta(aluguel_liquido_valor: float, parcela: float) -> float:
    """Fração da parcela coberta pelo aluguel líquido (§3.1)."""
    if parcela <= 0:
        return float("inf")
    return aluguel_liquido_valor / parcela
