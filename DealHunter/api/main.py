"""DealHunter Imobiliário — API (FastAPI).

Sobe a aplicação, cria as tabelas e registra os routers. A matemática vive no
pacote `engine` (fonte de verdade); aqui é só orquestração/persistência.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import (alertas, busca, cenarios, comparacao, descoberta, imoveis,
                      perfis, premissas)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="DealHunter Imobiliário",
    description="Motor de descoberta e triagem de imóveis alavancados "
                "('o outro paga a parcela').",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def health():
    return {
        "app": "DealHunter Imobiliário",
        "status": "ok",
        "disclaimer": "Estimativas, não recomendação de investimento. "
                      "IR é aproximação isolada por imóvel. "
                      "Valorização passada ≠ futura.",
    }


for r in (premissas.router, imoveis.router, cenarios.router, busca.router,
          perfis.router, alertas.router, descoberta.router, comparacao.router):
    app.include_router(r)
