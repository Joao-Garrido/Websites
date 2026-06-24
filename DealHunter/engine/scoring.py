"""Farol de viabilidade e Opportunity Score (§3).

O score NUNCA é caixa-preta: sempre acompanha o breakdown por componente.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional

from .assumptions import Premissas
from .evaluate import Avaliacao


VERDE = "verde"
AMARELO = "amarelo"
VERMELHO = "vermelho"


def farol(desembolso_liquido: float, limite_amarelo: float) -> str:
    """Regra dura do farol (§3.1)."""
    if desembolso_liquido <= 0:
        return VERDE
    if desembolso_liquido <= limite_amarelo:
        return AMARELO
    return VERMELHO


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _norm_viabilidade(pct_coberta: float) -> float:
    """% da parcela coberta pelo aluguel, saturando em 1.0 (>=100% cobre tudo)."""
    return _clamp01(pct_coberta)


def _norm_cap_rate(cap_rate: float, benchmark: float) -> float:
    """Cap rate relativo ao benchmark. benchmark -> 0.5; 2x benchmark -> 1.0."""
    if benchmark <= 0:
        return _clamp01(cap_rate)
    return _clamp01(cap_rate / (2.0 * benchmark))


def _norm_cash_on_cash(coc: float) -> float:
    """Cash-on-cash: 0% -> 0.5; >=+15% -> 1.0; <=-15% -> 0.0."""
    return _clamp01(0.5 + coc / 0.30)


def _norm_subvalorizacao(desconto_pct: Optional[float]) -> float:
    """Desconto vs mediana da região. 0% -> 0.0; >=20% -> 1.0; sobrepreço -> 0."""
    if desconto_pct is None:
        return 0.5  # sem comparável -> neutro
    return _clamp01(desconto_pct / 0.20)


def _norm_qualidade(av: Avaliacao) -> float:
    """Heurística de qualidade/liquidez: vaga, estado, quartos demandados."""
    im = av.imovel
    score = 0.0
    score += 0.35 if im.vagas and im.vagas >= 1 else 0.0
    score += 0.35 * _clamp01(im.estado_conservacao)
    if im.quartos_demandados and im.quartos >= im.quartos_demandados:
        score += 0.30
    elif im.quartos:
        score += 0.15
    return _clamp01(score)


@dataclass
class ScoreBreakdown:
    componentes: Dict[str, float]      # valor normalizado 0..1 por componente
    pesos: Dict[str, float]
    contribuicoes: Dict[str, float]    # peso * componente * 100
    score: float                       # 0..100

    def explicar(self) -> str:
        linhas = [f"Opportunity Score: {self.score:.1f}/100"]
        for k in self.pesos:
            comp = self.componentes.get(k, 0.0)
            contrib = self.contribuicoes.get(k, 0.0)
            linhas.append(
                f"  {k}: norm={comp:.2f} x peso={self.pesos[k]:.0%} "
                f"= {contrib:.1f} pts"
            )
        return "\n".join(linhas)


def opportunity_score(av: Avaliacao) -> ScoreBreakdown:
    """Score 0–100 com pesos configuráveis e breakdown (§3.2)."""
    p = av.premissas
    pesos = p.pesos_opportunity_score

    componentes = {
        "viabilidade": _norm_viabilidade(av.pct_coberta),
        "cap_rate": _norm_cap_rate(av.cap_rate, p.cap_rate_benchmark),
        "cash_on_cash": _norm_cash_on_cash(av.cash_on_cash),
        "subvalorizacao": _norm_subvalorizacao(av.imovel.desconto_regiao_pct),
        "qualidade": _norm_qualidade(av),
    }

    contribuicoes = {
        k: pesos.get(k, 0.0) * componentes.get(k, 0.0) * 100.0
        for k in pesos
    }
    score = sum(contribuicoes.values())
    return ScoreBreakdown(componentes=componentes, pesos=dict(pesos),
                          contribuicoes=contribuicoes, score=score)


@dataclass
class ResultadoScore:
    score: float
    farol: str
    pct_coberta: float
    desconto_regiao_pct: Optional[float]
    breakdown: ScoreBreakdown
    tag: str


def _gerar_tag(av: Avaliacao, fa: str) -> str:
    partes = []
    if fa == VERDE:
        partes.append("🟢 Se paga")
    elif fa == AMARELO:
        partes.append("🟡 Quase lá")
    else:
        partes.append("🔴 Consome caixa")
    desc = av.imovel.desconto_regiao_pct
    if desc is not None and desc >= 0.05:
        partes.append(f"{desc*100:.0f}% abaixo do mercado")
    if av.cap_rate >= 1.5 * av.premissas.cap_rate_benchmark:
        partes.append(f"cap {av.cap_rate*100:.1f}%")
    return " + ".join(partes)


def pontuar(av: Avaliacao) -> ResultadoScore:
    """Resultado completo de pontuação: farol + score + tag + breakdown."""
    fa = farol(av.desembolso_liquido, av.premissas.limite_amarelo)
    bd = opportunity_score(av)
    return ResultadoScore(
        score=bd.score,
        farol=fa,
        pct_coberta=av.pct_coberta,
        desconto_regiao_pct=av.imovel.desconto_regiao_pct,
        breakdown=bd,
        tag=_gerar_tag(av, fa),
    )
