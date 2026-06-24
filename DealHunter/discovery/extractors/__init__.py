"""Registro de extractors por portal. Cada um é isolado: se um quebrar,
os outros seguem (§5.2)."""
from . import chavesnamao, imovelweb, olx, quintoandar, vivareal, zap

EXTRACTORS = {
    e.extractor.nome: e.extractor
    for e in (zap, vivareal, quintoandar, imovelweb, olx, chavesnamao)
}

PORTAIS = list(EXTRACTORS.keys())


def get_extractor(nome: str):
    return EXTRACTORS.get(nome)
