"""Avaliação completa de um imóvel: amarra financiamento, aluguel, custos,
desembolso e métricas num único resultado. Base do farol e do score."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .assumptions import Premissas
from .cashflow import Desembolso, desembolso_liquido, pct_parcela_coberta
from .costs import (CapitalInvestido, CustosPosse, capital_investido,
                    custos_posse_mensal)
from .financing import (TabelaFinanciamento, simular, taxa_mensal,
                        validar_entrada, valor_financiado)
from .metrics import (ResultadoTIR, cap_rate, cash_on_cash, ltv, roe_economico,
                      tir_vpl_equity, yield_bruto)
from .rental import AluguelLiquido, aluguel_liquido


@dataclass
class Imovel:
    """Dados mínimos de um imóvel para avaliação (subset do modelo do §9)."""
    preco: float
    aluguel_estimado: float
    area_m2: float = 0.0
    quartos: int = 0
    vagas: int = 0
    condominio_mensal: float = 0.0
    iptu_anual: float = 0.0
    seguro_mensal: float = 0.0
    aluguel_origem: str = "yield"   # informado | comparaveis | yield
    # Para subvalorização (§5.3): mediana de R$/m² da microrregião
    preco_m2_mediana_regiao: Optional[float] = None
    # Para qualidade/liquidez
    estado_conservacao: float = 0.7  # 0..1 (proxy)
    quartos_demandados: int = 2

    @property
    def preco_m2(self) -> Optional[float]:
        if self.area_m2 and self.area_m2 > 0:
            return self.preco / self.area_m2
        return None

    @property
    def desconto_regiao_pct(self) -> Optional[float]:
        """1 - (preco_m2 / mediana_regiao). Positivo = abaixo do mercado."""
        if self.preco_m2 and self.preco_m2_mediana_regiao:
            return 1.0 - (self.preco_m2 / self.preco_m2_mediana_regiao)
        return None


@dataclass
class Avaliacao:
    imovel: Imovel
    premissas: Premissas
    entrada: float
    valor_financiado: float
    i_m: float
    tabela: TabelaFinanciamento
    aluguel: AluguelLiquido
    custos: CustosPosse
    capital: CapitalInvestido
    desembolso: Desembolso
    # métricas
    pct_coberta: float
    cap_rate: float
    yield_bruto: float
    cash_on_cash: float
    roe_economico: float
    ltv: float
    tir: ResultadoTIR

    @property
    def desembolso_liquido(self) -> float:
        return self.desembolso.desembolso_liquido


def avaliar(imovel: Imovel, p: Premissas,
            entrada: Optional[float] = None,
            calcular_tir: bool = True) -> Avaliacao:
    """Avalia um imóvel com as premissas dadas. entrada=None usa o padrão."""
    if entrada is None:
        entrada = imovel.preco * p.entrada_padrao_pct
    validar_entrada(imovel.preco, entrada, p.ltv_max)

    financiado = valor_financiado(imovel.preco, entrada)
    im = taxa_mensal(p.taxa_aa, p.tr_aa)
    tabela = simular(financiado, p.prazo_meses, im, p.sistema)

    custos = custos_posse_mensal(imovel.preco, p,
                                 condominio_mensal=imovel.condominio_mensal,
                                 iptu_anual=imovel.iptu_anual,
                                 seguro_mensal=imovel.seguro_mensal)
    al = aluguel_liquido(imovel.aluguel_estimado, p,
                         condominio_mensal=imovel.condominio_mensal,
                         iptu_mensal=imovel.iptu_anual / 12.0)
    capital = capital_investido(imovel.preco, entrada, p)

    desem = desembolso_liquido(tabela.primeira_parcela, custos, al)
    pct = pct_parcela_coberta(al.liquido, tabela.primeira_parcela)

    cr = cap_rate(imovel.aluguel_estimado, al.vacancia, al.admin_imob,
                  custos.total, imovel.preco)
    yb = yield_bruto(imovel.aluguel_estimado, imovel.preco)
    coc = cash_on_cash(desem.desembolso_liquido, capital.total)
    amort_ano = sum(tabela.amortizacoes[:12])
    valoriz_ano = imovel.preco * p.valorizacao_aa
    roe = roe_economico(amort_ano, valoriz_ano,
                        desem.desembolso_liquido * 12.0, capital.total)
    _ltv = ltv(financiado, imovel.preco)

    if calcular_tir:
        tir = tir_vpl_equity(imovel.preco, entrada, capital.total, tabela,
                             imovel.aluguel_estimado, custos, p)
    else:
        tir = ResultadoTIR(None, None, 0.0, [])

    return Avaliacao(
        imovel=imovel, premissas=p, entrada=entrada,
        valor_financiado=financiado, i_m=im, tabela=tabela,
        aluguel=al, custos=custos, capital=capital, desembolso=desem,
        pct_coberta=pct, cap_rate=cr, yield_bruto=yb, cash_on_cash=coc,
        roe_economico=roe, ltv=_ltv, tir=tir,
    )
