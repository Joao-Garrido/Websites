import { COMPONENTE_LABEL } from "@/lib/format";

/** Breakdown do Opportunity Score — nunca caixa-preta (§3.2). */
export function ScoreBars({ componentes, pesos, contribuicoes }: {
  componentes: Record<string, number>;
  pesos: Record<string, number>;
  contribuicoes: Record<string, number>;
}) {
  const ordem = Object.keys(pesos);
  return (
    <div className="space-y-2">
      {ordem.map((k) => {
        const comp = componentes[k] ?? 0;
        const contrib = contribuicoes[k] ?? 0;
        return (
          <div key={k}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-slate-600">
                {COMPONENTE_LABEL[k] || k}{" "}
                <span className="text-slate-400">· peso {Math.round((pesos[k] ?? 0) * 100)}%</span>
              </span>
              <span className="tabular-nums font-medium">+{contrib.toFixed(1)} pts</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-slate-800" style={{ width: `${Math.round(comp * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
