"""Extractor ZAP Imóveis."""
from ._generic import GenericExtractor

extractor = GenericExtractor(
    nome="zap",
    dominio="zapimoveis.com.br",
    url_templates=[
        "https://www.zapimoveis.com.br/venda/{tipo}/{cidade}/",
    ],
)
