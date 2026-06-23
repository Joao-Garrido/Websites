"""Extractor QuintoAndar."""
from ._generic import GenericExtractor

extractor = GenericExtractor(
    nome="quintoandar",
    dominio="quintoandar.com.br",
    url_templates=["https://www.quintoandar.com.br/comprar/imovel/{cidade}-sp-brasil"],
)
