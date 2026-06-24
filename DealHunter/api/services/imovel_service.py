"""CRUD de imóveis com histórico de preço, alertas de queda e (re)pontuação."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from engine import Premissas

from .. import models
from . import scoring_service


def criar_imovel(db: Session, dados: Dict[str, Any],
                 premissas: Optional[Premissas] = None,
                 commit: bool = True) -> models.Imovel:
    orm = models.Imovel(**dados)
    db.add(orm)
    db.flush()
    db.add(models.HistoricoPreco(imovel_id=orm.id, preco=orm.preco))
    scoring_service.recalcular(db, orm, premissas)
    if commit:
        db.commit()
        db.refresh(orm)
    return orm


def atualizar_imovel(db: Session, orm: models.Imovel, patch: Dict[str, Any],
                     premissas: Optional[Premissas] = None) -> models.Imovel:
    farol_antes = orm.farol
    preco_antes = orm.preco

    for k, v in patch.items():
        if v is not None:
            setattr(orm, k, v)

    if "preco" in patch and patch["preco"] is not None and patch["preco"] != preco_antes:
        db.add(models.HistoricoPreco(imovel_id=orm.id, preco=orm.preco))
        if orm.preco < preco_antes:
            queda = 1 - (orm.preco / preco_antes)
            db.add(models.Alerta(
                imovel_id=orm.id, tipo="queda_preco",
                motivo=f"Preço caiu {queda*100:.1f}% "
                       f"(de R${preco_antes:,.0f} para R${orm.preco:,.0f}).",
            ))

    scoring_service.recalcular(db, orm, premissas)

    # cruzou para viável?
    if farol_antes in ("vermelho", "amarelo") and orm.farol == "verde":
        db.add(models.Alerta(
            imovel_id=orm.id, tipo="cruzou_viabilidade",
            motivo=f"Agora se paga: desembolso R${orm.desembolso_liquido:,.0f}/mês "
                   f"(farol verde).",
        ))

    db.commit()
    db.refresh(orm)
    return orm


# --------------------------------------------------------------------------- #
# Filtro estruturado (clássico + NL): mesma função para ambos
# --------------------------------------------------------------------------- #
def aplicar_filtros(stmt, f: Dict[str, Any]):
    M = models.Imovel
    if f.get("cidade"):
        stmt = stmt.where(M.cidade.ilike(f["cidade"]))
    if f.get("uf"):
        stmt = stmt.where(M.uf.ilike(f["uf"]))
    if f.get("bairros"):
        stmt = stmt.where(M.bairro.in_(f["bairros"]))
    if f.get("bairro"):
        stmt = stmt.where(M.bairro.ilike(f["bairro"]))
    if f.get("tipo"):
        stmt = stmt.where(M.tipo == f["tipo"])
    if f.get("preco_min") is not None:
        stmt = stmt.where(M.preco >= f["preco_min"])
    if f.get("preco_max") is not None:
        stmt = stmt.where(M.preco <= f["preco_max"])
    if f.get("quartos_min") is not None:
        stmt = stmt.where(M.quartos >= f["quartos_min"])
    if f.get("vagas_min") is not None:
        stmt = stmt.where(M.vagas >= f["vagas_min"])
    if f.get("desembolso_max") is not None:
        stmt = stmt.where(M.desembolso_liquido <= f["desembolso_max"])
    if f.get("farol"):
        stmt = stmt.where(M.farol == f["farol"])
    if f.get("cap_rate_min") is not None:
        stmt = stmt.where(M.cap_rate >= f["cap_rate_min"])
    if f.get("desconto_min") is not None:
        stmt = stmt.where(M.desconto_regiao_pct >= f["desconto_min"])
    if f.get("cash_flow_positivo"):
        stmt = stmt.where(M.desembolso_liquido < 0)
    if not f.get("incluir_arquivados"):
        stmt = stmt.where(M.arquivado.is_(False))
    return stmt


_ORDENACAO = {
    "opportunity_score": models.Imovel.opportunity_score.desc(),
    "desembolso": models.Imovel.desembolso_liquido.asc(),
    "preco": models.Imovel.preco.asc(),
    "preco_desc": models.Imovel.preco.desc(),
    "cap_rate": models.Imovel.cap_rate.desc(),
    "desconto": models.Imovel.desconto_regiao_pct.desc(),
    "recentes": models.Imovel.criado_em.desc(),
}


def listar(db: Session, filtro: Dict[str, Any], limit: int = 50,
           offset: int = 0) -> List[models.Imovel]:
    stmt = select(models.Imovel)
    stmt = aplicar_filtros(stmt, filtro)
    ordenar = filtro.get("ordenar_por") or "opportunity_score"
    stmt = stmt.order_by(_ORDENACAO.get(ordenar, _ORDENACAO["opportunity_score"]))
    stmt = stmt.limit(limit).offset(offset)
    return list(db.scalars(stmt))


def recalcular_todos(db: Session, premissas: Optional[Premissas] = None) -> int:
    """Reavalia toda a carteira (ex.: depois de mudar premissas globais)."""
    p = premissas
    n = 0
    for orm in db.scalars(select(models.Imovel)):
        scoring_service.recalcular(db, orm, p, estimar_se_faltar=False)
        n += 1
    db.commit()
    return n
