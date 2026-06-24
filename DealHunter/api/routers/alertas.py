"""Inbox de alertas (§5.5/§10.5)."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import AlertaOut, AlertaUpdate

router = APIRouter(prefix="/alertas", tags=["alertas"])


@router.get("", response_model=List[AlertaOut])
def listar(lido: Optional[bool] = None, limit: int = 100,
           db: Session = Depends(get_db)):
    stmt = select(models.Alerta).order_by(models.Alerta.criado_em.desc())
    if lido is not None:
        stmt = stmt.where(models.Alerta.lido.is_(lido))
    return list(db.scalars(stmt.limit(limit)))


@router.get("/contagem")
def contagem(db: Session = Depends(get_db)):
    nao_lidos = db.scalar(
        select(func.count()).select_from(models.Alerta).where(models.Alerta.lido.is_(False))
    )
    return {"nao_lidos": nao_lidos or 0}


@router.patch("/{aid}", response_model=AlertaOut)
def marcar(aid: int, payload: AlertaUpdate, db: Session = Depends(get_db)):
    a = db.get(models.Alerta, aid)
    if not a:
        raise HTTPException(404, "Alerta não encontrado")
    a.lido = payload.lido
    db.commit()
    db.refresh(a)
    return a


@router.post("/marcar-todos-lidos")
def marcar_todos(db: Session = Depends(get_db)):
    db.query(models.Alerta).filter(models.Alerta.lido.is_(False)).update({"lido": True})
    db.commit()
    return {"ok": True}
