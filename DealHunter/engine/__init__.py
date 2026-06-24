"""DealHunter Imobiliário — motor financeiro (Fase 1).

Fonte de verdade da matemática. Toda taxa é efetiva.
"""
from .assumptions import (PESOS_OPPORTUNITY_SCORE_DEFAULT,
                          TABELA_IR_CARNE_LEAO_2026, Premissas)
from .breakeven import (BreakEvens, aluguel_equilibrio, break_evens,
                        entrada_equilibrio, prazo_equilibrio)
from .cashflow import Desembolso, desembolso_liquido, pct_parcela_coberta
from .costs import (CapitalInvestido, CustosPosse, capital_investido,
                    custos_posse_mensal)
from .evaluate import Avaliacao, Imovel, avaliar
from .financing import (ResultadoAmortizacaoExtra, TabelaFinanciamento,
                        amortizacao_extra, cet_anual, entrada_minima, price,
                        sac, simular, taxa_mensal, valor_financiado,
                        validar_entrada)
from .metrics import (ResultadoTIR, cap_rate, cash_on_cash, ltv,
                      payback_capital_proprio, roe_economico, tir_vpl_equity,
                      yield_bruto)
from .rental import AluguelLiquido, aluguel_liquido, ir_carne_leao
from .scoring import (AMARELO, VERDE, VERMELHO, ResultadoScore, ScoreBreakdown,
                      farol, opportunity_score, pontuar)

__all__ = [
    "Premissas", "PESOS_OPPORTUNITY_SCORE_DEFAULT", "TABELA_IR_CARNE_LEAO_2026",
    "taxa_mensal", "sac", "price", "simular", "valor_financiado",
    "entrada_minima", "validar_entrada", "TabelaFinanciamento", "cet_anual",
    "amortizacao_extra", "ResultadoAmortizacaoExtra",
    "ir_carne_leao", "aluguel_liquido", "AluguelLiquido",
    "custos_posse_mensal", "capital_investido", "CustosPosse",
    "CapitalInvestido",
    "desembolso_liquido", "Desembolso", "pct_parcela_coberta",
    "cap_rate", "yield_bruto", "cash_on_cash", "roe_economico", "ltv",
    "tir_vpl_equity", "ResultadoTIR", "payback_capital_proprio",
    "entrada_equilibrio", "aluguel_equilibrio", "prazo_equilibrio",
    "break_evens", "BreakEvens",
    "farol", "opportunity_score", "pontuar", "ScoreBreakdown",
    "ResultadoScore", "VERDE", "AMARELO", "VERMELHO",
    "Imovel", "Avaliacao", "avaliar",
]
