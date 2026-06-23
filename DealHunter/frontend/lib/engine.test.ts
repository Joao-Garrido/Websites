/**
 * Verifica que o espelho TS bate com o §13 (mesma tolerância do pytest).
 * Rodar: node --experimental-strip-types lib/engine.test.ts
 */
import assert from "node:assert";
import {
  PREMISSAS_DEFAULT,
  avaliarDesembolso,
  price,
  sac,
  taxaMensal,
} from "./engine.ts";

let passed = 0;
function check(nome: string, cond: boolean) {
  assert.ok(cond, "FALHOU: " + nome);
  passed++;
  console.log("  ok -", nome);
}

const im = taxaMensal(0.115);
check("i_m ~ 0.9107%/mes", Math.abs(im - 0.0091107) < 5e-6);

// SAC §13
const casos: [number, number, number][] = [
  [500000, 5945, 822400],
  [400000, 4756, 657920],
  [300000, 3567, 493440],
];
for (const [fin, parcela, juros] of casos) {
  const t = sac(fin, 360, im);
  check(`SAC ${fin} 1a parcela ~${parcela}`, Math.abs(t.primeiraParcela - parcela) <= 1);
  check(`SAC ${fin} juros ~${juros}`, Math.abs(t.totalJuros - juros) <= 150);
}

// Price §13
const tp = price(500000, 360, im);
check("Price parcela ~4737", Math.abs(tp.primeiraParcela - 4737) <= 1);
check("Price juros ~1.205.342", Math.abs(tp.totalJuros - 1205342) <= 150);

// Desembolso §13
const r = avaliarDesembolso(700000, 200000, 3000, PREMISSAS_DEFAULT, 800, 3600);
check("desembolso ~4587", Math.abs(r.desembolso - 4587) <= 2);
check("aluguel liquido ~2750", Math.abs(r.aluguelLiquido - 2750) <= 1);
check("farol vermelho", r.farol === "vermelho");

console.log(`\n${passed} verificacoes OK — espelho TS bate com o §13.`);
