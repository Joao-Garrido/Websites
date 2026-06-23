"""Imóveis: CRUD, feed ranqueado, detalhe com cenário, histórico, sensibilidade."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import (CenarioInput, HeatmapRequest, HistoricoPrecoOut,
                       ImovelCreate, ImovelOut, ImovelUpdate, MonteCarloRequest)
from ..services import imovel_service, scoring_service, sensitivity

router = APIRouter(prefix="/imoveis", tags=["imoveis"])


def _get(db: Session, imovel_id: int) -> models.Imovel:
    orm = db.get(models.Imovel, imovel_id)
    if not orm:
        raise HTTPException(404, "Imóvel não encontrado")
    return orm


@router.post("", response_model=ImovelOut, status_code=201)
def criar(payload: ImovelCreate, db: Session = Depends(get_db)):
    return imovel_service.criar_imovel(db, payload.model_dump())


@router.get("", response_model=List[ImovelOut])
def listar(
    db: Session = Depends(get_db),
    cidade: Optional[str] = None,
    uf: Optional[str] = None,
    bairro: Optional[str] = None,
    tipo: Optional[str] = None,
    farol: Optional[str] = None,
    preco_min: Optional[float] = None,
    preco_max: Optional[float] = None,
    quartos_min: Optional[int] = None,
    vagas_min: Optional[int] = None,
    desembolso_max: Optional[float] = None,
    cap_rate_min: Optional[float] = None,
    desconto_min: Optional[float] = None,
    cash_flow_positivo: Optional[bool] = None,
    ordenar_por: str = "opportunity_score",
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    filtro = {
        "cidade": cidade, "uf": uf, "bairro": bairro, "tipo": tipo, "farol": farol,
        "preco_min": preco_min, "preco_max": preco_max, "quartos_min": quartos_min,
        "vagas_min": vagas_min, "desembolso_max": desembolso_max,
        "cap_rate_min": cap_rate_min, "desconto_min": desconto_min,
        "cash_flow_positivo": cash_flow_positivo, "ordenar_por": ordenar_por,
    }
    return imovel_service.listar(db, filtro, limit=limit, offset=offset)


@router.get("/{imovel_id}", response_model=ImovelOut)
def obter(imovel_id: int, db: Session = Depends(get_db)):
    return _get(db, imovel_id)


@router.patch("/{imovel_id}", response_model=ImovelOut)
def atualizar(imovel_id: int, payload: ImovelUpdate, db: Session = Depends(get_db)):
    orm = _get(db, imovel_id)
    return imovel_service.atualizar_imovel(db, orm, payload.model_dump(exclude_none=True))


@router.delete("/{imovel_id}", status_code=204)
def deletar(imovel_id: int, db: Session = Depends(get_db)):
    orm = _get(db, imovel_id)
    db.delete(orm)
    db.commit()


@router.post("/{imovel_id}/recompute", response_model=ImovelOut)
def recompute(imovel_id: int, db: Session = Depends(get_db)):
    orm = _get(db, imovel_id)
    scoring_service.recalcular(db, orm)
    db.commit()
    db.refresh(orm)
    return orm


@router.post("/{imovel_id}/detalhe")
def detalhe(imovel_id: int, cenario: CenarioInput, db: Session = Depends(get_db)):
    orm = _get(db, imovel_id)
    return scoring_service.detalhe(db, orm, cenario.model_dump(exclude_none=True))


@router.get("/{imovel_id}/historico", response_model=List[HistoricoPrecoOut])
def historico(imovel_id: int, db: Session = Depends(get_db)):
    _get(db, imovel_id)
    stmt = (select(models.HistoricoPreco)
            .where(models.HistoricoPreco.imovel_id == imovel_id)
            .order_by(models.HistoricoPreco.data.asc()))
    return list(db.scalars(stmt))


@router.post("/{imovel_id}/heatmap")
def heatmap(imovel_id: int, req: HeatmapRequest, db: Session = Depends(get_db)):
    orm = _get(db, imovel_id)
    return sensitivity.heatmap(db, orm, req)


@router.post("/{imovel_id}/montecarlo")
def montecarlo(imovel_id: int, req: MonteCarloRequest, db: Session = Depends(get_db)):
    orm = _get(db, imovel_id)
    return sensitivity.monte_carlo(db, orm, req)
