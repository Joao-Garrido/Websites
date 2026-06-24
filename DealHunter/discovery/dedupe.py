"""Deduplicação: mesmo imóvel em vários portais -> um registro (§5.2)."""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select

from .base import Anuncio


def dedupe_anuncios(anuncios: List[Anuncio]) -> List[Anuncio]:
    """Casa por assinatura (bairro+cidade+área+faixa de preço); mantém o de
    maior confiança / mais completo."""
    por_assinatura = {}
    for a in anuncios:
        chave = a.assinatura()
        atual = por_assinatura.get(chave)
        if atual is None or _completude(a) > _completude(atual):
            por_assinatura[chave] = a
    return list(por_assinatura.values())


def _completude(a: Anuncio) -> float:
    campos = [a.area_m2, a.quartos, a.vagas, a.bairro, a.lat, a.aluguel_estimado]
    preenchidos = sum(1 for c in campos if c not in (None, 0, ""))
    return a.confianca + preenchidos * 0.05


def find_existing(db, anuncio: Anuncio):
    """Acha o imóvel já persistido equivalente (mesma fonte+id ou assinatura)."""
    from api import models  # import tardio evita ciclo

    if anuncio.fonte_id:
        existente = db.scalar(
            select(models.Imovel).where(
                models.Imovel.fonte == anuncio.fonte,
                models.Imovel.fonte_id == anuncio.fonte_id,
            )
        )
        if existente:
            return existente

    stmt = select(models.Imovel)
    if anuncio.cidade:
        stmt = stmt.where(models.Imovel.cidade == anuncio.cidade)
    if anuncio.bairro:
        stmt = stmt.where(models.Imovel.bairro == anuncio.bairro)
    candidatos = list(db.scalars(stmt))
    for c in candidatos:
        if _mesmo_imovel(c, anuncio):
            return c
    return None


def _mesmo_imovel(orm, anuncio: Anuncio) -> bool:
    if anuncio.area_m2 and orm.area_m2:
        if abs(anuncio.area_m2 - orm.area_m2) > 2:
            return False
    if orm.preco and anuncio.preco:
        if abs(orm.preco - anuncio.preco) / orm.preco > 0.03:
            return False
    return bool(anuncio.area_m2 and orm.area_m2)
