export function brl(v: number | null | undefined, casas = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function pct(v: number | null | undefined, casas = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }) + "%";
}

export function num(v: number | null | undefined, casas = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export const FAROL_LABEL: Record<string, string> = {
  verde: "Se paga",
  amarelo: "Quase lá",
  vermelho: "Consome caixa",
};

export const FAROL_EMOJI: Record<string, string> = {
  verde: "🟢",
  amarelo: "🟡",
  vermelho: "🔴",
};

export const COMPONENTE_LABEL: Record<string, string> = {
  viabilidade: "Viabilidade (o outro paga)",
  cap_rate: "Cap rate",
  cash_on_cash: "Cash-on-cash",
  subvalorizacao: "Subvalorização",
  qualidade: "Qualidade/liquidez",
};
