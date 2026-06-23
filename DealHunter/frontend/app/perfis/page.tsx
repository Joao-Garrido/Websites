"use client";
import { useEffect, useState } from "react";
import { Loader2, Play, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { PerfilBusca, SweepResponse } from "@/lib/types";
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Select, Spinner } from "@/components/ui/primitives";

export default function PerfisPage() {
  const [perfis, setPerfis] = useState<PerfilBusca[]>([]);
  const [loading, setLoading] = useState(true);
  const [exec, setExec] = useState<number | null>(null);
  const [result, setResult] = useState<Record<number, SweepResponse>>({});
  const [form, setForm] = useState({ nome: "", cidade: "São Paulo", tipo: "", preco_max: "", quartos_min: "", criterio: "farol_verde" });

  async function carregar() {
    setLoading(true);
    try { setPerfis(await api.listPerfis()); } finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  function criterioObj() {
    if (form.criterio === "farol_verde") return { tipo: "farol", valor: "verde" };
    if (form.criterio === "farol_amarelo") return { tipo: "farol", valor: "amarelo" };
    if (form.criterio === "desembolso_1000") return { tipo: "desembolso_max", valor: 1000 };
    if (form.criterio === "desembolso_0") return { tipo: "desembolso_max", valor: 0 };
    return null;
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    await api.criarPerfil({
      nome: form.nome,
      regioes: form.cidade ? [form.cidade] : [],
      tipo: form.tipo || null,
      preco_max: form.preco_max ? Number(form.preco_max) : null,
      quartos_min: form.quartos_min ? Number(form.quartos_min) : null,
      criterio_viabilidade: criterioObj(),
      monitorar: true,
    });
    setForm({ ...form, nome: "" });
    carregar();
  }

  async function executar(id: number) {
    setExec(id);
    try {
      const r = await api.executarPerfil(id);
      setResult((s) => ({ ...s, [id]: r }));
      carregar();
    } finally { setExec(null); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-1 h-fit">
        <CardHeader><CardTitle>Novo perfil monitorado</CardTitle></CardHeader>
        <CardBody>
          <form onSubmit={criar} className="space-y-2.5">
            <Input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input placeholder="Cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="">Qualquer tipo</option>
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
            </Select>
            <Input placeholder="Preço máx" type="number" value={form.preco_max}
              onChange={(e) => setForm({ ...form, preco_max: e.target.value })} />
            <Input placeholder="Quartos mín" type="number" value={form.quartos_min}
              onChange={(e) => setForm({ ...form, quartos_min: e.target.value })} />
            <Select value={form.criterio} onChange={(e) => setForm({ ...form, criterio: e.target.value })}>
              <option value="farol_verde">Critério: farol verde (se paga)</option>
              <option value="farol_amarelo">Critério: farol amarelo ou melhor</option>
              <option value="desembolso_0">Critério: desembolso ≤ R$0</option>
              <option value="desembolso_1000">Critério: desembolso ≤ R$1.000</option>
            </Select>
            <Button type="submit" className="w-full">Criar perfil</Button>
          </form>
        </CardBody>
      </Card>

      <div className="lg:col-span-2 space-y-3">
        <h1 className="text-2xl font-bold">Perfis de busca / monitoramento</h1>
        {loading ? <Spinner /> : perfis.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">Nenhum perfil ainda.</Card>
        ) : perfis.map((p) => (
          <Card key={p.id}>
            <CardBody className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{p.nome} {p.monitorar && <span className="ml-1 rounded bg-blue-100 px-1.5 text-[10px] text-blue-700">monitorando</span>}</div>
                <div className="text-xs text-slate-500">
                  {[p.regioes?.join(", "), p.tipo, p.preco_max ? `≤ R$${p.preco_max.toLocaleString("pt-BR")}` : null,
                    p.quartos_min ? `${p.quartos_min}+ quartos` : null,
                    p.criterio_viabilidade ? `${p.criterio_viabilidade.tipo}=${p.criterio_viabilidade.valor}` : null]
                    .filter(Boolean).join(" · ")}
                </div>
                {result[p.id] && (
                  <div className="mt-1 text-xs text-green-700">
                    +{result[p.id].novos} novos · {result[p.id].atualizados} atualizados · {result[p.id].alertas_gerados} alertas
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => executar(p.id)} disabled={exec === p.id}>
                  {exec === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Executar
                </Button>
                <Button size="sm" variant="outline" onClick={async () => { await api.deletarPerfil(p.id); carregar(); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
