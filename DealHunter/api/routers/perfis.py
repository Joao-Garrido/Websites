"""Perfis de busca / monitoramento (§5.1/§10.4)."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import PerfilBuscaCreate, PerfilBuscaOut, SweepResponse
from ..services import monitoring

router = APIRouter(prefix="/perfis", tags=["perfis"])


def _get(db, pid) -> models.PerfilBusca:
    p = db.get(models.PerfilBusca, pid)
    if not p:
        raise HTTPException(404, "Perfil não encontrado")
    return p


@router.post("", response_model=PerfilBuscaOut, status_code=201)
def criar(payload: PerfilBuscaCreate, db: Session = Depends(get_db)):
    p = models.PerfilBusca(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("", response_model=List[PerfilBuscaOut])
def listar(db: Session = Depends(get_db)):
    return list(db.scalars(select(models.PerfilBusca).order_by(models.PerfilBusca.id.desc())))


@router.get("/{pid}", response_model=PerfilBuscaOut)
def obter(pid: int, db: Session = Depends(get_db)):
    return _get(db, pid)


@router.patch("/{pid}", response_model=PerfilBuscaOut)
def atualizar(pid: int, payload: PerfilBuscaCreate, db: Session = Depends(get_db)):
    p = _get(db, pid)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{pid}", status_code=204)
def deletar(pid: int, db: Session = Depends(get_db)):
    db.delete(_get(db, pid))
    db.commit()


@router.post("/{pid}/executar", response_model=SweepResponse)
def executar(pid: int, usar_firecrawl: bool = False, db: Session = Depends(get_db)):
    p = _get(db, pid)
    stats = monitoring.executar_perfil(db, p, usar_firecrawl=usar_firecrawl)
    return SweepResponse(**stats)
