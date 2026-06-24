"""Custos de posse (recorrentes) e capital investido (custos de transação)."""
from __future__ import annotations

from dataclasses import dataclass

from .assumptions import Premissas


@dataclass
class CustosPosse:
    condominio: float
    iptu_mensal: float
    manutencao: float
    seguro: float

    @property
    def total(self) -> float:
        return self.condominio + self.iptu_mensal + self.manutencao + self.seguro


def custos_posse_mensal(valor_imovel: float, p: Premissas,
                        condominio_mensal: float = 0.0,
                        iptu_anual: float = 0.0,
                        seguro_mensal: float = 0.0) -> CustosPosse:
    """Custos recorrentes de posse (§7.7), mensais."""
    return CustosPosse(
        condominio=condominio_mensal,
        iptu_mensal=iptu_anual / 12.0,
        manutencao=valor_imovel * p.manutencao_aa_pct / 12.0,
        seguro=seguro_mensal,
    )


@dataclass
class CapitalInvestido:
    entrada: float
    itbi: float
    escritura: float
    registro: float
    avaliacao_banco: float

    @property
    def total(self) -> float:
        return (self.entrada + self.itbi + self.escritura
                + self.registro + self.avaliacao_banco)


def capital_investido(preco: float, entrada: float,
                      p: Premissas) -> CapitalInvestido:
    """Capital inicial = entrada + custos de transação (§7.5)."""
    return CapitalInvestido(
        entrada=entrada,
        itbi=preco * p.itbi_pct,
        escritura=preco * p.escritura_pct,
        registro=preco * p.registro_pct,
        avaliacao_banco=p.avaliacao_banco,
    )
