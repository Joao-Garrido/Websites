"""Estimativa de aluguel quando o anúncio é só de venda (§5.4).

Origem sempre rotulada: informado | comparaveis | yield.
"""
from __future__ import annotations

from typing import Optional, Tuple

from sqlalchemy.orm import Session

from .. import models
from . import comparables

# Yield mensal por região (fallback configurável). Default conservador.
YIELD_MENSAL_DEFAULT = 0.0040  # 0,40% a.m. do valor do imóvel


def estimar_aluguel(db: Session, imovel: models.Imovel,
                    yield_mensal: float = YIELD_MENSAL_DEFAULT
                    ) -> Tuple[float, str]:
    """Retorna (aluguel_estimado, origem).

    1) informado: já no anúncio.
    2) comparaveis: mediana de R$/m² de aluguel da região * área.
    3) yield: yield_mensal * preço (fallback).
    """
    if imovel.aluguel_estimado and imovel.aluguel_origem == "informado":
        return imovel.aluguel_estimado, "informado"

    chave = comparables.regiao_key(imovel.bairro, imovel.cidade, imovel.uf)
    if chave and imovel.area_m2:
        comp = comparables.get_comparavel(db, chave)
        if comp and comp.preco_m2_mediana_aluguel:
            return comp.preco_m2_mediana_aluguel * imovel.area_m2, "comparaveis"

    return imovel.preco * yield_mensal, "yield"
