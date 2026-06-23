import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import { FarolBadge } from "@/components/FarolBadge";
import { brl, pct } from "@/lib/format";
import type { Imovel } from "@/lib/types";

export function ImovelCard({ imovel }: { imovel: Imovel }) {
  const m = imovel.metricas || {};
  return (
    <Link href={`/imovel/${imovel.id}`}>
      <Card className="h-full transition hover:shadow-md hover:border-slate-300">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold leading-tight">
                {imovel.titulo || `${imovel.tipo} ${imovel.area_m2 ?? ""}m²`}
              </div>
              <div className="text-xs text-slate-500">
                {[imovel.bairro, imovel.cidade].filter(Boolean).join(", ")}
                {imovel.uf ? `-${imovel.uf}` : ""} · {imovel.fonte}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold tabular-nums">{brl(imovel.preco)}</div>
              {imovel.opportunity_score != null && (
                <div className="text-xs text-slate-500">score {imovel.opportunity_score.toFixed(0)}</div>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <FarolBadge farol={imovel.farol} />
            {imovel.score_breakdown?.tag && (
              <span className="text-xs text-slate-500">{imovel.score_breakdown.tag}</span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Mini label="Desembolso/mês"
              value={brl(imovel.desembolso_liquido)}
              accent={(imovel.desembolso_liquido ?? 1) <= 0 ? "text-green-700" : "text-slate-900"} />
            <Mini label="% coberta" value={pct(imovel.pct_coberta)} />
            <Mini label="Cap rate" value={pct(imovel.cap_rate)} />
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{imovel.quartos ?? "?"}q · {imovel.vagas ?? 0} vaga(s) · {imovel.area_m2 ?? "?"}m²</span>
            {imovel.desconto_regiao_pct != null && imovel.desconto_regiao_pct > 0.01 && (
              <span className="text-green-700 font-medium">{pct(imovel.desconto_regiao_pct, 0)} abaixo</span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            aluguel {brl(imovel.aluguel_estimado)} ({imovel.aluguel_origem})
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className={`text-sm font-semibold tabular-nums ${accent || ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
