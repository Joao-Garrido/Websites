/**
 * Espelho em TypeScript do motor financeiro Python (para sliders instantâneos).
 * FONTE DE VERDADE = Python. Este arquivo DEVE bater com os testes do §13
 * (ver lib/engine.test.mjs). Não divergir das fórmulas de engine/*.py.
 */

export const TABELA_IR_CARNE_LEAO_2026: [number, number, number][] = [
  [2259.2, 0.0, 0.0],
  [2826.65, 0.075, 169.44],
  [3751.05, 0.15, 381.44],
  [4664.68, 0.225, 662.77],
  [Infinity, 0.275, 896.0],
];

export interface Premissas {
  taxa_aa: number;
  tr_aa: number;
  sistema: "SAC" | "PRICE";
  prazo_meses: number;
  entrada_padrao_pct: number;
  ltv_max: number;
  vacancia_meses_ano: number;
  aluga_por_imobiliaria: boolean;
  taxa_admin_imob: number;
  manutencao_aa_pct: number;
  valorizacao_aa: number;
  limite_amarelo: number;
  tabela_ir_carne_leao: [number, number, number][];
}

export const PREMISSAS_DEFAULT: Premissas = {
  taxa_aa: 0.115,
  tr_aa: 0,
  sistema: "SAC",
  prazo_meses: 360,
  entrada_padrao_pct: 0.2,
  ltv_max: 0.8,
  vacancia_meses_ano: 1,
  aluga_por_imobiliaria: false,
  taxa_admin_imob: 0.08,
  manutencao_aa_pct: 0.005,
  valorizacao_aa: 0.05,
  limite_amarelo: 1500,
  tabela_ir_carne_leao: TABELA_IR_CARNE_LEAO_2026,
};

export function taxaMensal(taxaAa: number, trAa = 0): number {
  return Math.pow(1 + taxaAa + trAa, 1 / 12) - 1;
}

export interface Tabela {
  primeiraParcela: number;
  ultimaParcela: number;
  totalJuros: number;
  parcelas: number[];
  saldos: number[];
  amortizacoes: number[];
}

export function sac(principal: number, n: number, im: number): Tabela {
  const amort = principal / n;
  let saldo = principal;
  const parcelas: number[] = [];
  const saldos: number[] = [];
  const amortizacoes: number[] = [];
  let totalJuros = 0;
  for (let k = 0; k < n; k++) {
    const j = saldo * im;
    totalJuros += j;
    parcelas.push(amort + j);
    amortizacoes.push(amort);
    saldo -= amort;
    saldos.push(Math.max(saldo, 0));
  }
  return {
    primeiraParcela: parcelas[0],
    ultimaParcela: parcelas[parcelas.length - 1],
    totalJuros,
    parcelas,
    saldos,
    amortizacoes,
  };
}

export function price(principal: number, n: number, im: number): Tabela {
  const parcela = im === 0 ? principal / n : (principal * im) / (1 - Math.pow(1 + im, -n));
  let saldo = principal;
  const parcelas: number[] = [];
  const saldos: number[] = [];
  const amortizacoes: number[] = [];
  let totalJuros = 0;
  for (let k = 0; k < n; k++) {
    const j = saldo * im;
    const a = parcela - j;
    totalJuros += j;
    parcelas.push(parcela);
    amortizacoes.push(a);
    saldo -= a;
    saldos.push(Math.max(saldo, 0));
  }
  return {
    primeiraParcela: parcelas[0],
    ultimaParcela: parcelas[parcelas.length - 1],
    totalJuros,
    parcelas,
    saldos,
    amortizacoes,
  };
}

export function simular(principal: number, n: number, im: number, sistema: string): Tabela {
  return sistema.toUpperCase() === "PRICE" ? price(principal, n, im) : sac(principal, n, im);
}

export function irCarneLeao(base: number, tabela = TABELA_IR_CARNE_LEAO_2026): number {
  if (base <= 0) return 0;
  for (const [limite, aliq, ded] of tabela) {
    if (base <= limite) return Math.max(0, base * aliq - ded);
  }
  return 0;
}

export interface AluguelLiquido {
  recebidoPosVacancia: number;
  admin: number;
  ir: number;
  liquido: number;
}

export function aluguelLiquido(
  bruto: number,
  p: Premissas,
  condominio = 0,
  iptuMensal = 0
): AluguelLiquido {
  const recebido = bruto * (1 - p.vacancia_meses_ano / 12);
  const admin = p.aluga_por_imobiliaria ? recebido * p.taxa_admin_imob : 0;
  const baseIr = Math.max(0, recebido - condominio - iptuMensal - admin);
  const ir = irCarneLeao(baseIr, p.tabela_ir_carne_leao);
  return { recebidoPosVacancia: recebido, admin, ir, liquido: recebido - admin - ir };
}

export function custosPosseTotal(
  valor: number,
  p: Premissas,
  condominio = 0,
  iptuAnual = 0,
  seguro = 0
): number {
  return condominio + iptuAnual / 12 + (valor * p.manutencao_aa_pct) / 12 + seguro;
}

export type Farol = "verde" | "amarelo" | "vermelho";

export function farol(desembolso: number, limiteAmarelo: number): Farol {
  if (desembolso <= 0) return "verde";
  if (desembolso <= limiteAmarelo) return "amarelo";
  return "vermelho";
}

export interface ResultadoDesembolso {
  parcela: number;
  custosPosse: number;
  aluguelLiquido: number;
  desembolso: number;
  pctCoberta: number;
  farol: Farol;
}

export function avaliarDesembolso(
  preco: number,
  entrada: number,
  aluguelBruto: number,
  p: Premissas,
  condominio = 0,
  iptuAnual = 0
): ResultadoDesembolso {
  const financiado = preco - entrada;
  const im = taxaMensal(p.taxa_aa, p.tr_aa);
  const tabela = simular(financiado, p.prazo_meses, im, p.sistema);
  const custos = custosPosseTotal(preco, p, condominio, iptuAnual);
  const al = aluguelLiquido(aluguelBruto, p, condominio, iptuAnual / 12);
  const desembolso = tabela.primeiraParcela + custos - al.liquido;
  return {
    parcela: tabela.primeiraParcela,
    custosPosse: custos,
    aluguelLiquido: al.liquido,
    desembolso,
    pctCoberta: tabela.primeiraParcela > 0 ? al.liquido / tabela.primeiraParcela : Infinity,
    farol: farol(desembolso, p.limite_amarelo),
  };
}

/** Entrada que zera o desembolso (bisseção). Mais entrada -> menor desembolso. */
export function entradaEquilibrio(
  preco: number,
  aluguelBruto: number,
  p: Premissas,
  condominio = 0,
  iptuAnual = 0
): number | null {
  let lo = preco * (1 - p.ltv_max);
  let hi = preco;
  const f = (e: number) =>
    avaliarDesembolso(preco, e, aluguelBruto, p, condominio, iptuAnual).desembolso;
  if (f(lo) <= 0) return lo;
  if (f(hi) > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 0.5) return mid;
    if (fm > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
