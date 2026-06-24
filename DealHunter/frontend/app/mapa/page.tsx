"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import type { MapaPin } from "@/lib/types";
import { Card, Select, Spinner } from "@/components/ui/primitives";

const MapaLeaflet = dynamic(() => import("@/components/MapaLeaflet"), {
  ssr: false,
  loading: () => <div className="flex h-[70vh] items-center justify-center"><Spinner /></div>,
});

export default function MapaPage() {
  const [pins, setPins] = useState<MapaPin[]>([]);
  const [farol, setFarol] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.mapa(farol || undefined).then((r) => setPins(r.pins)).finally(() => setLoading(false));
  }, [farol]);

  const contagem = useMemo(() => {
    const c = { verde: 0, amarelo: 0, vermelho: 0 } as Record<string, number>;
    pins.forEach((p) => { c[p.farol] = (c[p.farol] || 0) + 1; });
    return c;
  }, [pins]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Mapa de oportunidades</h1>
          <p className="text-sm text-slate-500">
            🟢 {contagem.verde} · 🟡 {contagem.amarelo} · 🔴 {contagem.vermelho} — concentração de pechinchas por região.
          </p>
        </div>
        <Select value={farol} onChange={(e) => setFarol(e.target.value)} className="w-auto">
          <option value="">Todos os faróis</option>
          <option value="verde">🟢 Verde</option>
          <option value="amarelo">🟡 Amarelo</option>
          <option value="vermelho">🔴 Vermelho</option>
        </Select>
      </div>
      <Card className="overflow-hidden p-1">
        {loading ? <div className="flex h-[70vh] items-center justify-center"><Spinner /></div>
          : pins.length === 0 ? <div className="flex h-[70vh] items-center justify-center text-slate-400">Sem imóveis geolocalizados. Faça uma varredura.</div>
            : <MapaLeaflet pins={pins} />}
      </Card>
    </div>
  );
}
