"""Testes de aluguel líquido, IR carnê-leão e custos."""
import pytest

from engine import (Premissas, aluguel_liquido, capital_investido,
                    custos_posse_mensal, ir_carne_leao)
from engine.assumptions import TABELA_IR_CARNE_LEAO_2026


@pytest.mark.parametrize("base,esperado", [
    (2000.0, 0.0),                         # isento
    (2300.0, 2300 * 0.075 - 169.44),       # 7,5%
    (3000.0, 3000 * 0.15 - 381.44),        # 15%
    (4000.0, 4000 * 0.225 - 662.77),       # 22,5%
    (6000.0, 6000 * 0.275 - 896.00),       # 27,5%
])
def test_ir_carne_leao_faixas(base, esperado):
    assert ir_carne_leao(base, TABELA_IR_CARNE_LEAO_2026) == pytest.approx(esperado, abs=0.01)


def test_ir_nunca_negativo():
    assert ir_carne_leao(2300.0, TABELA_IR_CARNE_LEAO_2026) >= 0
    assert ir_carne_leao(0.0, TABELA_IR_CARNE_LEAO_2026) == 0.0


def test_aluguel_liquido_vacancia():
    p = Premissas(vacancia_meses_ano=1.0, aluga_por_imobiliaria=False)
    al = aluguel_liquido(3000.0, p, condominio_mensal=800.0, iptu_mensal=300.0)
    assert al.recebido_pos_vacancia == pytest.approx(2750.0)  # 3000*11/12
    assert al.admin_imob == 0.0
    assert al.ir == 0.0                       # base 1650 -> isento
    assert al.liquido == pytest.approx(2750.0)


def test_aluguel_liquido_com_imobiliaria_reduz():
    p_direto = Premissas(aluga_por_imobiliaria=False)
    p_imob = Premissas(aluga_por_imobiliaria=True, taxa_admin_imob=0.08)
    direto = aluguel_liquido(5000.0, p_direto)
    imob = aluguel_liquido(5000.0, p_imob)
    assert imob.admin_imob > 0
    assert imob.liquido < direto.liquido


def test_aluguel_liquido_ir_incide_sem_dedutiveis():
    # Aluguel alto, sem condomínio/IPTU dedutíveis -> IR > 0
    p = Premissas(vacancia_meses_ano=0.0, aluga_por_imobiliaria=False)
    al = aluguel_liquido(5000.0, p)
    assert al.ir > 0
    assert al.liquido < 5000.0


def test_custos_posse():
    p = Premissas(manutencao_aa_pct=0.005)
    c = custos_posse_mensal(700_000, p, condominio_mensal=800, iptu_anual=3600)
    assert c.iptu_mensal == pytest.approx(300.0)
    assert c.manutencao == pytest.approx(700_000 * 0.005 / 12)
    assert c.total == pytest.approx(800 + 300 + c.manutencao)


def test_capital_investido():
    p = Premissas(itbi_pct=0.03, escritura_pct=0.01, registro_pct=0.0075,
                  avaliacao_banco=3000)
    cap = capital_investido(700_000, 200_000, p)
    assert cap.itbi == pytest.approx(21_000)
    assert cap.escritura == pytest.approx(7_000)
    assert cap.registro == pytest.approx(5_250)
    assert cap.total == pytest.approx(200_000 + 21_000 + 7_000 + 5_250 + 3_000)
