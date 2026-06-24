"""Modelos ORM (espelham o §9). SQLite em dev, compatível com Postgres."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (JSON, Boolean, DateTime, Float, ForeignKey, Integer,
                        String, Text, func)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Imovel(Base):
    __tablename__ = "imoveis"

    id: Mapped[int] = mapped_column(primary_key=True)
    fonte: Mapped[str] = mapped_column(String(64), default="manual")
    url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    fonte_id: Mapped[Optional[str]] = mapped_column(String(256), nullable=True, index=True)
    confianca: Mapped[float] = mapped_column(Float, default=1.0)

    tipo: Mapped[str] = mapped_column(String(32), default="apartamento")
    titulo: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    endereco: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    bairro: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    cidade: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    uf: Mapped[Optional[str]] = mapped_column(String(2), nullable=True, index=True)
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    preco: Mapped[float] = mapped_column(Float)
    area_m2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quartos: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    banheiros: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    vagas: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    condominio_mensal: Mapped[float] = mapped_column(Float, default=0.0)
    iptu_anual: Mapped[float] = mapped_column(Float, default=0.0)

    aluguel_estimado: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    aluguel_origem: Mapped[str] = mapped_column(String(32), default="yield")

    preco_m2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    desconto_regiao_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    opportunity_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, index=True)
    farol: Mapped[Optional[str]] = mapped_column(String(16), nullable=True, index=True)
    desembolso_liquido: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pct_coberta: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cap_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    score_breakdown: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    metricas: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    fotos: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    estado_conservacao: Mapped[float] = mapped_column(Float, default=0.7)
    arquivado: Mapped[bool] = mapped_column(Boolean, default=False)

    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now())

    historico: Mapped[list["HistoricoPreco"]] = relationship(
        back_populates="imovel", cascade="all, delete-orphan")
    alertas: Mapped[list["Alerta"]] = relationship(
        back_populates="imovel", cascade="all, delete-orphan")
    cenarios: Mapped[list["Cenario"]] = relationship(
        back_populates="imovel", cascade="all, delete-orphan")


class HistoricoPreco(Base):
    __tablename__ = "historico_preco"

    id: Mapped[int] = mapped_column(primary_key=True)
    imovel_id: Mapped[int] = mapped_column(ForeignKey("imoveis.id", ondelete="CASCADE"), index=True)
    data: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    preco: Mapped[float] = mapped_column(Float)

    imovel: Mapped["Imovel"] = relationship(back_populates="historico")


class PerfilBusca(Base):
    __tablename__ = "perfis_busca"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(128))
    regioes: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    tipo: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    preco_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    preco_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quartos_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # critério de viabilidade: {"tipo":"desembolso_max","valor":1000} ou {"tipo":"farol","valor":"verde"}
    criterio_viabilidade: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    agendamento: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  # diario|semanal|None
    monitorar: Mapped[bool] = mapped_column(Boolean, default=False)
    filtros_extra: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    ultima_execucao: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class Alerta(Base):
    __tablename__ = "alertas"

    id: Mapped[int] = mapped_column(primary_key=True)
    imovel_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("imoveis.id", ondelete="CASCADE"), nullable=True, index=True)
    perfil_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("perfis_busca.id", ondelete="SET NULL"), nullable=True)
    tipo: Mapped[str] = mapped_column(String(32))  # novo|queda_preco|cruzou_viabilidade
    motivo: Mapped[str] = mapped_column(Text)
    lido: Mapped[bool] = mapped_column(Boolean, default=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    imovel: Mapped[Optional["Imovel"]] = relationship(back_populates="alertas")


class Comparavel(Base):
    __tablename__ = "comparaveis"

    id: Mapped[int] = mapped_column(primary_key=True)
    regiao: Mapped[str] = mapped_column(String(256), index=True)
    tipo: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    preco_m2_mediana_venda: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    preco_m2_mediana_aluguel: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    n_amostras: Mapped[int] = mapped_column(Integer, default=0)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now())


class PremissasModel(Base):
    """Premissas globais (linha única id=1)."""
    __tablename__ = "premissas"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    dados: Mapped[dict] = mapped_column(JSON)  # serialização de engine.Premissas
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now())


class Cenario(Base):
    __tablename__ = "cenarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    imovel_id: Mapped[int] = mapped_column(ForeignKey("imoveis.id", ondelete="CASCADE"), index=True)
    nome: Mapped[str] = mapped_column(String(128))
    overrides: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    entrada: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    aporte_extra: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    modo_amortizacao: Mapped[str] = mapped_column(String(16), default="prazo")
    resultados_cache: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    imovel: Mapped["Imovel"] = relationship(back_populates="cenarios")
