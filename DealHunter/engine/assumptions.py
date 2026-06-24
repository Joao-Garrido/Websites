"""Premissas globais do motor financeiro (Fase 1).

Todos os defaults são conservadores por desenho (§12): vacância >= 1 mês/ano,
manutenção >= 0,5% a.a., IR sobre aluguel ligado. O objetivo do engine é
proteger de uma má compra, não vender fantasia.

Taxa SEMPRE efetiva. A conversão anual -> mensal é feita por:
    i_m = (1 + i_aa) ** (1/12) - 1
A TR (quando informada) é somada à taxa anual antes da conversão.
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Dict, List, Tuple


# Tabela carnê-leão 2026 (mensal). Cada faixa: (limite_superior, aliquota, deducao).
# A última faixa usa limite_superior = infinito.
TABELA_IR_CARNE_LEAO_2026: List[Tuple[float, float, float]] = [
    (2259.20, 0.000, 0.00),
    (2826.65, 0.075, 169.44),
    (3751.05, 0.150, 381.44),
    (4664.68, 0.225, 662.77),
    (float("inf"), 0.275, 896.00),
]


# Pesos default do Opportunity Score (§3.2). Devem somar 1.0.
PESOS_OPPORTUNITY_SCORE_DEFAULT: Dict[str, float] = {
    "viabilidade": 0.35,      # quão <= 0 está o desembolso / % da parcela coberta
    "cap_rate": 0.20,
    "cash_on_cash": 0.15,
    "subvalorizacao": 0.20,
    "qualidade": 0.10,
}


@dataclass
class Premissas:
    """Premissas globais configuráveis (espelha o modelo Premissas do §9)."""

    # --- Financiamento ---
    taxa_aa: float = 0.115            # taxa nominal contratada efetiva anual
    tr_aa: float = 0.0               # TR anual a somar (default 0; ~1,2% a.a. hoje)
    sistema: str = "SAC"             # "SAC" | "PRICE"
    prazo_meses: int = 360
    entrada_padrao_pct: float = 0.20
    ltv_max: float = 0.80            # banco financia no máx 80%

    # --- Seguros / taxas do financiamento (entram no CET) ---
    mip_pct_mes: float = 0.00025     # sobre saldo devedor
    dfi_pct_mes: float = 0.0001      # sobre valor do imóvel
    taxa_adm_fin: float = 25.0       # R$/mês fixo

    # --- Custos de transação (capital inicial) ---
    itbi_pct: float = 0.03
    escritura_pct: float = 0.01
    registro_pct: float = 0.0075
    avaliacao_banco: float = 3000.0

    # --- Aluguel ---
    vacancia_meses_ano: float = 1.0
    aluga_por_imobiliaria: bool = False
    taxa_admin_imob: float = 0.08
    tabela_ir_carne_leao: List[Tuple[float, float, float]] = field(
        default_factory=lambda: list(TABELA_IR_CARNE_LEAO_2026)
    )

    # --- Posse ---
    manutencao_aa_pct: float = 0.005

    # --- Projeção / mercado ---
    valorizacao_aa: float = 0.05
    inflacao_aa: float = 0.045
    horizonte_anos: int = 10
    taxa_desconto_vpl: float = 0.105  # CDI/Selic, base do VPL

    # --- Saída (venda no fim do horizonte) ---
    corretagem_venda_pct: float = 0.06
    ir_ganho_capital_pct: float = 0.15

    # --- Farol e Opportunity Score ---
    limite_amarelo: float = 1500.0
    pesos_opportunity_score: Dict[str, float] = field(
        default_factory=lambda: dict(PESOS_OPPORTUNITY_SCORE_DEFAULT)
    )

    # Benchmark de cap rate da região (para normalizar o componente cap_rate).
    cap_rate_benchmark: float = 0.06

    def com(self, **overrides) -> "Premissas":
        """Retorna uma cópia com overrides aplicados (não muta o original)."""
        return replace(self, **overrides)

    @property
    def taxa_aa_efetiva(self) -> float:
        """Taxa anual efetiva somando a TR."""
        return self.taxa_aa + self.tr_aa
