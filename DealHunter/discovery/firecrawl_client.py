"""Camada Firecrawl (scraping + monitoramento) via REST.

Usada em runtime pelo app. Se FIRECRAWL_API_KEY não estiver definido, as
funções retornam None e o sweep cai para importer/sample (degradação graciosa).
Respeita robots.txt e rate-limit no lado do Firecrawl.
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

import httpx

log = logging.getLogger("discovery.firecrawl")

FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY")
FIRECRAWL_BASE = os.environ.get("FIRECRAWL_BASE", "https://api.firecrawl.dev")


def disponivel() -> bool:
    return bool(FIRECRAWL_API_KEY)


def _headers() -> Dict[str, str]:
    return {"Authorization": f"Bearer {FIRECRAWL_API_KEY}",
            "Content-Type": "application/json"}


def extract(urls: List[str], prompt: str,
            schema: Optional[Dict[str, Any]] = None) -> Optional[Any]:
    """Extração estruturada de anúncios a partir de URLs de listagem."""
    if not disponivel():
        return None
    try:
        payload: Dict[str, Any] = {"urls": urls, "prompt": prompt}
        if schema:
            payload["schema"] = schema
        r = httpx.post(f"{FIRECRAWL_BASE}/v2/extract", headers=_headers(),
                       json=payload, timeout=120.0)
        r.raise_for_status()
        return r.json().get("data")
    except Exception as e:
        log.warning("firecrawl.extract falhou: %s", e)
        return None


def search(query: str, limit: int = 20) -> Optional[Any]:
    if not disponivel():
        return None
    try:
        r = httpx.post(f"{FIRECRAWL_BASE}/v2/search", headers=_headers(),
                       json={"query": query, "limit": limit}, timeout=60.0)
        r.raise_for_status()
        return r.json().get("data")
    except Exception as e:
        log.warning("firecrawl.search falhou: %s", e)
        return None


# --- Monitoramento de mudanças (novos anúncios / quedas de preço, §5.5) ---- #
def monitor_create(url: str, prompt: str) -> Optional[str]:
    if not disponivel():
        return None
    try:
        r = httpx.post(f"{FIRECRAWL_BASE}/v2/monitors", headers=_headers(),
                       json={"url": url, "prompt": prompt}, timeout=60.0)
        r.raise_for_status()
        return r.json().get("id")
    except Exception as e:
        log.warning("firecrawl.monitor_create falhou: %s", e)
        return None


def monitor_check(monitor_id: str) -> Optional[Any]:
    if not disponivel():
        return None
    try:
        r = httpx.post(f"{FIRECRAWL_BASE}/v2/monitors/{monitor_id}/check",
                       headers=_headers(), timeout=60.0)
        r.raise_for_status()
        return r.json().get("data")
    except Exception as e:
        log.warning("firecrawl.monitor_check falhou: %s", e)
        return None
