"""Comparador de imóveis lado a lado (§8/§10.6) e mapa."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import CenarioInput
from ..services import scoring_service

router = APIRouter(tags=["comparacao"])


class CompararRequest(BaseModel):
    imovel_ids: List[int]
    cenario: Optional[CenarioInput] = None


@router.post("/comparar")
def comparar(req: CompararRequest, db: Session = Depends(get_db)):
    cen = req.cenario.model_dump(exclude_none=True) if req.cenario else {}
    out = []
    for iid in req.imovel_ids:
        orm = db.get(models.Imovel, iid)
        if orm:
            out.append(scoring_service.detalhe(db, orm, cen))
    return {"comparacao": out}


@router.get("/mapa")
def mapa(db: Session = Depends(get_db), farol: Optional[str] = None):
    """Pins para o mapa (§10.2): lat/lng + farol + score."""
    stmt = select(models.Imovel).where(
        models.Imovel.lat.isnot(None), models.Imovel.arquivado.is_(False))
    if farol:
        stmt = stmt.where(models.Imovel.farol == farol)
    pins = [{
        "id": m.id, "lat": m.lat, "lng": m.lng, "farol": m.farol,
        "opportunity_score": m.opportunity_score, "preco": m.preco,
        "titulo": m.titulo, "bairro": m.bairro, "cidade": m.cidade,
        "desembolso_liquido": m.desembolso_liquido,
    } for m in db.scalars(stmt)]
    return {"pins": pins}


@router.get("/comparaveis")
def comparaveis(db: Session = Depends(get_db)):
    return list(db.scalars(select(models.Comparavel).order_by(models.Comparavel.regiao)))
