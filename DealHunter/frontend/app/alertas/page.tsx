"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, BellRing, CheckCheck, Sparkles, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import type { Alerta } from "@/lib/types";
import { Button, Card, Spinner } from "@/components/ui/primitives";

const ICON: Record<string, React.ReactNode> = {
  novo: <Sparkles className="h-4 w-4 text-blue-600" />,
  queda_preco: <ArrowDownRight className="h-4 w-4 text-amber-600" />,
  cruzou_viabilidade: <TrendingUp className="h-4 w-4 text-green-600" />,
};

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "nao_lidos">("todos");

  async function carregar() {
    setLoading(true);
    try { setAlertas(await api.listAlertas(filtro === "nao_lidos" ? false : undefined)); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, [filtro]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><BellRing className="h-6 w-6" /> Inbox de alertas</h1>
        <div className="flex gap-1.5">
          <Button variant={filtro === "todos" ? "default" : "outline"} size="sm" onClick={() => setFiltro("todos")}>Todos</Button>
          <Button variant={filtro === "nao_lidos" ? "default" : "outline"} size="sm" onClick={() => setFiltro("nao_lidos")}>Não lidos</Button>
          <Button variant="outline" size="sm" onClick={async () => { await api.marcarTodosLidos(); carregar(); }}>
            <CheckCheck className="h-4 w-4" /> Marcar todos
          </Button>
        </div>
      </div>

      {loading ? <Spinner /> : alertas.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">Sem alertas. Crie perfis monitorados em <Link href="/perfis" className="underline">Perfis</Link>.</Card>
      ) : (
        <div className="space-y-2">
          {alertas.map((a) => (
            <Card key={a.id} className={a.lido ? "opacity-60" : ""}>
              <div className="flex items-center gap-3 p-3">
                <div className="rounded-lg bg-slate-100 p-2">{ICON[a.tipo] || <BellRing className="h-4 w-4" />}</div>
                <div className="flex-1">
                  <div className="text-sm">{a.motivo}</div>
                  <div className="text-xs text-slate-400">
                    {a.tipo} {a.criado_em ? `· ${a.criado_em.slice(0, 16).replace("T", " ")}` : ""}
                  </div>
                </div>
                {a.imovel_id && <Link href={`/imovel/${a.imovel_id}`} className="text-sm text-blue-600 underline">ver</Link>}
                {!a.lido && (
                  <Button size="sm" variant="ghost" onClick={async () => { await api.marcarAlerta(a.id); carregar(); }}>marcar lido</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
