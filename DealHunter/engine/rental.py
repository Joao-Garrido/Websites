"""Aluguel líquido mensal e IR carnê-leão (§7.6).

IMPORTANTE: é uma aproximação isolada por imóvel (não consolida outras rendas).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

from .assumptions import Premissas


def ir_carne_leao(base: float, tabela: List[Tuple[float, float, float]]) -> float:
    """IR mensal por faixa: ir = max(0, base*aliquota - deducao)."""
    if base <= 0:
        return 0.0
    for limite, aliquota, deducao in tabela:
        if base <= limite:
            return max(0.0, base * aliquota - deducao)
    # fallback (não deve ocorrer: última faixa é infinito)
    limite, aliquota, deducao = tabela[-1]
    return max(0.0, base * aliquota - deducao)


@dataclass
class AluguelLiquido:
    aluguel_bruto: float
    vacancia: float          # valor deduzido por vacância
    recebido_pos_vacancia: float
    admin_imob: float        # taxa de imobiliária
    ir: float                # IR carnê-leão
    liquido: float           # o que efetivamente entra no bolso

    @property
    def origem_breakdown(self) -> dict:
        return {
            "aluguel_bruto": self.aluguel_bruto,
            "(-) vacancia": -self.vacancia,
            "(-) admin_imob": -self.admin_imob,
            "(-) ir": -self.ir,
            "= liquido": self.liquido,
        }


def aluguel_liquido(aluguel_bruto: float, p: Premissas,
                    condominio_mensal: float = 0.0,
                    iptu_mensal: float = 0.0) -> AluguelLiquido:
    """Aluguel líquido mensal (§7.6).

    Sequência:
      recebido = bruto * (1 - vacancia_meses/12)
      admin    = recebido * taxa_admin_imob   (se aluga por imobiliária)
      base IR  = max(0, recebido - despesas_dedutiveis)
                 despesas dedutíveis no carnê-leão: condomínio, IPTU e admin
                 pagos pelo locador.
      liquido  = recebido - admin - ir
    """
    fracao_vacancia = p.vacancia_meses_ano / 12.0
    vacancia_valor = aluguel_bruto * fracao_vacancia
    recebido = aluguel_bruto - vacancia_valor

    admin = recebido * p.taxa_admin_imob if p.aluga_por_imobiliaria else 0.0

    despesas_dedutiveis = condominio_mensal + iptu_mensal + admin
    base_ir = max(0.0, recebido - despesas_dedutiveis)
    ir = ir_carne_leao(base_ir, p.tabela_ir_carne_leao)

    liquido = recebido - admin - ir
    return AluguelLiquido(
        aluguel_bruto=aluguel_bruto,
        vacancia=vacancia_valor,
        recebido_pos_vacancia=recebido,
        admin_imob=admin,
        ir=ir,
        liquido=liquido,
    )
