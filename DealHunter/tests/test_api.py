"""Testes de integração da API (Fases 2–6)."""
import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test_api.db"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from api.database import Base, engine  # noqa: E402
from api.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


def _criar_700k(client, **over):
    payload = {
        "preco": 700000, "aluguel_estimado": 3000, "aluguel_origem": "informado",
        "condominio_mensal": 800, "iptu_anual": 3600, "area_m2": 70,
        "quartos": 2, "vagas": 1, "bairro": "Centro", "cidade": "Marilia", "uf": "SP",
    }
    payload.update(over)
    return client.post("/imoveis", json=payload)


def test_health(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "disclaimer" in r.json()


def test_criar_e_detalhe_section13(client):
    im = _criar_700k(client).json()
    assert im["farol"] in ("verde", "amarelo", "vermelho")
    det = client.post(f"/imoveis/{im['id']}/detalhe", json={"entrada": 200000}).json()
    assert det["parcela_1"] == pytest.approx(5945, abs=1)
    assert det["desembolso_liquido"] == pytest.approx(4587, abs=2)
    assert det["farol"] == "vermelho"
    assert det["break_evens"]["entrada_equilibrio"] > 200000
    assert det["score_breakdown"]["componentes"].keys()


def test_historico_e_queda_preco_gera_alerta(client):
    im = _criar_700k(client).json()
    # cai o preço -> alerta de queda
    client.patch(f"/imoveis/{im['id']}", json={"preco": 600000})
    hist = client.get(f"/imoveis/{im['id']}/historico").json()
    assert len(hist) == 2
    alertas = client.get("/alertas").json()
    assert any(a["tipo"] == "queda_preco" for a in alertas)


def test_premissas_update_repontua(client):
    im = _criar_700k(client).json()
    score_antes = im["opportunity_score"]
    r = client.put("/premissas", json={"taxa_aa": 0.16})
    assert r.status_code == 200
    assert r.json()["taxa_aa"] == 0.16
    depois = client.get(f"/imoveis/{im['id']}").json()
    # taxa maior -> parcela maior -> pior viabilidade -> score nao aumenta
    assert depois["opportunity_score"] <= score_antes + 0.01


def test_feed_ordenado_por_score(client):
    _criar_700k(client, preco=560000, aluguel_estimado=4000)   # melhor
    _criar_700k(client, preco=900000, aluguel_estimado=2500)   # pior
    feed = client.get("/imoveis?ordenar_por=opportunity_score").json()
    scores = [x["opportunity_score"] for x in feed]
    assert scores == sorted(scores, reverse=True)


def test_busca_nl_heuristica(client):
    _criar_700k(client, cidade="Marilia", tipo="casa", vagas=1)
    r = client.post("/busca/nl", json={"frase": "casa com vaga em Marilia, farol verde"})
    body = r.json()
    assert body["fonte_parser"] in ("claude", "heuristico")
    assert body["filtro"]["tipo"] == "casa"
    assert body["filtro"]["vagas_min"] == 1


def test_busca_nl_desembolso_e_preco(client):
    r = client.post("/busca/nl", json={
        "frase": "ap 2 quartos ate 600k que se paga com no max R$1.000 de desembolso"})
    f = r.json()["filtro"]
    assert f["tipo"] == "apartamento"
    assert f["quartos_min"] == 2
    assert f["preco_max"] == 600000
    assert f["desembolso_max"] == 1000


def test_importar_json(client):
    conteudo = '[{"preco":400000,"area_m2":80,"bairro":"Centro","cidade":"Marilia","uf":"SP","aluguel_estimado":2200,"quartos":2,"vagas":1}]'
    r = client.post("/descoberta/importar", json={"formato": "json", "conteudo": conteudo})
    assert r.status_code == 200
    assert r.json()["novos"] == 1
    assert len(client.get("/imoveis").json()) == 1


def test_sweep_offline_gera_imoveis_e_comparaveis(client):
    r = client.post("/descoberta/sweep", json={"max_por_portal": 6, "usar_firecrawl": False})
    assert r.status_code == 200
    stats = r.json()
    assert stats["novos"] > 0
    # comparáveis calculados para as regiões varridas
    comps = client.get("/comparaveis").json()
    assert len(comps) >= 1
    # subvalorização preenchida em ao menos um imóvel
    imoveis = client.get("/imoveis").json()
    assert any(i["desconto_regiao_pct"] is not None for i in imoveis)


def test_portais_lista(client):
    r = client.get("/descoberta/portais").json()
    assert set(["zap", "vivareal", "quintoandar", "imovelweb", "olx", "chavesnamao"]).issubset(set(r["portais"]))


def test_mapa_pins(client):
    client.post("/descoberta/sweep", json={"max_por_portal": 6})
    pins = client.get("/mapa").json()["pins"]
    assert len(pins) > 0
    assert "farol" in pins[0]


def test_heatmap(client):
    im = _criar_700k(client).json()
    r = client.post(f"/imoveis/{im['id']}/heatmap", json={
        "eixo_x": "entrada", "eixo_y": "taxa_aa", "metrica": "desembolso",
        "x_min": 140000, "x_max": 500000, "y_min": 0.10, "y_max": 0.14, "passos": 5})
    body = r.json()
    assert len(body["grid"]) == 5 and len(body["grid"][0]) == 5
    # mais entrada -> menor desembolso (linha decrescente)
    assert body["grid"][0][0] > body["grid"][0][-1]


def test_montecarlo(client):
    im = _criar_700k(client).json()
    r = client.post(f"/imoveis/{im['id']}/montecarlo", json={"n": 300})
    body = r.json()
    assert 0.0 <= body["prob_se_paga"] <= 1.0
    assert body["tir"]["p50"] is not None


def test_comparar(client):
    a = _criar_700k(client, preco=560000).json()
    b = _criar_700k(client, preco=900000).json()
    r = client.post("/comparar", json={"imovel_ids": [a["id"], b["id"]]})
    comp = r.json()["comparacao"]
    assert len(comp) == 2


def test_cenario_salvar(client):
    im = _criar_700k(client).json()
    r = client.post(f"/imoveis/{im['id']}/cenarios", json={
        "nome": "entrada alta", "entrada": 400000, "overrides": {}})
    assert r.status_code == 201
    assert r.json()["resultados_cache"]["parcela_1"] == pytest.approx(3567, abs=2)
    lst = client.get(f"/imoveis/{im['id']}/cenarios").json()
    assert len(lst) == 1
