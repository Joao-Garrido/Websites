import type {
  Alerta, BuscaNLResponse, Detalhe, Filtro, HistoricoPreco, Imovel,
  MapaPin, PerfilBusca, Premissas, SweepResponse,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${txt || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  // imóveis / feed
  listImoveis: (f: Partial<Filtro> & { limit?: number; offset?: number } = {}) =>
    req<Imovel[]>(`/imoveis${qs(f as Record<string, unknown>)}`),
  getImovel: (id: number) => req<Imovel>(`/imoveis/${id}`),
  criarImovel: (body: Partial<Imovel>) =>
    req<Imovel>("/imoveis", { method: "POST", body: JSON.stringify(body) }),
  atualizarImovel: (id: number, body: Record<string, unknown>) =>
    req<Imovel>(`/imoveis/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  recompute: (id: number) => req<Imovel>(`/imoveis/${id}/recompute`, { method: "POST" }),
  detalhe: (id: number, cenario: Record<string, unknown> = {}) =>
    req<Detalhe>(`/imoveis/${id}/detalhe`, { method: "POST", body: JSON.stringify(cenario) }),
  historico: (id: number) => req<HistoricoPreco[]>(`/imoveis/${id}/historico`),
  heatmap: (id: number, body: Record<string, unknown>) =>
    req<{ xs: number[]; ys: number[]; grid: number[][]; eixo_x: string; eixo_y: string; metrica: string }>(
      `/imoveis/${id}/heatmap`, { method: "POST", body: JSON.stringify(body) }),
  montecarlo: (id: number, body: Record<string, unknown>) =>
    req<any>(`/imoveis/${id}/montecarlo`, { method: "POST", body: JSON.stringify(body) }),

  // premissas
  getPremissas: () => req<Premissas>("/premissas"),
  putPremissas: (body: Partial<Premissas>) =>
    req<Premissas>("/premissas", { method: "PUT", body: JSON.stringify(body) }),

  // busca NL
  buscaNL: (frase: string, salvar_como_perfil?: string) =>
    req<BuscaNLResponse>("/busca/nl", {
      method: "POST", body: JSON.stringify({ frase, salvar_como_perfil }),
    }),

  // descoberta
  portais: () => req<{ portais: string[]; firecrawl_disponivel: boolean }>("/descoberta/portais"),
  sweep: (body: Record<string, unknown>) =>
    req<SweepResponse>("/descoberta/sweep", { method: "POST", body: JSON.stringify(body) }),
  importar: (formato: string, conteudo: string) =>
    req<SweepResponse>("/descoberta/importar", {
      method: "POST", body: JSON.stringify({ formato, conteudo }),
    }),

  // perfis
  listPerfis: () => req<PerfilBusca[]>("/perfis"),
  criarPerfil: (body: Partial<PerfilBusca>) =>
    req<PerfilBusca>("/perfis", { method: "POST", body: JSON.stringify(body) }),
  executarPerfil: (id: number, usar_firecrawl = false) =>
    req<SweepResponse>(`/perfis/${id}/executar${qs({ usar_firecrawl })}`, { method: "POST" }),
  deletarPerfil: (id: number) => req<void>(`/perfis/${id}`, { method: "DELETE" }),

  // alertas
  listAlertas: (lido?: boolean) => req<Alerta[]>(`/alertas${qs({ lido })}`),
  contagemAlertas: () => req<{ nao_lidos: number }>("/alertas/contagem"),
  marcarAlerta: (id: number, lido = true) =>
    req<Alerta>(`/alertas/${id}`, { method: "PATCH", body: JSON.stringify({ lido }) }),
  marcarTodosLidos: () => req<{ ok: boolean }>("/alertas/marcar-todos-lidos", { method: "POST" }),

  // mapa / comparar
  mapa: (farol?: string) => req<{ pins: MapaPin[] }>(`/mapa${qs({ farol })}`),
  comparar: (imovel_ids: number[], cenario?: Record<string, unknown>) =>
    req<{ comparacao: Detalhe[] }>("/comparar", {
      method: "POST", body: JSON.stringify({ imovel_ids, cenario }),
    }),

  // cenários
  salvarCenario: (id: number, body: Record<string, unknown>) =>
    req<any>(`/imoveis/${id}/cenarios`, { method: "POST", body: JSON.stringify(body) }),
  listCenarios: (id: number) => req<any[]>(`/imoveis/${id}/cenarios`),
};
