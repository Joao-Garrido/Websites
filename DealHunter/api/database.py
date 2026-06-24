"""Configuração do banco (SQLite em dev, pronto para Postgres).

Defina DATABASE_URL para apontar a um Postgres em produção, ex.:
    postgresql+psycopg://user:pass@host/db
"""
from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "sqlite:///./dealhunter.db"
)

# check_same_thread só é necessário/válido no SQLite.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency do FastAPI: sessão por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Cria as tabelas (idempotente)."""
    from . import models  # noqa: F401  (registra os modelos no metadata)
    Base.metadata.create_all(bind=engine)
