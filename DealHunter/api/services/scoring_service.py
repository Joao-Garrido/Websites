"""Liga o engine financeiro à persistência: pontua imóveis na ingestão e
monta o detalhe completo (cenário, break-evens, cronograma) por imóvel."""
from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from engine import (Imovel as EngImovel, Premissas, amortizacao_extra, avaliar,
                    break_evens, pontuar, taxa_mensal)

from .. import models
from . import comparables, rent_estimate
from .premissas_service import get_premissas


def to_engine_imovel(orm: models.Imovel, mediana_venda: Optional[float],
                     aluguel: float) -> EngImovel:
    return EngImovel(
        preco=orm.preco,
        aluguel_estimado=aluguel,
        area_m2=orm.area_m2 or 0.0,
        quartos=orm.quartos or 0,
        vagas=orm.vagas or 0,
        condominio_mensal=orm.condominio_mensal or 0.0,
        iptu_anual=orm.iptu_anual or 0.0,
        aluguel_origem=orm.aluguel_origem or "yield",
        preco_m2_mediana_regiao=mediana_venda,
        estado_conservacao=orm.estado_conservacao if orm.estado_conservacao is not None else 0.7,
        quartos_demandados=2,
    )


def recalcular(db: Session, orm: models.Imovel,
               premissas: Optional[Premissas] = None,
               estimar_se_faltar: bool = True) -> models.Imovel:
    """Reavalia o imóvel e grava score/farol/métricas no registro."""
    p = premissas or get_premissas(db)

    aluguel = orm.aluguel_estimado
    origem = orm.aluguel_origem or "yield"
    if (aluguel is None or aluguel <= 0) and estimar_se_faltar:
        aluguel, origem = rent_estimate.estimar_aluguel(db, orm)
        orm.aluguel_estimado = aluguel
        orm.aluguel_origem = origem
    elif aluguel is None:
        aluguel = 0.0

    mediana = comparables.mediana_para_imovel(db, orm)
    eng_im = to_engine_imovel(orm, mediana, aluguel)

    av = avaliar(eng_im, p)
    res = pontuar(av)

    orm.preco_m2 = eng_im.preco_m2
    orm.desconto_regiao_pct = eng_im.desconto_regiao_pct
    orm.opportunity_score = round(res.score, 2)
    orm.farol = res.farol
    orm.desembolso_liquido = round(av.desembolso_liquido, 2)
    orm.pct_coberta = round(av.pct_coberta, 4)
    orm.cap_rate = round(av.cap_rate, 6)
    orm.score_breakdown = {
        "score": round(res.score, 2),
        "tag": res.tag,
        "componentes": {k: round(v, 4) for k, v in res.breakdown.componentes.items()},
        "pesos": res.breakdown.pesos,
        "contribuicoes": {k: round(v, 3) for k, v in res.breakdown.contribuicoes.items()},
    }
    orm.metricas = {
        "entrada": round(av.entrada, 2),
        "parcela": round(av.tabela.primeira_parcela, 2),
        "aluguel_liquido": round(av.aluguel.liquido, 2),
        "custos_posse": round(av.custos.total, 2),
        "capital_investido": round(av.capital.total, 2),
        "cash_on_cash": round(av.cash_on_cash, 4),
        "roe_economico": round(av.roe_economico, 4),
        "yield_bruto": round(av.yield_bruto, 4),
        "ltv": round(av.ltv, 4),
        "tir_anual": round(av.tir.tir_anual, 4) if av.tir.tir_anual is not None else None,
        "vpl": round(av.tir.vpl, 2),
    }
    return orm


def _premissas_com_overrides(p: Premissas, ov: Dict[str, Any]) -> Premissas:
    campos_premissas = {
        "taxa_aa", "tr_aa", "sistema", "prazo_meses", "valorizacao_aa",
        "vacancia_meses_ano", "aluga_por_imobiliaria", "taxa_admin_imob",
        "horizonte_anos", "entrada_padrao_pct",
    }
    patch = {k: v for k, v in ov.items() if k in campos_premissas and v is not None}
    return p.com(**patch) if patch else p


def detalhe(db: Session, orm: models.Imovel,
            cenario: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Detalhe financeiro completo para a tela do imóvel (com overrides)."""
    cenario = cenario or {}
    p_base = get_premissas(db)
    p = _premissas_com_overrides(p_base, cenario)

    aluguel = cenario.get("aluguel")
    if aluguel is None:
        aluguel = orm.aluguel_estimado
        if aluguel is None or aluguel <= 0:
            aluguel, _ = rent_estimate.estimar_aluguel(db, orm)

    entrada = cenario.get("entrada")
    if entrada is None:
        entrada = orm.preco * p.entrada_padrao_pct

    mediana = comparables.mediana_para_imovel(db, orm)
    eng_im = to_engine_imovel(orm, mediana, aluguel)
    av = avaliar(eng_im, p, entrada=entrada)
    res = pontuar(av)

    # cronograma amostrado (saldo devedor x patrimônio) anual
    cronograma = []
    saldos = av.tabela.saldos
    valoriz_aa = p.valorizacao_aa
    for ano in range(0, p.horizonte_anos + 1):
        if ano == 0:
            saldo = av.valor_financiado
        else:
            idx = min(ano * 12, len(saldos)) - 1
            saldo = saldos[idx]
        valor_imovel = orm.preco * (1 + valoriz_aa) ** ano
        cronograma.append({
            "ano": ano,
            "saldo_devedor": round(saldo, 2),
            "valor_imovel": round(valor_imovel, 2),
            "patrimonio": round(valor_imovel - saldo, 2),
        })

    # break-evens
    be = break_evens(orm.preco, aluguel, entrada, p,
                     condominio=orm.condominio_mensal or 0.0,
                     iptu_anual=orm.iptu_anual or 0.0)

    # amortização extra (se houver aporte)
    amort_extra = None
    aporte = cenario.get("aporte_extra")
    if aporte:
        im = taxa_mensal(p.taxa_aa, p.tr_aa)
        r = amortizacao_extra(av.valor_financiado, p.prazo_meses, im, aporte,
                              sistema=p.sistema,
                              modo=cenario.get("modo_amortizacao", "prazo"))
        amort_extra = asdict(r)

    return {
        "imovel_id": orm.id,
        "premissas_aplicadas": {
            "taxa_aa": p.taxa_aa, "tr_aa": p.tr_aa, "sistema": p.sistema,
            "prazo_meses": p.prazo_meses, "valorizacao_aa": p.valorizacao_aa,
            "vacancia_meses_ano": p.vacancia_meses_ano,
            "horizonte_anos": p.horizonte_anos,
        },
        "entrada": round(entrada, 2),
        "aluguel_bruto": round(aluguel, 2),
        "aluguel_origem": orm.aluguel_origem,
        "valor_financiado": round(av.valor_financiado, 2),
        "i_m": av.i_m,
        "parcela_1": round(av.tabela.primeira_parcela, 2),
        "parcela_ultima": round(av.tabela.parcelas[-1], 2),
        "total_juros": round(av.tabela.total_juros, 2),
        "aluguel_liquido_breakdown": av.aluguel.origem_breakdown,
        "custos_posse": asdict(av.custos),
        "capital_investido": asdict(av.capital),
        "desembolso_liquido": round(av.desembolso_liquido, 2),
        "desembolso_waterfall": av.desembolso.waterfall,
        "pct_coberta": round(av.pct_coberta, 4),
        "farol": res.farol,
        "opportunity_score": round(res.score, 2),
        "score_breakdown": {
            "componentes": res.breakdown.componentes,
            "pesos": res.breakdown.pesos,
            "contribuicoes": res.breakdown.contribuicoes,
            "tag": res.tag,
        },
        "metricas": {
            "cap_rate": round(av.cap_rate, 6),
            "yield_bruto": round(av.yield_bruto, 6),
            "cash_on_cash": round(av.cash_on_cash, 6),
            "roe_economico": round(av.roe_economico, 6),
            "ltv": round(av.ltv, 6),
            "tir_anual": av.tir.tir_anual,
            "vpl": round(av.tir.vpl, 2),
        },
        "break_evens": {
            "entrada_equilibrio": be.entrada_equilibrio,
            "aluguel_equilibrio": be.aluguel_equilibrio,
            "prazo_equilibrio": be.prazo_equilibrio,
        },
        "cronograma": cronograma,
        "amortizacao_extra": amort_extra,
    }
