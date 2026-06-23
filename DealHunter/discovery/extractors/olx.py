"""Extractor OLX (imóveis)."""
from ._generic import GenericExtractor

extractor = GenericExtractor(
    nome="olx",
    dominio="olx.com.br",
    url_templates=["https://www.olx.com.br/imoveis/venda/estado-sp"],
)
