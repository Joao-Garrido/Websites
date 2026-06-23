"""Orquestração da varredura (§5.2): coleta por portal -> dedupe -> ingestão
-> comparáveis -> (re)pontuação -> alertas. Falha de um portal não derruba o
resto."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from . import dedupe, firecrawl_client, sample_data
from .base import Anuncio
from .extractors import EXTRACTORS, PORTAIS

log = logging.getLogger("discovery.sweep")

EXTRACT_PROMPT = (
    "Extraia os anúncios de imóveis à venda como lista de objetos com: "
    "preco, area_m2, quartos, banheiros, vagas, condominio_mensal, iptu_anual, "
    "tipo, titulo, endereco, bairro, cidade, uf, url, aluguel (se houver)."
)


def coletar(perfil: Dict[str, Any], portais: Optional[List[str]],
            usar_firecrawl: bool, max_por_portal: int):
    """Retorna (anuncios, erros_por_portal)."""
    portais = portais or PORTAIS
    anuncios: List[Anuncio] = []
    erros: Dict[str, str] = {}

    for nome in portais:
        ext = EXTRACTORS.get(nome)
        if not ext:
            erros[nome] = "extractor inexistente"
            continue
        try:
            if usar_firecrawl and firecrawl_client.disponivel():
                urls = ext.build_search_urls(perfil)
                dados = firecrawl_client.extract(urls, EXTRACT_PROMPT)
                itens = ext.parse(dados)[:max_por_portal]
            else:
                # offline: amostra sintética por portal
                cidade = perfil.get("cidade") or (perfil.get("regioes") or ["São Paulo"])[0]
                amostra = [a for a in sample_data.gerar(max_por_portal * 2, cidade=cidade)
                           if a.fonte == nome][:max_por_portal]
                itens = amostra
            anuncios.extend(itens)
        except Exception as e:  # isolamento por portal
            log.warning("portal %s falhou: %s", nome, e)
            erros[nome] = str(e)
    return anuncios, erros


def _criterio_atende(orm, criterio: Optional[Dict[str, Any]]) -> bool:
    if not criterio:
        return orm.farol in ("verde", "amarelo")
    tipo = criterio.get("tipo")
    valor = criterio.get("valor")
    if tipo == "desembolso_max":
        return orm.desembolso_liquido is not None and orm.desembolso_liquido <= valor
    if tipo == "farol":
        ordem = {"verde": 3, "amarelo": 2, "vermelho": 1}
        return ordem.get(orm.farol, 0) >= ordem.get(valor, 0)
    return orm.farol in ("verde", "amarelo")


def ingerir(db: Session, anuncios: List[Anuncio],
            perfil: Optional[Dict[str, Any]] = None,
            perfil_id: Optional[int] = None) -> Dict[str, Any]:
    from api import models
    from api.services import comparables, imovel_service

    anuncios = dedupe.dedupe_anuncios(anuncios)
    novos: List[models.Imovel] = []
    n_novos = n_atualizados = n_dup = 0
    regioes = set()

    for a in anuncios:
        existente = dedupe.find_existing(db, a)
        dados = a.to_imovel_dict()
        if existente:
            if abs((existente.preco or 0) - a.preco) > 0.5:
                imovel_service.atualizar_imovel(db, existente, {"preco": a.preco})
                n_atualizados += 1
            else:
                n_dup += 1
            orm = existente
        else:
            orm = imovel_service.criar_imovel(db, dados, commit=True)
            novos.append(orm)
            n_novos += 1
        regioes.add((orm.bairro, orm.cidade, orm.uf, orm.tipo))

    # recalcula comparáveis das regiões afetadas e re-pontua (mediana mudou)
    for bairro, cidade, uf, tipo in regioes:
        comparables.recompute_comparavel(db, bairro, cidade, uf, tipo)
    imovel_service.recalcular_todos(db)

    # alertas de "novo" para os que nascem viáveis e atendem o perfil
    criterio = (perfil or {}).get("criterio_viabilidade")
    n_alertas = 0
    for orm in novos:
        db.refresh(orm)
        if _criterio_atende(orm, criterio):
            db.add(models.Alerta(
                imovel_id=orm.id, perfil_id=perfil_id, tipo="novo",
                motivo=f"Novo anúncio viável: {orm.farol}, desembolso "
                       f"R${(orm.desembolso_liquido or 0):,.0f}/mês, score "
                       f"{orm.opportunity_score}.",
            ))
            n_alertas += 1
    db.commit()

    return {
        "encontrados": len(anuncios),
        "novos": n_novos,
        "atualizados": n_atualizados,
        "duplicados": n_dup,
        "alertas_gerados": n_alertas,
    }


def sweep(db: Session, perfil: Dict[str, Any], portais=None,
          usar_firecrawl: bool = False, max_por_portal: int = 20,
          perfil_id: Optional[int] = None) -> Dict[str, Any]:
    anuncios, erros = coletar(perfil, portais, usar_firecrawl, max_por_portal)
    stats = ingerir(db, anuncios, perfil, perfil_id)
    stats["erros"] = erros
    return stats
