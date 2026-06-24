"""Conversão e persistência das Premissas globais (engine <-> DB)."""
from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict

from sqlalchemy.orm import Session

from engine import TABELA_IR_CARNE_LEAO_2026, Premissas

from .. import models

PREMISSAS_ID = 1


def premissas_para_dict(p: Premissas) -> Dict[str, Any]:
    d = asdict(p)
    # tuplas -> listas (JSON-friendly)
    d["tabela_ir_carne_leao"] = [list(t) for t in p.tabela_ir_carne_leao]
    return d


def dict_para_premissas(d: Dict[str, Any]) -> Premissas:
    data = dict(d)
    tabela = data.get("tabela_ir_carne_leao") or [list(t) for t in TABELA_IR_CARNE_LEAO_2026]
    data["tabela_ir_carne_leao"] = [tuple(faixa) for faixa in tabela]
    # remove chaves desconhecidas para não quebrar o construtor
    campos = set(Premissas().__dict__.keys())
    data = {k: v for k, v in data.items() if k in campos}
    return Premissas(**data)


def get_premissas_model(db: Session) -> models.PremissasModel:
    row = db.get(models.PremissasModel, PREMISSAS_ID)
    if row is None:
        p = Premissas()
        row = models.PremissasModel(id=PREMISSAS_ID, dados=premissas_para_dict(p))
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def get_premissas(db: Session) -> Premissas:
    return dict_para_premissas(get_premissas_model(db).dados)


def update_premissas(db: Session, patch: Dict[str, Any]) -> Premissas:
    row = get_premissas_model(db)
    dados = dict(row.dados)
    for k, v in patch.items():
        if v is not None:
            dados[k] = v
    row.dados = dados
    db.commit()
    db.refresh(row)
    return dict_para_premissas(row.dados)
