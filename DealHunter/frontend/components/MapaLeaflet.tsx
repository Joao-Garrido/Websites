"use client";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import Link from "next/link";
import type { MapaPin } from "@/lib/types";
import { brl } from "@/lib/format";

const COR: Record<string, string> = { verde: "#16a34a", amarelo: "#d97706", vermelho: "#dc2626" };

export default function MapaLeaflet({ pins }: { pins: MapaPin[] }) {
  const center: [number, number] = pins.length
    ? [pins[0].lat, pins[0].lng]
    : [-23.55, -46.63];
  return (
    <MapContainer center={center} zoom={11} style={{ height: "70vh", width: "100%", borderRadius: 12 }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((p) => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={9}
          pathOptions={{ color: COR[p.farol] || "#64748b", fillColor: COR[p.farol], fillOpacity: 0.8 }}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{p.titulo || `${p.bairro}, ${p.cidade}`}</div>
              <div>{brl(p.preco)} · score {p.opportunity_score?.toFixed(0)}</div>
              <div>Desembolso: {brl(p.desembolso_liquido)}/mês</div>
              <Link href={`/imovel/${p.id}`} className="text-blue-600 underline">ver detalhe</Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
