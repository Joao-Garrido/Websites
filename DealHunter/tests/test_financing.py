"""Testes unitários do módulo de financiamento."""
import pytest

from engine import (cet_anual, entrada_minima, price, sac, simular, taxa_mensal,
                    validar_entrada)
from engine.assumptions import Premissas


def test_taxa_mensal_com_tr():
    base = taxa_mensal(0.115, 0.0)
    com_tr = taxa_mensal(0.115, 0.012)
    assert com_tr > base
    # i_m deve reconstituir a taxa anual efetiva (incl. TR)
    assert (1 + com_tr) ** 12 - 1 == pytest.approx(0.115 + 0.012, abs=1e-9)


def test_taxa_mensal_zero():
    assert taxa_mensal(0.0, 0.0) == pytest.approx(0.0)


def test_sac_amortizacao_constante():
    im = taxa_mensal(0.115)
    t = sac(500_000, 360, im)
    assert all(a == pytest.approx(t.amortizacoes[0]) for a in t.amortizacoes)
    # parcela decrescente
    assert t.parcelas[0] > t.parcelas[-1]
    # saldo final zera
    assert t.saldos[-1] == pytest.approx(0.0, abs=1e-6)


def test_price_parcela_fixa():
    im = taxa_mensal(0.115)
    t = price(500_000, 360, im)
    assert max(t.parcelas) == pytest.approx(min(t.parcelas), abs=1e-6)
    assert t.saldos[-1] == pytest.approx(0.0, abs=1e-6)


def test_price_juros_maiores_que_sac():
    im = taxa_mensal(0.115)
    assert price(500_000, 360, im).total_juros > sac(500_000, 360, im).total_juros


def test_soma_amortizacoes_igual_principal():
    im = taxa_mensal(0.10)
    for sistema in ("SAC", "PRICE"):
        t = simular(300_000, 240, im, sistema)
        assert sum(t.amortizacoes) == pytest.approx(300_000, abs=1e-3)


def test_total_pago_igual_principal_mais_juros():
    im = taxa_mensal(0.10)
    t = sac(300_000, 240, im)
    assert t.total_pago == pytest.approx(300_000 + t.total_juros, abs=1e-3)


def test_entrada_minima_e_validacao():
    assert entrada_minima(700_000, 0.80) == pytest.approx(140_000)
    validar_entrada(700_000, 140_000, 0.80)  # ok
    with pytest.raises(ValueError):
        validar_entrada(700_000, 100_000, 0.80)
    with pytest.raises(ValueError):
        validar_entrada(700_000, 800_000, 0.80)


def test_cet_maior_que_taxa_contratada():
    p = Premissas(taxa_aa=0.115, tr_aa=0.0)
    im = taxa_mensal(p.taxa_aa, p.tr_aa)
    t = sac(500_000, 360, im)
    cet = cet_anual(t, 700_000, p)
    # com MIP/DFI/adm o CET é maior que a taxa nominal
    assert cet > p.taxa_aa
