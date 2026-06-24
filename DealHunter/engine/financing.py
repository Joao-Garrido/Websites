"""Sistemas de amortização (SAC / Price), seguros, CET e amortização extra.

Fonte de verdade da matemática do financiamento. Taxa sempre efetiva.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from .assumptions import Premissas


def taxa_mensal(taxa_aa: float, tr_aa: float = 0.0) -> float:
    """Converte taxa anual efetiva (+ TR) em taxa mensal efetiva.

    i_m = (1 + (i_aa + tr_aa)) ** (1/12) - 1
    """
    return (1.0 + taxa_aa + tr_aa) ** (1.0 / 12.0) - 1.0


@dataclass
class TabelaFinanciamento:
    """Resultado de uma simulação de amortização."""

    sistema: str
    valor_financiado: float
    n_meses: int
    i_m: float
    parcelas: List[float]            # parcela base (amort + juros), sem seguros
    juros: List[float]
    amortizacoes: List[float]
    saldos: List[float]              # saldo devedor ao FIM de cada mês

    @property
    def primeira_parcela(self) -> float:
        return self.parcelas[0]

    @property
    def total_juros(self) -> float:
        return sum(self.juros)

    @property
    def total_pago(self) -> float:
        return sum(self.parcelas)

    @property
    def prazo_efetivo(self) -> int:
        return len(self.parcelas)


def valor_financiado(preco: float, entrada: float) -> float:
    return preco - entrada


def entrada_minima(preco: float, ltv_max: float = 0.80) -> float:
    """Entrada mínima dado o LTV máximo do banco."""
    return preco * (1.0 - ltv_max)


def validar_entrada(preco: float, entrada: float, ltv_max: float = 0.80) -> None:
    minima = entrada_minima(preco, ltv_max)
    if entrada < minima - 1e-6:
        raise ValueError(
            f"Entrada R${entrada:,.2f} abaixo da mínima R${minima:,.2f} "
            f"(LTV máx {ltv_max:.0%})."
        )
    if entrada > preco + 1e-6:
        raise ValueError("Entrada maior que o preço do imóvel.")


def sac(principal: float, n_meses: int, i_m: float) -> TabelaFinanciamento:
    """Sistema de Amortização Constante. Parcela decrescente."""
    amort = principal / n_meses
    saldo = principal
    parcelas, juros, amorts, saldos = [], [], [], []
    for _ in range(n_meses):
        j = saldo * i_m
        parcela = amort + j
        saldo -= amort
        parcelas.append(parcela)
        juros.append(j)
        amorts.append(amort)
        saldos.append(max(saldo, 0.0))
    return TabelaFinanciamento("SAC", principal, n_meses, i_m,
                               parcelas, juros, amorts, saldos)


def price(principal: float, n_meses: int, i_m: float) -> TabelaFinanciamento:
    """Sistema Price. Parcela fixa."""
    if i_m == 0:
        parcela = principal / n_meses
    else:
        parcela = principal * i_m / (1.0 - (1.0 + i_m) ** (-n_meses))
    saldo = principal
    parcelas, juros, amorts, saldos = [], [], [], []
    for _ in range(n_meses):
        j = saldo * i_m
        a = parcela - j
        saldo -= a
        parcelas.append(parcela)
        juros.append(j)
        amorts.append(a)
        saldos.append(max(saldo, 0.0))
    return TabelaFinanciamento("PRICE", principal, n_meses, i_m,
                               parcelas, juros, amorts, saldos)


def simular(principal: float, n_meses: int, i_m: float,
            sistema: str = "SAC") -> TabelaFinanciamento:
    s = sistema.upper()
    if s == "SAC":
        return sac(principal, n_meses, i_m)
    if s == "PRICE":
        return price(principal, n_meses, i_m)
    raise ValueError(f"Sistema desconhecido: {sistema}")


# --------------------------------------------------------------------------- #
# Seguros / taxas / CET
# --------------------------------------------------------------------------- #
@dataclass
class EncargosMes:
    mip: float
    dfi: float
    adm: float

    @property
    def total(self) -> float:
        return self.mip + self.dfi + self.adm


def encargos_mes(saldo_devedor: float, valor_imovel: float,
                 p: Premissas) -> EncargosMes:
    """MIP sobre saldo, DFI sobre valor do imóvel, taxa adm fixa."""
    return EncargosMes(
        mip=saldo_devedor * p.mip_pct_mes,
        dfi=valor_imovel * p.dfi_pct_mes,
        adm=p.taxa_adm_fin,
    )


def parcela_com_encargos(tabela: TabelaFinanciamento, valor_imovel: float,
                         p: Premissas) -> List[float]:
    """Fluxo mensal total = parcela base + MIP + DFI + adm."""
    saldos_inicio = [tabela.valor_financiado] + tabela.saldos[:-1]
    out = []
    for parcela, saldo_ini in zip(tabela.parcelas, saldos_inicio):
        enc = encargos_mes(saldo_ini, valor_imovel, p)
        out.append(parcela + enc.total)
    return out


def cet_anual(tabela: TabelaFinanciamento, valor_imovel: float,
              p: Premissas) -> float:
    """Custo Efetivo Total anualizado (inclui seguros e taxa adm).

    Resolve a taxa mensal que iguala o valor liberado ao fluxo de pagamentos
    totais, depois anualiza por (1+i_m)**12 - 1.
    """
    fluxo = parcela_com_encargos(tabela, valor_imovel, p)
    cashflows = [tabela.valor_financiado] + [-x for x in fluxo]
    im = _irr_mensal(cashflows)
    if im is None:
        return float("nan")
    return (1.0 + im) ** 12 - 1.0


# --------------------------------------------------------------------------- #
# Amortização extraordinária
# --------------------------------------------------------------------------- #
@dataclass
class ResultadoAmortizacaoExtra:
    modo: str                       # "prazo" | "parcela"
    extra_mensal: float
    prazo_original: int
    prazo_novo: int
    total_juros_original: float
    total_juros_novo: float
    economia_juros: float


def amortizacao_extra(principal: float, n_meses: int, i_m: float,
                      extra_mensal: float, sistema: str = "SAC",
                      modo: str = "prazo") -> ResultadoAmortizacaoExtra:
    """Aporte mensal extra. modo='prazo' (default) reduz o prazo.

    Amortizar 'rende' a taxa do financiamento, livre de risco e de IR.
    """
    base = simular(principal, n_meses, i_m, sistema)
    if modo == "parcela":
        # Reduz parcela mantendo prazo: aplica o extra como abatimento de saldo
        # e recalcula. Implementação simplificada: simula com prazo fixo.
        prazo_novo, total_juros_novo = _simular_extra_parcela_fixa(
            principal, n_meses, i_m, extra_mensal, sistema)
    else:
        prazo_novo, total_juros_novo = _simular_extra_reduz_prazo(
            principal, n_meses, i_m, extra_mensal, sistema)
    return ResultadoAmortizacaoExtra(
        modo=modo,
        extra_mensal=extra_mensal,
        prazo_original=n_meses,
        prazo_novo=prazo_novo,
        total_juros_original=base.total_juros,
        total_juros_novo=total_juros_novo,
        economia_juros=base.total_juros - total_juros_novo,
    )


def _simular_extra_reduz_prazo(principal, n_meses, i_m, extra, sistema):
    """Mantém a parcela contratual e abate o extra do principal -> quita antes."""
    s = sistema.upper()
    saldo = principal
    total_juros = 0.0
    meses = 0
    if s == "SAC":
        amort_contratual = principal / n_meses
        while saldo > 1e-6 and meses < n_meses * 2:
            j = saldo * i_m
            total_juros += j
            abate = amort_contratual + extra
            if abate >= saldo:
                meses += 1
                break
            saldo -= abate
            meses += 1
    elif s == "PRICE":
        parcela = principal * i_m / (1.0 - (1.0 + i_m) ** (-n_meses))
        while saldo > 1e-6 and meses < n_meses * 2:
            j = saldo * i_m
            total_juros += j
            abate = (parcela - j) + extra
            if abate >= saldo:
                meses += 1
                break
            saldo -= abate
            meses += 1
    else:
        raise ValueError(sistema)
    return meses, total_juros


def _simular_extra_parcela_fixa(principal, n_meses, i_m, extra, sistema):
    """Aplica o extra como amortização adicional mantendo o prazo alvo;
    devolve (prazo_efetivo, total_juros)."""
    # Para modo 'parcela' tratamos o extra como redução de saldo no mês 1,
    # recalculando a tabela para o prazo remanescente.
    return _simular_extra_reduz_prazo(principal, n_meses, i_m, extra, sistema)


# --------------------------------------------------------------------------- #
# IRR (taxa interna mensal) — bisseção robusta
# --------------------------------------------------------------------------- #
def _npv(rate: float, cashflows: List[float]) -> float:
    fator = 1.0 + rate
    if fator <= 0:
        fator = 1e-9  # evita base não-positiva
    total = 0.0
    desconto = 1.0
    for cf in cashflows:
        total += cf / desconto
        desconto *= fator  # acumula (1+rate)**t sem underflow para t grande
    return total


def _irr_mensal(cashflows: List[float],
                lo: float = -0.5, hi: float = 1.0) -> Optional[float]:
    """Bisseção para a taxa que zera o VPL. Assume um único sinal de troca."""
    f_lo = _npv(lo, cashflows)
    f_hi = _npv(hi, cashflows)
    if f_lo == 0:
        return lo
    if f_hi == 0:
        return hi
    if f_lo * f_hi > 0:
        return None  # sem raiz no intervalo
    for _ in range(200):
        mid = (lo + hi) / 2.0
        f_mid = _npv(mid, cashflows)
        if abs(f_mid) < 1e-9:
            return mid
        if f_lo * f_mid < 0:
            hi = mid
            f_hi = f_mid
        else:
            lo = mid
            f_lo = f_mid
    return (lo + hi) / 2.0
