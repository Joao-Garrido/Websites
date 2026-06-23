"""Extractor VivaReal."""
from ._generic import GenericExtractor

extractor = GenericExtractor(
    nome="vivareal",
    dominio="vivareal.com.br",
    url_templates=["https://www.vivareal.com.br/venda/{cidade}/"],
)
