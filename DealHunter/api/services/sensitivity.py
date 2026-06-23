"""Heatmaps de sensibilidade 2D e Monte Carlo (Fase 6/§8)."""
from __future__ import annotations

import random
import statistics
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from engine import Imovel as EngImovel
from engine import Premissas, avaliar

from .. import models
from . import comparables, rent_estimate
from .premissas_service import get_premissas


def _eng_imovel(db: Session, orm: models.Imovel, aluguel: float) -> EngImovel:
    mediana = comparables.mediana_para_imovel(db, orm)
    return EngImovel(
        preco=orm.preco, aluguel_estimado=aluguel,
        area_m2=orm.area_m2 or 0.0, quartos=orm.quartos or 0, vagas=orm.vagas or 0,
        condominio_mensal=orm.condominio_mensal or 0.0, iptu_anual=orm.iptu_anual or 0.0,
        preco_m2_mediana_regiao=mediana,
        estado_conservacao=orm.estado_conservacao if orm.estado_conservacao is not None else 0.7,
    )


def _ponto(db, orm, p: Premissas, entrada: float, aluguel: float,
           metrica: str) -> float:
    eng = _eng_imovel(db, orm, aluguel)
    av = avaliar(eng, p, entrada=entrada, calcular_tir=(metrica == "tir"))
    if metrica == "tir":
        return av.tir.tir_anual if av.tir.tir_anual is not None else float("nan")
    return av.desembolso_liquido


def _linspace(a: float, b: float, n: int) -> List[float]:
    if n <= 1:
        return [a]
    return [a + (b - a) * i / (n - 1) for i in range(n)]


def _aplicar_eixo(p: Premissas, entrada: float, aluguel: float, eixo: str,
                  valor: float):
    """Retorna (premissas, entrada, aluguel) com o eixo aplicado."""
    if eixo == "entrada":
        return p, valor, aluguel
    if eixo == "aluguel":
        return p, entrada, valor
    if eixo == "taxa_aa":
        return p.com(taxa_aa=valor), entrada, aluguel
    if eixo == "prazo_meses":
        return p.com(prazo_meses=int(round(valor))), entrada, aluguel
    if eixo == "valorizacao_aa":
        return p.com(valorizacao_aa=valor), entrada, aluguel
    return p, entrada, aluguel


def heatmap(db: Session, orm: models.Imovel, req) -> Dict[str, Any]:
    p0 = get_premissas(db)
    aluguel0 = orm.aluguel_estimado or rent_estimate.estimar_aluguel(db, orm)[0]
    entrada0 = orm.preco * p0.entrada_padrao_pct

    xs = _linspace(req.x_min, req.x_max, req.passos)
    ys = _linspace(req.y_min, req.y_max, req.passos)
    grid: List[List[float]] = []
    for yv in ys:
        linha = []
        for xv in xs:
            p, entrada, aluguel = _aplicar_eixo(p0, entrada0, aluguel0, req.eixo_x, xv)
            p, entrada, aluguel = _aplicar_eixo(p, entrada, aluguel, req.eixo_y, yv)
            val = _ponto(db, orm, p, entrada, aluguel, req.metrica)
            linha.append(round(val, 4))
        grid.append(linha)
    return {
        "eixo_x": req.eixo_x, "eixo_y": req.eixo_y, "metrica": req.metrica,
        "xs": [round(x, 4) for x in xs], "ys": [round(y, 4) for y in ys],
        "grid": grid,
    }


def monte_carlo(db: Session, orm: models.Imovel, req) -> Dict[str, Any]:
    p0 = get_premissas(db)
    aluguel = orm.aluguel_estimado or rent_estimate.estimar_aluguel(db, orm)[0]
    entrada = req.entrada if req.entrada is not None else orm.preco * p0.entrada_padrao_pct

    tirs: List[float] = []
    desembolsos: List[float] = []
    n_desembolso_pos = 0
    n_verde = 0

    for _ in range(max(100, min(req.n, 20000))):
        valoriz = random.gauss(req.valorizacao_media, req.valorizacao_dp)
        vac = max(0.0, random.gauss(req.vacancia_media_meses, req.vacancia_dp_meses))
        taxa = max(0.001, random.gauss(req.taxa_media_aa, req.taxa_dp_aa))
        p = p0.com(valorizacao_aa=valoriz, vacancia_meses_ano=vac, taxa_aa=taxa)
        eng = _eng_imovel(db, orm, aluguel)
        av = avaliar(eng, p, entrada=entrada)
        if av.tir.tir_anual is not None:
            tirs.append(av.tir.tir_anual)
        desembolsos.append(av.desembolso_liquido)
        if av.desembolso_liquido > 0:
            n_desembolso_pos += 1
        if av.desembolso_liquido <= 0:
            n_verde += 1

    def pct(vals, q):
        if not vals:
            return None
        vals = sorted(vals)
        idx = min(len(vals) - 1, int(q * len(vals)))
        return round(vals[idx], 4)

    total = len(desembolsos)
    return {
        "n": total,
        "tir": {
            "media": round(statistics.fmean(tirs), 4) if tirs else None,
            "p5": pct(tirs, 0.05), "p25": pct(tirs, 0.25),
            "p50": pct(tirs, 0.50), "p75": pct(tirs, 0.75), "p95": pct(tirs, 0.95),
        },
        "desembolso": {
            "media": round(statistics.fmean(desembolsos), 2) if desembolsos else None,
            "p5": pct(desembolsos, 0.05), "p50": pct(desembolsos, 0.50),
            "p95": pct(desembolsos, 0.95),
        },
        "prob_desembolso_positivo": round(n_desembolso_pos / total, 4) if total else None,
        "prob_se_paga": round(n_verde / total, 4) if total else None,
    }
