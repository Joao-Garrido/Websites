"""Import manual de anúncios via CSV/JSON (§10.7 / fallback do §5.2)."""
from __future__ import annotations

import csv
import io
import json
from typing import Any, Dict, List

from .base import Anuncio, inteiro, num


def _de_dict(d: Dict[str, Any], fonte: str = "import") -> Anuncio:
    return Anuncio(
        fonte=d.get("fonte", fonte),
        fonte_id=str(d["fonte_id"]) if d.get("fonte_id") else None,
        url=d.get("url"),
        tipo=d.get("tipo", "apartamento"),
        titulo=d.get("titulo"),
        endereco=d.get("endereco"),
        bairro=d.get("bairro"),
        cidade=d.get("cidade"),
        uf=d.get("uf"),
        lat=num(d.get("lat")),
        lng=num(d.get("lng")),
        preco=num(d.get("preco")) or 0.0,
        area_m2=num(d.get("area_m2")),
        quartos=inteiro(d.get("quartos")),
        banheiros=inteiro(d.get("banheiros")),
        vagas=inteiro(d.get("vagas")),
        condominio_mensal=num(d.get("condominio_mensal")) or 0.0,
        iptu_anual=num(d.get("iptu_anual")) or 0.0,
        aluguel_estimado=num(d.get("aluguel_estimado")),
        aluguel_origem=d.get("aluguel_origem", "informado" if d.get("aluguel_estimado") else "yield"),
        confianca=num(d.get("confianca")) or 1.0,
    )


def importar(conteudo: str, formato: str = "json") -> List[Anuncio]:
    formato = formato.lower()
    if formato == "json":
        dados = json.loads(conteudo)
        if isinstance(dados, dict):
            dados = dados.get("imoveis") or dados.get("items") or [dados]
        return [a for a in (_de_dict(d) for d in dados) if a.valido()]
    if formato == "csv":
        leitor = csv.DictReader(io.StringIO(conteudo))
        return [a for a in (_de_dict(linha) for linha in leitor) if a.valido()]
    raise ValueError(f"Formato não suportado: {formato}")
