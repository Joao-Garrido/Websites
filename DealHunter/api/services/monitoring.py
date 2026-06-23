"""Monitoramento e alertas (§5.5): roda perfis monitorados, ingere novidades,
e detecta quedas de preço (alertas gerados na atualização do imóvel)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models


def perfil_para_dict(perfil: models.PerfilBusca) -> Dict[str, Any]:
    return {
        "cidade": (perfil.regioes or [None])[0],
        "regioes": perfil.regioes or [],
        "tipo": perfil.tipo,
        "preco_min": perfil.preco_min,
        "preco_max": perfil.preco_max,
        "quartos_min": perfil.quartos_min,
        "criterio_viabilidade": perfil.criterio_viabilidade,
    }


def executar_perfil(db: Session, perfil: models.PerfilBusca,
                    usar_firecrawl: bool = False,
                    max_por_portal: int = 20) -> Dict[str, Any]:
    from discovery import sweep
    stats = sweep.sweep(
        db, perfil_para_dict(perfil),
        usar_firecrawl=usar_firecrawl, max_por_portal=max_por_portal,
        perfil_id=perfil.id,
    )
    perfil.ultima_execucao = datetime.utcnow()
    db.commit()
    return stats


def executar_monitorados(db: Session, usar_firecrawl: bool = False) -> List[Dict[str, Any]]:
    perfis = db.scalars(
        select(models.PerfilBusca).where(models.PerfilBusca.monitorar.is_(True))
    )
    return [{"perfil_id": p.id, **executar_perfil(db, p, usar_firecrawl)} for p in perfis]
