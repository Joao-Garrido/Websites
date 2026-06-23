"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Filtro, Imovel } from "@/lib/types";
import { ImovelCard } from "@/components/ImovelCard";
import { Button, Card, Input, Select, Spinner } from "@/components/ui/primitives";

const EXEMPLOS = [
  "ap 2 quartos até 600k que se paga com no máx R$1.000 de desembolso",
  "casa com vaga em Marília, cap rate acima de 7%, farol verde",
  "tudo que está 10% abaixo do mercado e cash-flow positivo",
];

export default function FeedPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [frase, setFrase] = useState("");
  const [filtroNL, setFiltroNL] = useState<Filtro | null>(null);
  const [fonteParser, setFonteParser] = useState<string | null>(null);
  const [ordenar, setOrdenar] = useState("opportunity_score");
  const [farol, setFarol] = useState("");
  const [sweeping, setSweeping] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setFiltroNL(null);
    setFonteParser(null);
    try {
      setImoveis(await api.listImoveis({ ordenar_por: ordenar, farol: farol || undefined, limit: 60 }));
    } finally {
      setLoading(false);
    }
  }, [ordenar, farol]);

  useEffect(() => { carregar(); }, [carregar]);

  async function buscar(f: string) {
    if (!f.trim()) return carregar();
    setLoading(true);
    try {
      const r = await api.buscaNL(f);
      setImoveis(r.resultados);
      setFiltroNL(r.filtro);
      setFonteParser(r.fonte_parser);
    } finally {
      setLoading(false);
    }
  }

  async function varrer() {
    setSweeping(true);
    try {
      await api.sweep({ max_por_portal: 12, usar_firecrawl: false });
      await carregar();
    } finally {
      setSweeping(false);
    }
  }

  async function salvarBusca() {
    if (!frase.trim()) return;
    const nome = prompt("Nome do perfil de busca monitorado:", frase.slice(0, 40));
    if (!nome) return;
    await api.buscaNL(frase, nome);
    alert("Perfil salvo e monitorado. Veja em Perfis.");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Feed de Oportunidades</h1>
        <p className="text-sm text-slate-500">Ranqueado por Opportunity Score — as melhores pechinchas que se pagam no topo.</p>
      </div>

      <Card className="p-3">
        <form onSubmit={(e) => { e.preventDefault(); buscar(frase); }} className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={frase} onChange={(e) => setFrase(e.target.value)}
              placeholder="Busque em linguagem natural…" className="pl-9" />
          </div>
          <Button type="submit"><Search className="h-4 w-4" /> Buscar</Button>
          {frase && <Button type="button" variant="outline" onClick={salvarBusca}>Salvar busca</Button>}
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXEMPLOS.map((ex) => (
            <button key={ex} onClick={() => { setFrase(ex); buscar(ex); }}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100">
              {ex}
            </button>
          ))}
        </div>
        {filtroNL && (
          <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
            <span className="font-medium">Filtro {fonteParser === "claude" ? "(via Claude)" : "(heurístico)"}:</span>{" "}
            {Object.entries(filtroNL).filter(([, v]) => v !== null && v !== undefined && v !== "")
              .map(([k, v]) => `${k}=${v}`).join(" · ") || "—"}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={ordenar} onChange={(e) => setOrdenar(e.target.value)} className="w-auto">
          <option value="opportunity_score">Opportunity Score</option>
          <option value="desembolso">Menor desembolso</option>
          <option value="cap_rate">Maior cap rate</option>
          <option value="desconto">Maior desconto</option>
          <option value="preco">Menor preço</option>
          <option value="recentes">Mais recentes</option>
        </Select>
        <Select value={farol} onChange={(e) => setFarol(e.target.value)} className="w-auto">
          <option value="">Todos os faróis</option>
          <option value="verde">🟢 Verde</option>
          <option value="amarelo">🟡 Amarelo</option>
          <option value="vermelho">🔴 Vermelho</option>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" onClick={varrer} disabled={sweeping}>
          {sweeping ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Varrer portais
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : imoveis.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          <p>Nenhum imóvel ainda.</p>
          <p className="text-sm">Clique em <b>Varrer portais</b> para popular com uma varredura, ou use <b>Importar</b>.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {imoveis.map((im) => <ImovelCard key={im.id} imovel={im} />)}
        </div>
      )}
    </div>
  );
}
