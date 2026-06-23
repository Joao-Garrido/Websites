"use client";
import { useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import type { Premissas } from "@/lib/types";
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Select, Spinner } from "@/components/ui/primitives";
import { COMPONENTE_LABEL } from "@/lib/format";

type Kind = "pct" | "money" | "int" | "bool" | "sistema";
interface Campo { k: keyof Premissas; label: string; kind: Kind; }

const GRUPOS: { titulo: string; campos: Campo[] }[] = [
  { titulo: "Financiamento", campos: [
    { k: "taxa_aa", label: "Taxa a.a.", kind: "pct" },
    { k: "tr_aa", label: "TR a.a.", kind: "pct" },
    { k: "sistema", label: "Sistema", kind: "sistema" },
    { k: "prazo_meses", label: "Prazo (meses)", kind: "int" },
    { k: "entrada_padrao_pct", label: "Entrada padrão", kind: "pct" },
    { k: "ltv_max", label: "LTV máx", kind: "pct" },
  ]},
  { titulo: "Aluguel", campos: [
    { k: "vacancia_meses_ano", label: "Vacância (meses/ano)", kind: "int" },
    { k: "aluga_por_imobiliaria", label: "Via imobiliária", kind: "bool" },
    { k: "taxa_admin_imob", label: "Taxa imobiliária", kind: "pct" },
  ]},
  { titulo: "Posse & transação", campos: [
    { k: "manutencao_aa_pct", label: "Manutenção a.a.", kind: "pct" },
    { k: "itbi_pct", label: "ITBI", kind: "pct" },
    { k: "escritura_pct", label: "Escritura", kind: "pct" },
    { k: "registro_pct", label: "Registro", kind: "pct" },
    { k: "avaliacao_banco", label: "Avaliação banco", kind: "money" },
  ]},
  { titulo: "Mercado & projeção", campos: [
    { k: "valorizacao_aa", label: "Valorização a.a.", kind: "pct" },
    { k: "inflacao_aa", label: "Inflação a.a.", kind: "pct" },
    { k: "horizonte_anos", label: "Horizonte (anos)", kind: "int" },
    { k: "taxa_desconto_vpl", label: "Desconto VPL", kind: "pct" },
  ]},
  { titulo: "Farol & benchmark", campos: [
    { k: "limite_amarelo", label: "Limite amarelo (R$/mês)", kind: "money" },
    { k: "cap_rate_benchmark", label: "Cap rate benchmark", kind: "pct" },
  ]},
];

export default function PremissasPage() {
  const [p, setP] = useState<Premissas | null>(null);
  const [pesos, setPesos] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  async function carregar() {
    const data = await api.getPremissas();
    setP(data);
    setPesos(data.pesos_opportunity_score);
  }
  useEffect(() => { carregar(); }, []);

  if (!p) return <div className="flex justify-center py-20"><Spinner /></div>;

  function setCampo(k: keyof Premissas, kind: Kind, raw: string | boolean) {
    let v: number | boolean | string = raw as string;
    if (kind === "bool") v = raw as boolean;
    else if (kind === "sistema") v = raw as string;
    else if (kind === "pct") v = Number(raw) / 100;
    else v = Number(raw);
    setP({ ...(p as Premissas), [k]: v });
  }

  function display(k: keyof Premissas, kind: Kind): string | number {
    const v = (p as Premissas)[k] as number;
    if (kind === "pct") return +(v * 100).toFixed(4);
    return v as number;
  }

  const somaPesos = Object.values(pesos).reduce((a, b) => a + b, 0);

  async function salvar() {
    setSaving(true); setOk(false);
    try {
      await api.putPremissas({ ...(p as Premissas), pesos_opportunity_score: pesos });
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Premissas globais</h1>
          <p className="text-sm text-slate-500">Conservadoras por padrão. Salvar re-pontua toda a carteira.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregar}><RotateCcw className="h-4 w-4" /> Recarregar</Button>
          <Button onClick={salvar} disabled={saving}>
            {ok ? <Check className="h-4 w-4" /> : null} {saving ? "Salvando…" : ok ? "Salvo!" : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {GRUPOS.map((g) => (
          <Card key={g.titulo}>
            <CardHeader><CardTitle>{g.titulo}</CardTitle></CardHeader>
            <CardBody className="space-y-2.5">
              {g.campos.map((c) => (
                <div key={String(c.k)} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-slate-600">{c.label}</label>
                  {c.kind === "bool" ? (
                    <input type="checkbox" checked={!!(p as Premissas)[c.k]}
                      onChange={(e) => setCampo(c.k, c.kind, e.target.checked)} className="h-4 w-4" />
                  ) : c.kind === "sistema" ? (
                    <Select value={(p as Premissas)[c.k] as string} className="w-28"
                      onChange={(e) => setCampo(c.k, c.kind, e.target.value)}>
                      <option value="SAC">SAC</option>
                      <option value="PRICE">Price</option>
                    </Select>
                  ) : (
                    <div className="relative w-32">
                      <Input type="number" step="any" value={display(c.k, c.kind)}
                        onChange={(e) => setCampo(c.k, c.kind, e.target.value)} className="text-right pr-7" />
                      <span className="absolute right-2 top-2 text-xs text-slate-400">
                        {c.kind === "pct" ? "%" : c.kind === "money" ? "R$" : ""}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        ))}

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Pesos do Opportunity Score {Math.abs(somaPesos - 1) > 0.001 &&
              <span className="text-red-600">(soma {somaPesos.toFixed(2)} ≠ 1)</span>}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {Object.keys(pesos).map((k) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <label className="text-sm text-slate-600">{COMPONENTE_LABEL[k] || k}</label>
                <Input type="number" step="0.05" value={pesos[k]} className="w-24 text-right"
                  onChange={(e) => setPesos({ ...pesos, [k]: Number(e.target.value) })} />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
