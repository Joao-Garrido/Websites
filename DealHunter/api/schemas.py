"""Schemas Pydantic (v2) para request/response da API."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --------------------------------------------------------------------------- #
# Imóvel
# --------------------------------------------------------------------------- #
class ImovelBase(BaseModel):
    fonte: str = "manual"
    url: Optional[str] = None
    fonte_id: Optional[str] = None
    confianca: float = 1.0
    tipo: str = "apartamento"
    titulo: Optional[str] = None
    endereco: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    preco: float
    area_m2: Optional[float] = None
    quartos: Optional[int] = None
    banheiros: Optional[int] = None
    vagas: Optional[int] = None
    condominio_mensal: float = 0.0
    iptu_anual: float = 0.0
    aluguel_estimado: Optional[float] = None
    aluguel_origem: str = "yield"
    estado_conservacao: float = 0.7
    fotos: List[str] = Field(default_factory=list)


class ImovelCreate(ImovelBase):
    pass


class ImovelUpdate(BaseModel):
    preco: Optional[float] = None
    aluguel_estimado: Optional[float] = None
    aluguel_origem: Optional[str] = None
    condominio_mensal: Optional[float] = None
    iptu_anual: Optional[float] = None
    quartos: Optional[int] = None
    vagas: Optional[int] = None
    estado_conservacao: Optional[float] = None
    arquivado: Optional[bool] = None


class ImovelOut(ImovelBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    preco_m2: Optional[float] = None
    desconto_regiao_pct: Optional[float] = None
    opportunity_score: Optional[float] = None
    farol: Optional[str] = None
    desembolso_liquido: Optional[float] = None
    pct_coberta: Optional[float] = None
    cap_rate: Optional[float] = None
    score_breakdown: Optional[Dict[str, Any]] = None
    metricas: Optional[Dict[str, Any]] = None
    arquivado: bool = False
    criado_em: Optional[datetime] = None
    atualizado_em: Optional[datetime] = None


class HistoricoPrecoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    data: datetime
    preco: float


# --------------------------------------------------------------------------- #
# Perfil de busca
# --------------------------------------------------------------------------- #
class PerfilBuscaBase(BaseModel):
    nome: str
    regioes: List[str] = Field(default_factory=list)
    tipo: Optional[str] = None
    preco_min: Optional[float] = None
    preco_max: Optional[float] = None
    quartos_min: Optional[int] = None
    criterio_viabilidade: Optional[Dict[str, Any]] = None
    agendamento: Optional[str] = None
    monitorar: bool = False
    filtros_extra: Optional[Dict[str, Any]] = None


class PerfilBuscaCreate(PerfilBuscaBase):
    pass


class PerfilBuscaOut(PerfilBuscaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    criado_em: Optional[datetime] = None
    ultima_execucao: Optional[datetime] = None


# --------------------------------------------------------------------------- #
# Alerta
# --------------------------------------------------------------------------- #
class AlertaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    imovel_id: Optional[int] = None
    perfil_id: Optional[int] = None
    tipo: str
    motivo: str
    lido: bool
    criado_em: Optional[datetime] = None


class AlertaUpdate(BaseModel):
    lido: bool = True


# --------------------------------------------------------------------------- #
# Comparável
# --------------------------------------------------------------------------- #
class ComparavelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    regiao: str
    tipo: Optional[str] = None
    preco_m2_mediana_venda: Optional[float] = None
    preco_m2_mediana_aluguel: Optional[float] = None
    n_amostras: int


# --------------------------------------------------------------------------- #
# Premissas (espelha engine.Premissas)
# --------------------------------------------------------------------------- #
class PremissasSchema(BaseModel):
    taxa_aa: float = 0.115
    tr_aa: float = 0.0
    sistema: str = "SAC"
    prazo_meses: int = 360
    entrada_padrao_pct: float = 0.20
    ltv_max: float = 0.80
    mip_pct_mes: float = 0.00025
    dfi_pct_mes: float = 0.0001
    taxa_adm_fin: float = 25.0
    itbi_pct: float = 0.03
    escritura_pct: float = 0.01
    registro_pct: float = 0.0075
    avaliacao_banco: float = 3000.0
    vacancia_meses_ano: float = 1.0
    aluga_por_imobiliaria: bool = False
    taxa_admin_imob: float = 0.08
    tabela_ir_carne_leao: List[List[float]] = Field(default_factory=list)
    manutencao_aa_pct: float = 0.005
    valorizacao_aa: float = 0.05
    inflacao_aa: float = 0.045
    horizonte_anos: int = 10
    taxa_desconto_vpl: float = 0.105
    corretagem_venda_pct: float = 0.06
    ir_ganho_capital_pct: float = 0.15
    limite_amarelo: float = 1500.0
    pesos_opportunity_score: Dict[str, float] = Field(default_factory=dict)
    cap_rate_benchmark: float = 0.06


class PremissasUpdate(BaseModel):
    """Patch parcial das premissas globais."""
    model_config = ConfigDict(extra="forbid")
    taxa_aa: Optional[float] = None
    tr_aa: Optional[float] = None
    sistema: Optional[str] = None
    prazo_meses: Optional[int] = None
    entrada_padrao_pct: Optional[float] = None
    ltv_max: Optional[float] = None
    mip_pct_mes: Optional[float] = None
    dfi_pct_mes: Optional[float] = None
    taxa_adm_fin: Optional[float] = None
    itbi_pct: Optional[float] = None
    escritura_pct: Optional[float] = None
    registro_pct: Optional[float] = None
    avaliacao_banco: Optional[float] = None
    vacancia_meses_ano: Optional[float] = None
    aluga_por_imobiliaria: Optional[bool] = None
    taxa_admin_imob: Optional[float] = None
    manutencao_aa_pct: Optional[float] = None
    valorizacao_aa: Optional[float] = None
    inflacao_aa: Optional[float] = None
    horizonte_anos: Optional[int] = None
    taxa_desconto_vpl: Optional[float] = None
    corretagem_venda_pct: Optional[float] = None
    ir_ganho_capital_pct: Optional[float] = None
    limite_amarelo: Optional[float] = None
    pesos_opportunity_score: Optional[Dict[str, float]] = None
    cap_rate_benchmark: Optional[float] = None


# --------------------------------------------------------------------------- #
# Cenário / avaliação
# --------------------------------------------------------------------------- #
class CenarioInput(BaseModel):
    """Overrides para recálculo ao vivo (sliders) sem persistir."""
    entrada: Optional[float] = None
    taxa_aa: Optional[float] = None
    prazo_meses: Optional[int] = None
    sistema: Optional[str] = None
    aluguel: Optional[float] = None
    valorizacao_aa: Optional[float] = None
    vacancia_meses_ano: Optional[float] = None
    aluga_por_imobiliaria: Optional[bool] = None
    taxa_admin_imob: Optional[float] = None
    horizonte_anos: Optional[int] = None
    aporte_extra: Optional[float] = None
    modo_amortizacao: Optional[str] = "prazo"


class CenarioCreate(BaseModel):
    nome: str
    overrides: Dict[str, Any] = Field(default_factory=dict)
    entrada: Optional[float] = None
    aporte_extra: Optional[float] = None
    modo_amortizacao: str = "prazo"


class CenarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    imovel_id: int
    nome: str
    overrides: Dict[str, Any]
    entrada: Optional[float] = None
    aporte_extra: Optional[float] = None
    modo_amortizacao: str
    resultados_cache: Optional[Dict[str, Any]] = None


# --------------------------------------------------------------------------- #
# Busca em linguagem natural
# --------------------------------------------------------------------------- #
class BuscaNLRequest(BaseModel):
    frase: str
    salvar_como_perfil: Optional[str] = None


class FiltroEstruturado(BaseModel):
    cidade: Optional[str] = None
    uf: Optional[str] = None
    bairros: Optional[List[str]] = None
    tipo: Optional[str] = None
    preco_max: Optional[float] = None
    preco_min: Optional[float] = None
    quartos_min: Optional[int] = None
    vagas_min: Optional[int] = None
    desembolso_max: Optional[float] = None
    farol: Optional[str] = None
    cap_rate_min: Optional[float] = None
    desconto_min: Optional[float] = None
    cash_flow_positivo: Optional[bool] = None
    ordenar_por: Optional[str] = "opportunity_score"


class BuscaNLResponse(BaseModel):
    filtro: FiltroEstruturado
    fonte_parser: str  # "claude" | "heuristico"
    total: int
    resultados: List[ImovelOut]
    perfil_id: Optional[int] = None


# --------------------------------------------------------------------------- #
# Descoberta / import
# --------------------------------------------------------------------------- #
class SweepRequest(BaseModel):
    perfil_id: Optional[int] = None
    portais: Optional[List[str]] = None
    usar_firecrawl: bool = False
    max_por_portal: int = 20


class SweepResponse(BaseModel):
    encontrados: int
    novos: int
    atualizados: int
    duplicados: int
    erros: Dict[str, str] = Field(default_factory=dict)
    alertas_gerados: int = 0


class ImportarRequest(BaseModel):
    formato: str = "json"  # json|csv
    conteudo: str          # corpo do arquivo


# --------------------------------------------------------------------------- #
# Sensibilidade / Monte Carlo (Fase 6)
# --------------------------------------------------------------------------- #
class HeatmapRequest(BaseModel):
    eixo_x: str = "entrada"          # entrada|taxa_aa|prazo_meses|aluguel
    eixo_y: str = "taxa_aa"
    metrica: str = "desembolso"      # desembolso|tir
    x_min: float
    x_max: float
    y_min: float
    y_max: float
    passos: int = 11


class MonteCarloRequest(BaseModel):
    n: int = 2000
    entrada: Optional[float] = None
    valorizacao_media: float = 0.05
    valorizacao_dp: float = 0.03
    vacancia_media_meses: float = 1.0
    vacancia_dp_meses: float = 0.5
    taxa_media_aa: float = 0.115
    taxa_dp_aa: float = 0.015
