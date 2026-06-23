"""Descoberta: varredura (sweep) e import manual (§5/§10.7)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import ImportarRequest, SweepRequest, SweepResponse

router = APIRouter(prefix="/descoberta", tags=["descoberta"])


@router.get("/portais")
def portais():
    from discovery import firecrawl_client
    from discovery.extractors import PORTAIS
    return {"portais": PORTAIS, "firecrawl_disponivel": firecrawl_client.disponivel()}


@router.post("/sweep", response_model=SweepResponse)
def sweep_endpoint(req: SweepRequest, db: Session = Depends(get_db)):
    from discovery import sweep as sweep_mod
    perfil = {"cidade": "São Paulo", "regioes": ["São Paulo"]}
    perfil_id = None
    if req.perfil_id:
        p = db.get(models.PerfilBusca, req.perfil_id)
        if p:
            from ..services.monitoring import perfil_para_dict
            perfil = perfil_para_dict(p)
            perfil_id = p.id
    stats = sweep_mod.sweep(
        db, perfil, portais=req.portais, usar_firecrawl=req.usar_firecrawl,
        max_por_portal=req.max_por_portal, perfil_id=perfil_id,
    )
    return SweepResponse(**stats)


@router.post("/importar", response_model=SweepResponse)
def importar_endpoint(req: ImportarRequest, db: Session = Depends(get_db)):
    from discovery import importer, sweep as sweep_mod
    anuncios = importer.importar(req.conteudo, req.formato)
    stats = sweep_mod.ingerir(db, anuncios)
    stats["erros"] = {}
    return SweepResponse(**stats)
