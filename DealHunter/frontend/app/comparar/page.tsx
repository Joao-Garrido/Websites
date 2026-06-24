"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Detalhe, Imovel } from "@/lib/types";
import { brl, pct } from "@/lib/format";
import { FarolBadge } from "@/components/FarolBadge";
import { Button, Card, CardBody, Spinner } from "@/components/ui/primitives";

export default function CompararPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [sel, setSel] = useState<number[]>([]);
  const [comp, setComp] = useState<Detalhe[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.listImoveis({ limit: 60 }).then(setImoveis).finally(() => setLoading(false)); }, []);

  function toggle(id: number) {
    setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 4 ? [...s, id] : s);
  }

  async function comparar() {
    if (sel.length < 2) return;
    setComp((await api.comparar(sel)).comparacao);
  }

  const nomeDe = (id: number) => {
    const i = imoveis.find((x) => x.id === id);
    return i?.titulo || `#${id}`;
  };

  const linhas: { label: string; fmt: (d: Detalhe) => React.ReactNode }[] = [
    { label: "Farol", fmt: (d) => <FarolBadge farol={d.farol} /> },
    { label: "Opportunity Score", fmt: (d) => d.opportunity_score.toFixed(0) },
    { label: "Desembolso/mês", fmt: (d) => <span className={d.desembolso_liquido <= 0 ? "text-green-700 font-semibold" : ""}>{brl(d.desembolso_liquido)}</span> },
    { label: "% parcela coberta", fmt: (d) => pct(d.pct_coberta) },
    { label: "Entrada", fmt: (d) => brl(d.entrada) },
    { label: "Parcela 1ª", fmt: (d) => brl(d.parcela_1) },
    { label: "Cap rate", fmt: (d) => pct(d.metricas.cap_rate) },
    { label: "Cash-on-cash", fmt: (d) => pct(d.metricas.cash_on_cash) },
    { label: "TIR", fmt: (d) => pct(d.metricas.tir_anual) },
    { label: "Break-even entrada", fmt: (d) => d.break_evens.entrada_equilibrio ? brl(d.break_evens.entrada_equilibrio) : "n/d" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Comparador</h1>
      <p className="text-sm text-slate-500">Selecione de 2 a 4 imóveis.</p>

      {loading ? <Spinner /> : (
        <div className="flex flex-wrap gap-2">
          {imoveis.slice(0, 24).map((i) => (
            <button key={i.id} onClick={() => toggle(i.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${sel.includes(i.id) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}>
              {i.titulo || `#${i.id}`} · {brl(i.preco)}
            </button>
          ))}
        </div>
      )}

      <Button onClick={comparar} disabled={sel.length < 2}>Comparar {sel.length || ""}</Button>

      {comp && (
        <Card className="overflow-x-auto">
          <CardBody>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 text-left text-slate-500">Métrica</th>
                  {comp.map((d) => <th key={d.imovel_id} className="px-3 py-2 text-right">{nomeDe(d.imovel_id)}</th>)}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.label} className="border-b border-slate-100">
                    <td className="py-2 text-slate-500">{l.label}</td>
                    {comp.map((d) => <td key={d.imovel_id} className="px-3 py-2 text-right tabular-nums">{l.fmt(d)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
