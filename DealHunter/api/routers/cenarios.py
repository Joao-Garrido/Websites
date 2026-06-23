"""Cenários salvos por imóvel (§9)."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import CenarioCreate, CenarioOut
from ..services import scoring_service

router = APIRouter(prefix="/imoveis/{imovel_id}/cenarios", tags=["cenarios"])


@router.post("", response_model=CenarioOut, status_code=201)
def criar(imovel_id: int, payload: CenarioCreate, db: Session = Depends(get_db)):
    orm = db.get(models.Imovel, imovel_id)
    if not orm:
        raise HTTPException(404, "Imóvel não encontrado")
    cenario_input = dict(payload.overrides)
    if payload.entrada is not None:
        cenario_input["entrada"] = payload.entrada
    if payload.aporte_extra is not None:
        cenario_input["aporte_extra"] = payload.aporte_extra
    cenario_input["modo_amortizacao"] = payload.modo_amortizacao
    resultados = scoring_service.detalhe(db, orm, cenario_input)

    c = models.Cenario(
        imovel_id=imovel_id, nome=payload.nome, overrides=payload.overrides,
        entrada=payload.entrada, aporte_extra=payload.aporte_extra,
        modo_amortizacao=payload.modo_amortizacao,
        resultados_cache=resultados,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("", response_model=List[CenarioOut])
def listar(imovel_id: int, db: Session = Depends(get_db)):
    return list(db.scalars(
        select(models.Cenario).where(models.Cenario.imovel_id == imovel_id)
    ))


@router.delete("/{cid}", status_code=204)
def deletar(imovel_id: int, cid: int, db: Session = Depends(get_db)):
    c = db.get(models.Cenario, cid)
    if not c:
        raise HTTPException(404, "Cenário não encontrado")
    db.delete(c)
    db.commit()
