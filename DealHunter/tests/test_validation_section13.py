"""Validação contra os exemplos do §13 (a fonte de verdade da Fase 1).

Parcelas: ±R$1. Totais de juros: ±R$150 (o §13 arredonda à centena).
Prazos de amortização extra: exatos. Economia: ±R$2.000 (§13 usa "~").
Desembolso: ±R$2.
"""
import pytest

from engine import (Imovel, Premissas, amortizacao_extra, avaliar, price, sac,
                    taxa_mensal, valor_financiado)
from engine.scoring import VERMELHO

TAXA_AA = 0.115
N = 360
PRECO = 700_000


@pytest.fixture
def i_m():
    return taxa_mensal(TAXA_AA)


def test_i_m_efetiva(i_m):
    # §13: i_m = 0,9107%/mês
    assert i_m == pytest.approx(0.0091107, abs=5e-6)


# --------------------------------------------------------------------------- #
# SAC — 1ª parcela e juros totais (§13)
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize("entrada,financiado,parcela1,juros_tot", [
    (200_000, 500_000, 5945, 822_400),
    (300_000, 400_000, 4756, 657_920),
    (400_000, 300_000, 3567, 493_440),
])
def test_sac_section13(i_m, entrada, financiado, parcela1, juros_tot):
    assert valor_financiado(PRECO, entrada) == financiado
    t = sac(financiado, N, i_m)
    assert t.primeira_parcela == pytest.approx(parcela1, abs=1.0)
    assert t.total_juros == pytest.approx(juros_tot, abs=150.0)


# --------------------------------------------------------------------------- #
# Price (§13)
# --------------------------------------------------------------------------- #
def test_price_section13(i_m):
    t = price(500_000, N, i_m)
    assert t.primeira_parcela == pytest.approx(4737, abs=1.0)
    assert t.parcelas[0] == pytest.approx(t.parcelas[-1], abs=1e-6)  # parcela fixa
    assert t.total_juros == pytest.approx(1_205_342, abs=150.0)


# --------------------------------------------------------------------------- #
# Amortização extra reduzindo prazo (§13)
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize("extra,prazo_novo,economia", [
    (500, 265, 217_089),
    (1000, 210, 343_305),
])
def test_amortizacao_extra_section13(i_m, extra, prazo_novo, economia):
    r = amortizacao_extra(500_000, N, i_m, extra, sistema="SAC", modo="prazo")
    assert r.prazo_novo == prazo_novo
    assert r.economia_juros == pytest.approx(economia, abs=2000.0)


# --------------------------------------------------------------------------- #
# Desembolso líquido (§13) → ~R$4.587/mês, farol vermelho
# --------------------------------------------------------------------------- #
def test_desembolso_section13():
    p = Premissas(
        taxa_aa=TAXA_AA, tr_aa=0.0, sistema="SAC", prazo_meses=N,
        vacancia_meses_ano=1.0, aluga_por_imobiliaria=False,
        manutencao_aa_pct=0.005,
    )
    imovel = Imovel(
        preco=PRECO, aluguel_estimado=3000.0,
        condominio_mensal=800.0, iptu_anual=3600.0,
        aluguel_origem="informado",
    )
    av = avaliar(imovel, p, entrada=200_000, calcular_tir=False)

    # componentes do §13
    assert av.tabela.primeira_parcela == pytest.approx(5945, abs=1.0)
    assert av.custos.manutencao == pytest.approx(291.67, abs=1.0)
    assert av.custos.iptu_mensal == pytest.approx(300.0, abs=1e-6)
    assert av.aluguel.liquido == pytest.approx(2750.0, abs=1.0)  # IR ~ 0
    assert av.aluguel.ir == pytest.approx(0.0, abs=1e-6)

    assert av.desembolso_liquido == pytest.approx(4587, abs=2.0)

    from engine import farol
    assert farol(av.desembolso_liquido, p.limite_amarelo) == VERMELHO
