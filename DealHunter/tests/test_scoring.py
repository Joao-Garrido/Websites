"""Testes do farol de viabilidade e do Opportunity Score (§3)."""
import pytest

from engine import (Imovel, Premissas, avaliar, farol, opportunity_score,
                    pontuar)
from engine.scoring import AMARELO, VERDE, VERMELHO


def test_farol_limites():
    p = Premissas(limite_amarelo=1500)
    assert farol(-100, p.limite_amarelo) == VERDE
    assert farol(0, p.limite_amarelo) == VERDE
    assert farol(1, p.limite_amarelo) == AMARELO
    assert farol(1500, p.limite_amarelo) == AMARELO
    assert farol(1500.01, p.limite_amarelo) == VERMELHO
    assert farol(5000, p.limite_amarelo) == VERMELHO


def test_pesos_default_somam_1():
    p = Premissas()
    assert sum(p.pesos_opportunity_score.values()) == pytest.approx(1.0)


def test_score_entre_0_e_100():
    p = Premissas()
    imovel = Imovel(preco=700_000, aluguel_estimado=3000, condominio_mensal=800,
                    iptu_anual=3600, area_m2=70, vagas=1, quartos=2,
                    preco_m2_mediana_regiao=11_000)
    av = avaliar(imovel, p, entrada=200_000)
    bd = opportunity_score(av)
    assert 0 <= bd.score <= 100


def test_breakdown_soma_score():
    p = Premissas()
    imovel = Imovel(preco=700_000, aluguel_estimado=3000, area_m2=70, vagas=1,
                    quartos=2, preco_m2_mediana_regiao=11_000)
    av = avaliar(imovel, p, entrada=200_000)
    bd = opportunity_score(av)
    assert sum(bd.contribuicoes.values()) == pytest.approx(bd.score, abs=1e-6)
    # breakdown sempre visível: um componente por peso
    assert set(bd.componentes) == set(p.pesos_opportunity_score)


def test_imovel_subvalorizado_pontua_mais_que_sobrepreco():
    p = Premissas()
    barato = Imovel(preco=560_000, aluguel_estimado=3000, area_m2=70, vagas=1,
                    quartos=2, preco_m2_mediana_regiao=11_000)   # ~27% abaixo
    caro = Imovel(preco=900_000, aluguel_estimado=3000, area_m2=70, vagas=1,
                  quartos=2, preco_m2_mediana_regiao=11_000)     # acima
    s_barato = pontuar(avaliar(barato, p, entrada=barato.preco * 0.2))
    s_caro = pontuar(avaliar(caro, p, entrada=caro.preco * 0.2))
    assert s_barato.score > s_caro.score


def test_imovel_que_se_paga_fica_verde():
    p = Premissas()
    # aluguel alto o suficiente para cobrir tudo com entrada padrão
    imovel = Imovel(preco=400_000, aluguel_estimado=6000, area_m2=80, vagas=1,
                    quartos=3, preco_m2_mediana_regiao=6000)
    res = pontuar(avaliar(imovel, p))
    assert res.farol == VERDE
    assert "🟢" in res.tag


def test_tag_inclui_desconto():
    p = Premissas()
    imovel = Imovel(preco=560_000, aluguel_estimado=3000, area_m2=70, vagas=1,
                    quartos=2, preco_m2_mediana_regiao=11_000)
    res = pontuar(avaliar(imovel, p, entrada=112_000))
    assert "abaixo do mercado" in res.tag
