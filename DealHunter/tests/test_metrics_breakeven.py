"""Testes de métricas de investimento e break-evens."""
import pytest

from engine import (Imovel, Premissas, avaliar, break_evens, cap_rate,
                    cash_on_cash, entrada_equilibrio, prazo_equilibrio,
                    yield_bruto)


def test_cap_rate_sem_financiamento():
    # NOI = (3000 - vacancia - admin - custos)*12
    cr = cap_rate(3000, vacancia=0, admin=0, custos_posse_mensal=600,
                  preco=700_000)
    assert cr == pytest.approx((3000 - 600) * 12 / 700_000, abs=1e-9)


def test_yield_bruto():
    assert yield_bruto(3000, 700_000) == pytest.approx(3000 * 12 / 700_000)


def test_cash_on_cash_negativo_quando_consome_caixa():
    # desembolso positivo -> cash-on-cash negativo
    assert cash_on_cash(4587, 236_250) < 0


def test_avaliacao_integra_metricas():
    p = Premissas()
    imovel = Imovel(preco=700_000, aluguel_estimado=3000, condominio_mensal=800,
                    iptu_anual=3600, area_m2=70)
    av = avaliar(imovel, p, entrada=200_000)
    assert av.cap_rate > 0
    assert av.tir.tir_anual is not None
    assert av.ltv == pytest.approx(500_000 / 700_000)


def test_tir_melhora_com_valorizacao_maior():
    imovel = Imovel(preco=700_000, aluguel_estimado=3000, condominio_mensal=800,
                    iptu_anual=3600)
    baixa = avaliar(imovel, Premissas(valorizacao_aa=0.02), entrada=200_000)
    alta = avaliar(imovel, Premissas(valorizacao_aa=0.10), entrada=200_000)
    assert alta.tir.tir_anual > baixa.tir.tir_anual


def test_breakeven_entrada_zera_desembolso():
    p = Premissas()
    be = entrada_equilibrio(700_000, 3000, p, condominio=800, iptu_anual=3600)
    assert be is not None
    assert 200_000 < be < 700_000
    # no ponto de equilíbrio o desembolso deve ser ~0
    imovel = Imovel(preco=700_000, aluguel_estimado=3000, condominio_mensal=800,
                    iptu_anual=3600)
    av = avaliar(imovel, p, entrada=be, calcular_tir=False)
    assert av.desembolso_liquido == pytest.approx(0.0, abs=1.0)


def test_breakeven_prazo_pode_nao_existir():
    # Com entrada baixa, nem prazo infinito zera (parcela de juros > cobertura)
    p = Premissas()
    assert prazo_equilibrio(700_000, 3000, 200_000, p,
                            condominio=800, iptu_anual=3600) is None


def test_breakeven_aluguel_existe():
    p = Premissas()
    be = break_evens(700_000, 3000, 200_000, p, condominio=800, iptu_anual=3600)
    assert be.aluguel_equilibrio is not None
    assert be.aluguel_equilibrio > 3000  # precisa de mais aluguel para se pagar
