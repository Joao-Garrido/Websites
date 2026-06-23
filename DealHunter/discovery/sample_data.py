"""Gerador de anúncios sintéticos para demo/testes offline (sem Firecrawl).

Cria variação realista de preço/m² para que o detector de subvalorização e o
farol tenham o que ranquear.
"""
from __future__ import annotations

import random
from typing import List

from .base import Anuncio

BAIRROS = {
    "São Paulo": [("Pinheiros", "SP"), ("Vila Mariana", "SP"), ("Tatuapé", "SP")],
    "Marília": [("Centro", "SP"), ("Fragata", "SP")],
}


def gerar(n: int = 24, cidade: str = "São Paulo", seed: int = 42) -> List[Anuncio]:
    rng = random.Random(seed)
    bairros = BAIRROS.get(cidade, [("Centro", "SP")])
    portais = ["zap", "vivareal", "quintoandar", "imovelweb", "olx", "chavesnamao"]
    anuncios: List[Anuncio] = []
    for i in range(n):
        bairro, uf = rng.choice(bairros)
        area = rng.choice([45, 55, 60, 70, 85, 100, 120])
        # preço/m² base por bairro com ruído; alguns saem subvalorizados
        base_m2 = {"Pinheiros": 12000, "Vila Mariana": 11000, "Tatuapé": 8500,
                   "Centro": 5000, "Fragata": 4200}.get(bairro, 7000)
        fator = rng.choice([0.78, 0.85, 0.92, 1.0, 1.0, 1.08, 1.15])
        preco = round(area * base_m2 * fator, -3)
        tipo = "casa" if area >= 100 and rng.random() < 0.4 else "apartamento"
        anuncios.append(Anuncio(
            fonte=rng.choice(portais),
            fonte_id=f"S{seed}-{i}",
            url=f"https://exemplo/{i}",
            tipo=tipo,
            titulo=f"{tipo.title()} {area}m² {bairro}",
            bairro=bairro, cidade=cidade, uf=uf,
            lat=-23.55 + rng.uniform(-0.1, 0.1),
            lng=-46.63 + rng.uniform(-0.1, 0.1),
            preco=preco, area_m2=area,
            quartos=rng.choice([1, 2, 2, 3, 3]),
            banheiros=rng.choice([1, 2, 2, 3]),
            vagas=rng.choice([0, 1, 1, 2]),
            condominio_mensal=rng.choice([0, 400, 600, 800, 1000]) if tipo == "apartamento" else 0,
            iptu_anual=round(preco * 0.005),
            aluguel_estimado=(round(preco * rng.uniform(0.0035, 0.005)) if rng.random() < 0.5 else None),
            aluguel_origem="informado",
            confianca=0.9,
        ))
    return anuncios
