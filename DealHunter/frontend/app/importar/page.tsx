"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { api } from "@/lib/api";
import type { SweepResponse } from "@/lib/types";
import { Button, Card, CardBody, CardHeader, CardTitle, Select } from "@/components/ui/primitives";

const EXEMPLO_JSON = `[
  {"preco": 450000, "area_m2": 70, "quartos": 2, "vagas": 1,
   "bairro": "Centro", "cidade": "Marília", "uf": "SP",
   "condominio_mensal": 500, "iptu_anual": 2400,
   "aluguel_estimado": 2200, "aluguel_origem": "informado",
   "lat": -22.21, "lng": -49.94}
]`;

const LS_KEY = "dealhunter_import_conteudo";

export default function ImportarPage() {
  const [formato, setFormato] = useState("json");
  const [conteudo, setConteudo] = useState(EXEMPLO_JSON);
  const [res, setRes] = useState<SweepResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  // recupera o que foi digitado (não perde ao sair e voltar)
  useEffect(() => {
    const salvo = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (salvo) setConteudo(salvo);
  }, []);

  function setConteudoPersist(v: string) {
    setConteudo(v);
    try { localStorage.setItem(LS_KEY, v); } catch {}
  }

  async function importar() {
    setLoading(true); setErro(null); setRes(null);
    try {
      const r = await api.importar(formato, conteudo);
      setRes(r);
      const lista = await api.listImoveis({ limit: 200 });
      setTotal(lista.length);
    } catch (e) {
      setErro(String(e));
    } finally { setLoading(false); }
  }

  async function arquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    setConteudoPersist(txt);
    setFormato(f.name.endsWith(".csv") ? "csv" : "json");
  }

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Upload className="h-6 w-6" /> Importar imóveis</h1>
      <p className="text-sm text-slate-500">Cole CSV/JSON ou suba um arquivo. Cada imóvel é pontuado na ingestão.</p>

      <Card>
        <CardHeader className="flex flex-wrap items-center gap-2">
          <CardTitle>Conteúdo</CardTitle>
          <div className="flex-1" />
          <Select value={formato} onChange={(e) => setFormato(e.target.value)} className="w-28">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </Select>
          <input type="file" accept=".json,.csv" onChange={arquivo} className="text-xs" />
        </CardHeader>
        <CardBody>
          <textarea value={conteudo} onChange={(e) => setConteudoPersist(e.target.value)}
            spellCheck={false}
            className="h-64 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs outline-none focus:border-slate-500" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button onClick={importar} disabled={loading}>{loading ? "Importando…" : "Importar"}</Button>
            <Button variant="outline" onClick={() => setConteudoPersist(EXEMPLO_JSON)}>Restaurar exemplo</Button>
          </div>

          {/* feedback grande e claro */}
          {res && (
            <div className={`mt-3 rounded-lg border p-3 text-sm ${
              res.novos > 0 ? "border-green-200 bg-green-50 text-green-800"
              : res.atualizados > 0 ? "border-blue-200 bg-blue-50 text-blue-800"
              : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {res.novos > 0
                ? `✅ ${res.novos} imóvel(is) novo(s) importado(s)!`
                : res.atualizados > 0
                ? `🔄 ${res.atualizados} imóvel(is) atualizado(s).`
                : `ℹ️ Nada novo: ${res.duplicados} já estava(m) no banco (mesmo bairro+área+preço).`}
              <div className="mt-1 text-xs opacity-80">
                encontrados {res.encontrados} · novos {res.novos} · atualizados {res.atualizados} · duplicados {res.duplicados}
                {total != null && ` · total no banco: ${total}`}
              </div>
              <Link href="/" className="mt-1 inline-block font-medium underline">Ver no Feed →</Link>
            </div>
          )}
          {erro && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              ❌ Falha ao importar: {erro}
              <div className="mt-1 text-xs">Confira se a API está rodando em {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"} e se o JSON é válido.</div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
