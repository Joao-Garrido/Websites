"""Busca em linguagem natural (§6): frase -> filtro estruturado.

Caminho principal: API da Anthropic (Claude) retornando JSON do schema.
Fallback offline: parser heurístico (regex) — garante funcionamento sem chave.
"""
from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, Optional, Tuple

import httpx

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

SCHEMA_HINT = {
    "cidade": "string|null", "uf": "string|null (2 letras)",
    "bairros": "string[]|null", "tipo": "apartamento|casa|null",
    "preco_min": "number|null", "preco_max": "number|null",
    "quartos_min": "int|null", "vagas_min": "int|null",
    "desembolso_max": "number|null (R$/mês que sai do bolso)",
    "farol": "verde|amarelo|vermelho|null",
    "cap_rate_min": "number|null (fração, ex 0.07)",
    "desconto_min": "number|null (fração abaixo do mercado, ex 0.10)",
    "cash_flow_positivo": "bool|null",
    "ordenar_por": "opportunity_score|desembolso|preco|cap_rate|desconto|recentes",
}

SYSTEM = (
    "Você converte pedidos de busca de imóveis de investimento (em português) "
    "em um filtro JSON. Responda APENAS com JSON válido, sem texto extra. "
    "Valores monetários em reais (number). 'que se paga' => desembolso_max=0. "
    "'cap rate acima de X%' => cap_rate_min=X/100. "
    "'Y% abaixo do mercado' => desconto_min=Y/100. "
    f"Schema dos campos (use null quando não citado): {json.dumps(SCHEMA_HINT, ensure_ascii=False)}"
)


def parse_filtro_claude(frase: str) -> Optional[Dict[str, Any]]:
    if not ANTHROPIC_API_KEY:
        return None
    try:
        resp = httpx.post(
            ANTHROPIC_URL,
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": ANTHROPIC_MODEL,
                "max_tokens": 512,
                "system": SYSTEM,
                "messages": [{"role": "user", "content": frase}],
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        texto = "".join(b.get("text", "") for b in data.get("content", []))
        texto = texto.strip()
        # remove cercas de código se houver
        texto = re.sub(r"^```(?:json)?|```$", "", texto, flags=re.MULTILINE).strip()
        return json.loads(texto)
    except Exception:
        return None


# --------------------------------------------------------------------------- #
# Fallback heurístico
# --------------------------------------------------------------------------- #
def _parse_valor(txt: str) -> Optional[float]:
    """'600k' -> 600000, '1,2 mi' -> 1200000, 'R$1.000' -> 1000."""
    txt = txt.lower().strip()
    m = re.search(r"([\d]+(?:[.,]\d+)?)\s*(k|mil|mi|milh[õo]es|milhao|milhão|m)?", txt)
    if not m:
        return None
    num = float(m.group(1).replace(".", "").replace(",", ".")) if "," in m.group(1) \
        else float(m.group(1).replace(".", ""))
    suf = m.group(2) or ""
    if suf in ("k", "mil"):
        num *= 1_000
    elif suf in ("mi", "milhões", "milhoes", "milhao", "milhão", "m"):
        num *= 1_000_000
    return num


def parse_filtro_heuristico(frase: str) -> Dict[str, Any]:
    f: Dict[str, Any] = {"ordenar_por": "opportunity_score"}
    s = frase.lower()

    if re.search(r"\b(casa|sobrado)\b", s):
        f["tipo"] = "casa"
    elif re.search(r"\b(ap|apto|apartamento|kitnet|studio|stúdio)\b", s):
        f["tipo"] = "apartamento"

    m = re.search(r"(\d+)\s*quartos?", s)
    if m:
        f["quartos_min"] = int(m.group(1))

    if re.search(r"\b(com\s+vaga|garagem|vagas?)\b", s):
        f["vagas_min"] = 1

    for m in re.finditer(r"(?:até|ate|no m[aá]x(?:imo)?|abaixo de|menos de)\s*r?\$?\s*"
                         r"([\d.,]+\s*(?:k|mil|mi|milh[õo]es|m)?)", s):
        # ignora se o número se refere a desembolso (capturado adiante)
        if "desembolso" in s[m.end():m.end() + 18]:
            continue
        v = _parse_valor(m.group(1))
        if v:
            f["preco_max"] = v
            break

    m = re.search(r"desembolso[^\d]{0,30}?r?\$?\s*([\d.,]+\s*(?:k|mil|m)?)", s)
    if not m:
        m = re.search(r"r?\$?\s*([\d.,]+\s*(?:k|mil|m)?)[^\d]{0,15}?de\s+desembolso", s)
    if m:
        v = _parse_valor(m.group(1))
        if v is not None:
            f["desembolso_max"] = v
    elif re.search(r"se paga", s):
        f["desembolso_max"] = 0.0

    m = re.search(r"cap\s*rate\s*(?:acima de|maior que|>|de)?\s*([\d.,]+)\s*%", s)
    if m:
        f["cap_rate_min"] = float(m.group(1).replace(",", ".")) / 100.0

    m = re.search(r"([\d.,]+)\s*%\s*abaixo", s)
    if m:
        f["desconto_min"] = float(m.group(1).replace(",", ".")) / 100.0

    if re.search(r"farol\s+verde|\bverde\b", s):
        f["farol"] = "verde"
    elif re.search(r"farol\s+amarelo", s):
        f["farol"] = "amarelo"

    if re.search(r"cash[\s-]*flow\s+positivo|fluxo\s+positivo|me paga", s):
        f["cash_flow_positivo"] = True

    m = re.search(r"\b([a-z]{2})\b(?:\s|$|,|\.)", frase) if False else None
    m = re.search(r"\b(SP|RJ|MG|RS|PR|SC|BA|PE|CE|GO|DF|ES|MT|MS|PA|MA|PB|RN|AL|PI|SE|RO|TO|AC|AP|RR|AM)\b", frase)
    if m:
        f["uf"] = m.group(1)

    m = re.search(r"\bem\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wçãõáéíóúâêô]+(?:\s+[A-ZÁÉÍÓÚ][\wçãõáéíóúâêô]+)?)", frase)
    if m:
        cidade = m.group(1).strip()
        if cidade.upper() not in ("SP", "RJ"):
            f["cidade"] = cidade

    return f


def parse_filtro(frase: str) -> Tuple[Dict[str, Any], str]:
    via_claude = parse_filtro_claude(frase)
    if via_claude is not None:
        # limpa nulls
        return {k: v for k, v in via_claude.items() if v is not None}, "claude"
    return parse_filtro_heuristico(frase), "heuristico"
