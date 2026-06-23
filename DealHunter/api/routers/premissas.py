"""Premissas globais (§9/§10.6)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import PremissasSchema, PremissasUpdate
from ..services import imovel_service
from ..services.premissas_service import (get_premissas, premissas_para_dict,
                                          update_premissas)

router = APIRouter(prefix="/premissas", tags=["premissas"])


@router.get("", response_model=PremissasSchema)
def ler_premissas(db: Session = Depends(get_db)):
    return premissas_para_dict(get_premissas(db))


@router.put("", response_model=PremissasSchema)
def atualizar_premissas(patch: PremissasUpdate, db: Session = Depends(get_db)):
    p = update_premissas(db, patch.model_dump(exclude_none=True))
    # premissas mudaram -> re-pontua toda a carteira
    imovel_service.recalcular_todos(db, p)
    return premissas_para_dict(p)
