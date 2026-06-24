"""Modelo de anúncio bruto e contrato de extractor por portal."""
from __future__ import annotations

import re
import unicodedata
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Protocol


def _slug(txt: Optional[str]) -> str:
    if not txt:
        return ""
    txt = unicodedata.normalize("NFKD", txt).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", txt.lower())


@dataclass
class Anuncio:
    """Anúncio normalizado, independente de portal."""
    fonte: str
    preco: float
    fonte_id: Optional[str] = None
    url: Optional[str] = None
    tipo: str = "apartamento"
    titulo: Optional[str] = None
    endereco: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    area_m2: Optional[float] = None
    quartos: Optional[int] = None
    banheiros: Optional[int] = None
    vagas: Optional[int] = None
    condominio_mensal: float = 0.0
    iptu_anual: float = 0.0
    aluguel_estimado: Optional[float] = None
    aluguel_origem: str = "yield"
    fotos: List[str] = field(default_factory=list)
    confianca: float = 0.85

    def assinatura(self) -> str:
        """Chave de dedupe: bairro+cidade+área(arred.)+preço(faixa de 1%)."""
        area = round(self.area_m2 or 0)
        preco_faixa = round(self.preco / max(self.preco * 0.01, 1)) if self.preco else 0
        return f"{_slug(self.cidade)}|{_slug(self.bairro)}|{area}|{preco_faixa}"

    def valido(self) -> bool:
        return bool(self.preco and self.preco > 0)

    def to_imovel_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        return d


class Extractor(Protocol):
    """Cada portal implementa este contrato (módulo isolado, falha graciosa)."""
    nome: str
    dominio: str

    def build_search_urls(self, perfil: Dict[str, Any]) -> List[str]: ...

    def parse(self, dados: Any) -> List[Anuncio]: ...


# --------------------------------------------------------------------------- #
# Helpers de parsing tolerantes (portais mudam HTML/JSON o tempo todo)
# --------------------------------------------------------------------------- #
def num(v: Any) -> Optional[float]:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = re.sub(r"[^\d,.]", "", str(v))
    if not s:
        return None
    s = s.replace(".", "").replace(",", ".") if "," in s else s.replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def inteiro(v: Any) -> Optional[int]:
    f = num(v)
    return int(f) if f is not None else None


def primeiro(dado: Dict[str, Any], *chaves, default=None):
    """Primeiro valor não-nulo entre várias chaves possíveis (resiliência)."""
    for k in chaves:
        if k in dado and dado[k] not in (None, "", []):
            return dado[k]
    return default
