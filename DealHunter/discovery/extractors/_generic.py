"""Extractor genérico configurável. Cada portal é uma instância isolada com
seus templates de URL e dicas de campo; falha de parsing de um item nunca
derruba os demais (§5.2)."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from urllib.parse import quote

from ..base import Anuncio, inteiro, num, primeiro

log = logging.getLogger("discovery.extractor")


def _slug_perfil(perfil: Dict[str, Any]) -> Dict[str, str]:
    cidade = (perfil.get("cidade") or (perfil.get("regioes") or [""])[0] or "").strip()
    return {
        "cidade": quote(cidade.lower().replace(" ", "-")),
        "tipo": (perfil.get("tipo") or "imovel"),
    }


class GenericExtractor:
    def __init__(self, nome: str, dominio: str, url_templates: List[str],
                 tipo_default: str = "apartamento"):
        self.nome = nome
        self.dominio = dominio
        self.url_templates = url_templates
        self.tipo_default = tipo_default

    def build_search_urls(self, perfil: Dict[str, Any]) -> List[str]:
        ctx = _slug_perfil(perfil)
        urls = []
        for t in self.url_templates:
            try:
                urls.append(t.format(**ctx))
            except (KeyError, IndexError):
                continue
        return urls

    # --- parsing tolerante ------------------------------------------------- #
    def _itens(self, dados: Any) -> List[Dict[str, Any]]:
        if dados is None:
            return []
        if isinstance(dados, list):
            return [d for d in dados if isinstance(d, dict)]
        if isinstance(dados, dict):
            for chave in ("items", "results", "listings", "anuncios", "data", "imoveis"):
                v = dados.get(chave)
                if isinstance(v, list):
                    return [d for d in v if isinstance(d, dict)]
            if "data" in dados and isinstance(dados["data"], dict):
                return self._itens(dados["data"])
            # dict único parecendo um anúncio
            if any(k in dados for k in ("preco", "price", "valor")):
                return [dados]
        return []

    def _parse_item(self, it: Dict[str, Any]) -> Optional[Anuncio]:
        preco = num(primeiro(it, "preco", "price", "valor", "sale_price"))
        if not preco:
            return None
        return Anuncio(
            fonte=self.nome,
            fonte_id=str(primeiro(it, "id", "listing_id", "codigo", default="")) or None,
            url=primeiro(it, "url", "link", "href"),
            tipo=primeiro(it, "tipo", "type", "property_type", default=self.tipo_default),
            titulo=primeiro(it, "titulo", "title", "name"),
            endereco=primeiro(it, "endereco", "address", "logradouro"),
            bairro=primeiro(it, "bairro", "neighborhood", "district"),
            cidade=primeiro(it, "cidade", "city", "municipio"),
            uf=primeiro(it, "uf", "state", "estado"),
            lat=num(primeiro(it, "lat", "latitude")),
            lng=num(primeiro(it, "lng", "lon", "longitude")),
            area_m2=num(primeiro(it, "area_m2", "area", "usable_area", "size")),
            quartos=inteiro(primeiro(it, "quartos", "bedrooms", "dormitorios", "rooms")),
            banheiros=inteiro(primeiro(it, "banheiros", "bathrooms")),
            vagas=inteiro(primeiro(it, "vagas", "parking", "garagem", "parking_spaces")),
            condominio_mensal=num(primeiro(it, "condominio", "condominio_mensal",
                                           "condo_fee", default=0.0)) or 0.0,
            iptu_anual=num(primeiro(it, "iptu", "iptu_anual", "property_tax",
                                    default=0.0)) or 0.0,
            aluguel_estimado=num(primeiro(it, "aluguel", "rent", "rental_price")),
            aluguel_origem="informado" if primeiro(it, "aluguel", "rent") else "yield",
            fotos=primeiro(it, "fotos", "photos", "images", default=[]) or [],
        )

    def parse(self, dados: Any) -> List[Anuncio]:
        out: List[Anuncio] = []
        for it in self._itens(dados):
            try:
                a = self._parse_item(it)
                if a and a.valido():
                    out.append(a)
            except Exception as e:  # nunca derruba o lote
                log.warning("%s: falha ao parsear item: %s", self.nome, e)
                continue
        return out
