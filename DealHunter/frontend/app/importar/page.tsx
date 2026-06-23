"use client";
import { useState } from "react";
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

export default function ImportarPage() {
  const [formato, setFormato] = useState("json");
  const [conteudo, setConteudo] = useState(EXEMPLO_JSON);
  const [res, setRes] = useState<SweepResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function importar() {
    setLoading(true); setErro(null); setRes(null);
    try {
      setRes(await api.importar(formato, conteudo));
    } catch (e) {
      setErro(String(e));
    } finally { setLoading(false); }
  }

  async function arquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setConteudo(await f.text());
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
          <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)}
            className="h-64 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs outline-none focus:border-slate-500" />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={importar} disabled={loading}>{loading ? "Importando…" : "Importar"}</Button>
            {res && <span className="text-sm text-green-700">+{res.novos} novos · {res.atualizados} atualizados · {res.duplicados} duplicados</span>}
            {erro && <span className="text-sm text-red-600">{erro}</span>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
