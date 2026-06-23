"""Extractor Imovelweb."""
from ._generic import GenericExtractor

extractor = GenericExtractor(
    nome="imovelweb",
    dominio="imovelweb.com.br",
    url_templates=["https://www.imovelweb.com.br/imoveis-venda-{cidade}.html"],
)
