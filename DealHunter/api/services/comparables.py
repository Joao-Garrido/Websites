"""Comparáveis e detector de subvalorização (§5.3).

Mediana de R$/m² da microrregião a partir do conjunto já varrido (DB).
A camada Firecrawl de comparáveis externos entra em discovery/.
"""
from __future__ import annotations

import statistics
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models


def regiao_key(bairro: Optional[str], cidade: Optional[str],
               uf: Optional[str]) -> Optional[str]:
    if bairro and cidade:
        return f"{bairro}, {cidade}-{uf or ''}".strip("-")
    if cidade:
        return f"{cidade}-{uf or ''}".strip("-")
    return None


def _precos_m2_regiao(db: Session, bairro, cidade, uf, tipo,
                      area_ref: Optional[float] = None) -> List[float]:
    stmt = select(models.Imovel).where(
        models.Imovel.area_m2.isnot(None),
        models.Imovel.area_m2 > 0,
        models.Imovel.arquivado.is_(False),
    )
    if bairro:
        stmt = stmt.where(models.Imovel.bairro == bairro)
    elif cidade:
        stmt = stmt.where(models.Imovel.cidade == cidade)
    if tipo:
        stmt = stmt.where(models.Imovel.tipo == tipo)

    precos = []
    for im in db.scalars(stmt):
        if not im.area_m2:
            continue
        # comparáveis: mesma região, ±20% de área (quando há referência)
        if area_ref and not (0.8 * area_ref <= im.area_m2 <= 1.2 * area_ref):
            continue
        precos.append(im.preco / im.area_m2)
    return precos


def mediana_venda_regiao(db: Session, bairro, cidade, uf, tipo,
                         area_ref: Optional[float] = None) -> Optional[float]:
    precos = _precos_m2_regiao(db, bairro, cidade, uf, tipo, area_ref)
    if len(precos) < 2:  # precisa de ao menos 2 amostras
        return None
    return statistics.median(precos)


def get_comparavel(db: Session, regiao: str) -> Optional[models.Comparavel]:
    return db.scalar(select(models.Comparavel).where(models.Comparavel.regiao == regiao))


def mediana_para_imovel(db: Session, imovel: models.Imovel) -> Optional[float]:
    """Mediana de R$/m² de venda aplicável a este imóvel.

    Prioriza o cálculo ao vivo do conjunto varrido (±20% de área);
    cai para o comparável persistido (que pode vir do Firecrawl, §5.3).
    """
    if imovel.area_m2:
        viva = mediana_venda_regiao(db, imovel.bairro, imovel.cidade, imovel.uf,
                                    imovel.tipo, area_ref=imovel.area_m2)
        if viva:
            return viva
    chave = regiao_key(imovel.bairro, imovel.cidade, imovel.uf)
    if chave:
        comp = get_comparavel(db, chave)
        if comp and comp.preco_m2_mediana_venda:
            return comp.preco_m2_mediana_venda
    return None


def recompute_comparavel(db: Session, bairro, cidade, uf, tipo) -> Optional[models.Comparavel]:
    """Recalcula e persiste a mediana da região (venda)."""
    chave = regiao_key(bairro, cidade, uf)
    if not chave:
        return None
    precos = _precos_m2_regiao(db, bairro, cidade, uf, tipo)
    if not precos:
        return None
    comp = get_comparavel(db, chave)
    if comp is None:
        comp = models.Comparavel(regiao=chave, tipo=tipo)
        db.add(comp)
    comp.preco_m2_mediana_venda = statistics.median(precos)
    comp.n_amostras = len(precos)

    # mediana de R$/m² de aluguel da região (anúncios com aluguel informado)
    alugueis = _alugueis_m2_regiao(db, bairro, cidade, uf, tipo)
    if alugueis:
        comp.preco_m2_mediana_aluguel = statistics.median(alugueis)

    db.commit()
    db.refresh(comp)
    return comp


def _alugueis_m2_regiao(db: Session, bairro, cidade, uf, tipo) -> List[float]:
    stmt = select(models.Imovel).where(
        models.Imovel.area_m2.isnot(None), models.Imovel.area_m2 > 0,
        models.Imovel.aluguel_estimado.isnot(None), models.Imovel.aluguel_estimado > 0,
        models.Imovel.aluguel_origem != "yield",  # evita circularidade
        models.Imovel.arquivado.is_(False),
    )
    if bairro:
        stmt = stmt.where(models.Imovel.bairro == bairro)
    elif cidade:
        stmt = stmt.where(models.Imovel.cidade == cidade)
    if tipo:
        stmt = stmt.where(models.Imovel.tipo == tipo)
    return [im.aluguel_estimado / im.area_m2 for im in db.scalars(stmt) if im.area_m2]
