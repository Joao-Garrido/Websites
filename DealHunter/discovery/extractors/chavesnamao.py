"""Extractor Chaves na Mão."""
from ._generic import GenericExtractor

extractor = GenericExtractor(
    nome="chavesnamao",
    dominio="chavesnamao.com.br",
    url_templates=["https://www.chavesnamao.com.br/imoveis-a-venda/{cidade}/"],
)
