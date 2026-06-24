"""Busca em linguagem natural (§6)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import BuscaNLRequest, BuscaNLResponse, FiltroEstruturado
from ..services import imovel_service, nlp_search

router = APIRouter(prefix="/busca", tags=["busca"])


@router.post("/nl", response_model=BuscaNLResponse)
def busca_nl(req: BuscaNLRequest, db: Session = Depends(get_db)):
    filtro, fonte = nlp_search.parse_filtro(req.frase)
    resultados = imovel_service.listar(db, filtro, limit=100)

    perfil_id = None
    if req.salvar_como_perfil:
        perfil = models.PerfilBusca(
            nome=req.salvar_como_perfil,
            regioes=[filtro["cidade"]] if filtro.get("cidade") else [],
            tipo=filtro.get("tipo"),
            preco_min=filtro.get("preco_min"),
            preco_max=filtro.get("preco_max"),
            quartos_min=filtro.get("quartos_min"),
            criterio_viabilidade=(
                {"tipo": "desembolso_max", "valor": filtro["desembolso_max"]}
                if filtro.get("desembolso_max") is not None else
                ({"tipo": "farol", "valor": filtro["farol"]} if filtro.get("farol") else None)
            ),
            monitorar=True,
            filtros_extra=filtro,
        )
        db.add(perfil)
        db.commit()
        db.refresh(perfil)
        perfil_id = perfil.id

    return BuscaNLResponse(
        filtro=FiltroEstruturado(**{k: v for k, v in filtro.items()
                                    if k in FiltroEstruturado.model_fields}),
        fonte_parser=fonte,
        total=len(resultados),
        resultados=resultados,
        perfil_id=perfil_id,
    )
