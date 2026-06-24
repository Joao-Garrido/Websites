"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Target } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "@/lib/api";
import type { Detalhe, HistoricoPreco, Imovel, Premissas as PremissasApi } from "@/lib/types";
import { brl, num, pct } from "@/lib/format";
import { FarolBadge } from "@/components/FarolBadge";
import { ScoreBars } from "@/components/ScoreBars";
import { Button, Card, CardBody, CardHeader, CardTitle, Slider, Spinner, Stat } from "@/components/ui/primitives";
import {
  avaliarDesembolso, PREMISSAS_DEFAULT, type Premissas as PremissasTs,
} from "@/lib/engine";

interface Overrides {
  entrada?: number; taxa_aa?: number; prazo_meses?: number; aluguel?: number;
  valorizacao_aa?: number; horizonte_anos?: number; aporte_extra?: number; sistema?: string;
}

export default function ImovelDetalhe({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [premissas, setPremissas] = useState<PremissasApi | null>(null);
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [historico, setHistorico] = useState<HistoricoPreco[]>([]);
  const [ov, setOv] = useState<Overrides>({});
  const [loading, setLoading] = useState(true);
  const [recalc, setRecalc] = useState(false);

  useEffect(() => {
    (async () => {
      const [im, pr, hist] = await Promise.all([
        api.getImovel(id), api.getPremissas(), api.historico(id),
      ]);
      setImovel(im);
      setPremissas(pr);
      setHistorico(hist);
      setOv({
        entrada: Math.round(im.preco * pr.entrada_padrao_pct),
        taxa_aa: pr.taxa_aa, prazo_meses: pr.prazo_meses,
        aluguel: im.aluguel_estimado || Math.round(im.preco * 0.004),
        valorizacao_aa: pr.valorizacao_aa, horizonte_anos: pr.horizonte_anos,
        aporte_extra: 0, sistema: pr.sistema,
      });
      setDetalhe(await api.detalhe(id, {}));
      setLoading(false);
    })();
  }, [id]);

  // recálculo autoritativo (debounce) ao mexer nos sliders
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const refetchDetalhe = useCallback((o: Overrides) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setRecalc(true);
      try { setDetalhe(await api.detalhe(id, o as Record<string, unknown>)); }
      finally { setRecalc(false); }
    }, 280);
  }, [id]);

  function set<K extends keyof Overrides>(k: K, v: Overrides[K]) {
    const novo = { ...ov, [k]: v };
    setOv(novo);
    refetchDetalhe(novo);
  }

  // preview instantâneo via espelho TS (bate com o Python)
  const preview = useMemo(() => {
    if (!imovel || !premissas) return null;
    const p: PremissasTs = {
      ...PREMISSAS_DEFAULT,
      taxa_aa: ov.taxa_aa ?? premissas.taxa_aa,
      tr_aa: premissas.tr_aa,
      sistema: (ov.sistema as "SAC" | "PRICE") ?? (premissas.sistema as "SAC" | "PRICE"),
      prazo_meses: ov.prazo_meses ?? premissas.prazo_meses,
      entrada_padrao_pct: premissas.entrada_padrao_pct,
      ltv_max: premissas.ltv_max,
      vacancia_meses_ano: premissas.vacancia_meses_ano,
      aluga_por_imobiliaria: premissas.aluga_por_imobiliaria,
      taxa_admin_imob: premissas.taxa_admin_imob,
      manutencao_aa_pct: premissas.manutencao_aa_pct,
      valorizacao_aa: ov.valorizacao_aa ?? premissas.valorizacao_aa,
      limite_amarelo: premissas.limite_amarelo,
      tabela_ir_carne_leao: (premissas.tabela_ir_carne_leao as [number, number, number][]) ?? PREMISSAS_DEFAULT.tabela_ir_carne_leao,
    };
    return avaliarDesembolso(
      imovel.preco, ov.entrada ?? 0, ov.aluguel ?? 0, p,
      imovel.condominio_mensal, imovel.iptu_anual);
  }, [imovel, premissas, ov]);

  if (loading || !imovel || !detalhe) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  const d = detalhe;
  const entradaMin = Math.round(imovel.preco * (1 - (premissas?.ltv_max ?? 0.8)));
  const waterfall = [
    { nome: "Aluguel líq.", valor: d.desembolso_waterfall["aluguel_liquido"] },
    { nome: "− Parcela", valor: d.desembolso_waterfall["(-) parcela"] },
    { nome: "− Custos", valor: d.desembolso_waterfall["(-) custos_posse"] },
    { nome: "= Desembolso", valor: -d.desembolso_liquido },
  ];

  return (
    <div className="space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Voltar ao feed
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{imovel.titulo || `${imovel.tipo} ${imovel.area_m2}m²`}</h1>
          <p className="text-sm text-slate-500">
            {[imovel.bairro, imovel.cidade].filter(Boolean).join(", ")}{imovel.uf ? `-${imovel.uf}` : ""}
            {" · "}{imovel.quartos}q · {imovel.vagas} vaga(s) · {imovel.area_m2}m² · {imovel.fonte}
          </p>
          {imovel.url && (
            <a href={imovel.url} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
              Ver anúncio original ↗
            </a>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{brl(imovel.preco)}</div>
          <div className="text-xs text-slate-500">{brl(imovel.preco_m2)}/m²
            {imovel.desconto_regiao_pct != null && imovel.desconto_regiao_pct > 0.01 &&
              <span className="ml-1 text-green-700">({pct(imovel.desconto_regiao_pct, 0)} abaixo)</span>}
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Desembolso/mês" accent={d.desembolso_liquido <= 0 ? "text-green-700" : "text-red-700"}
          value={brl(d.desembolso_liquido)} hint={preview ? `preview ${brl(preview.desembolso)}` : undefined} />
        <Stat label="% parcela coberta" value={pct(d.pct_coberta)} />
        <Stat label="Opportunity Score" value={d.opportunity_score.toFixed(0)} />
        <div className="flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
          <FarolBadge farol={d.farol} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Sliders / cenário */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Cenário {recalc && <RefreshCw className="ml-1 inline h-3 w-3 animate-spin" />}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Slider label="Entrada" min={entradaMin} max={imovel.preco} step={5000}
              value={ov.entrada ?? 0} onChange={(v) => set("entrada", v)} format={brl} />
            <Slider label="Taxa a.a." min={0.06} max={0.18} step={0.001}
              value={ov.taxa_aa ?? 0.115} onChange={(v) => set("taxa_aa", v)} format={(v) => pct(v, 2)} />
            <Slider label="Prazo (meses)" min={60} max={420} step={12}
              value={ov.prazo_meses ?? 360} onChange={(v) => set("prazo_meses", v)} format={(v) => `${v}`} />
            <Slider label="Aluguel bruto" min={0} max={Math.round(imovel.preco * 0.01)} step={50}
              value={ov.aluguel ?? 0} onChange={(v) => set("aluguel", v)} format={brl} />
            <Slider label="Valorização a.a." min={0} max={0.15} step={0.005}
              value={ov.valorizacao_aa ?? 0.05} onChange={(v) => set("valorizacao_aa", v)} format={(v) => pct(v, 1)} />
            <Slider label="Horizonte (anos)" min={1} max={30} step={1}
              value={ov.horizonte_anos ?? 10} onChange={(v) => set("horizonte_anos", v)} format={(v) => `${v}a`} />
            <Slider label="Aporte extra/mês" min={0} max={5000} step={100}
              value={ov.aporte_extra ?? 0} onChange={(v) => set("aporte_extra", v)} format={brl} />

            <div className="border-t border-slate-100 pt-3">
              <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                <Target className="h-3.5 w-3.5" /> Resolver pra equilíbrio (desembolso = 0)
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <Button size="sm" variant="outline" disabled={d.break_evens.entrada_equilibrio == null}
                  onClick={() => d.break_evens.entrada_equilibrio && set("entrada", Math.round(d.break_evens.entrada_equilibrio))}>
                  Entrada: {d.break_evens.entrada_equilibrio ? brl(d.break_evens.entrada_equilibrio) : "n/d"}
                </Button>
                <Button size="sm" variant="outline" disabled={d.break_evens.aluguel_equilibrio == null}
                  onClick={() => d.break_evens.aluguel_equilibrio && set("aluguel", Math.round(d.break_evens.aluguel_equilibrio))}>
                  Aluguel: {d.break_evens.aluguel_equilibrio ? brl(d.break_evens.aluguel_equilibrio) : "n/d"}
                </Button>
                <div className="text-xs text-slate-500">
                  Prazo de equilíbrio: {d.break_evens.prazo_equilibrio ? `${d.break_evens.prazo_equilibrio} meses` : "nem prazo infinito zera"}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Waterfall + métricas */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Cascata do desembolso (mensal)</CardTitle></CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={waterfall}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nome" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => brl(v)} width={70} />
                  <Tooltip formatter={(v: number) => brl(v)} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Bar dataKey="valor">
                    {waterfall.map((e, i) => (
                      <Cell key={i} fill={e.valor >= 0 ? "#16a34a" : "#dc2626"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                <Stat label="Parcela 1ª" value={brl(d.parcela_1)} />
                <Stat label="Aluguel líq." value={brl(d.aluguel_liquido_breakdown["= liquido"])}
                  hint={`bruto ${brl(d.aluguel_bruto)} (${d.aluguel_origem})`} />
                <Stat label="Custos posse" value={brl(d.custos_posse.condominio + d.custos_posse.iptu_mensal + d.custos_posse.manutencao)} />
                <Stat label="Cap rate" value={pct(d.metricas.cap_rate)} />
                <Stat label="Cash-on-cash" value={pct(d.metricas.cash_on_cash)} />
                <Stat label={`TIR ${ov.horizonte_anos}a`} value={pct(d.metricas.tir_anual)} />
                <Stat label="Capital investido" value={brl(d.capital_investido["total"] ?? Object.values(d.capital_investido).reduce((a, b) => a + b, 0))} />
                <Stat label="LTV" value={pct(d.metricas.ltv)} />
                <Stat label="Juros totais" value={brl(d.total_juros)} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Saldo devedor × patrimônio</CardTitle></CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={d.cronograma}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ano" fontSize={11} tickFormatter={(v) => `${v}a`} />
                  <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={45} />
                  <Tooltip formatter={(v: number) => brl(v)} labelFormatter={(l) => `Ano ${l}`} />
                  <Area type="monotone" dataKey="valor_imovel" stroke="#0ea5e9" fill="#bae6fd" name="Valor imóvel" />
                  <Area type="monotone" dataKey="saldo_devedor" stroke="#dc2626" fill="#fecaca" name="Saldo devedor" />
                  <Area type="monotone" dataKey="patrimonio" stroke="#16a34a" fill="#bbf7d0" name="Patrimônio" />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      </div>

      {d.comparaveis && (
        <Card>
          <CardHeader><CardTitle>Referência da região {d.comparaveis.regiao ? `· ${d.comparaveis.regiao}` : ""}</CardTitle></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat label="R$/m² deste imóvel" value={brl(d.comparaveis.preco_m2_imovel)} />
              <Stat label="Mediana R$/m² (venda)" value={brl(d.comparaveis.preco_m2_mediana_venda)}
                hint={d.comparaveis.n_amostras ? `${d.comparaveis.n_amostras} anúncios` : "amostra insuficiente"} />
              <Stat label="Desconto vs região"
                accent={(d.comparaveis.desconto_regiao_pct ?? 0) > 0 ? "text-green-700" : "text-slate-900"}
                value={d.comparaveis.desconto_regiao_pct != null ? pct(d.comparaveis.desconto_regiao_pct) : "—"} />
              <Stat label="Mediana R$/m² (aluguel)" value={brl(d.comparaveis.preco_m2_mediana_aluguel)} />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Referência = {d.comparaveis.origem}. Não são transações registradas (ITBI/cartório),
              que não têm base pública no Brasil.
            </p>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por que este score? {d.opportunity_score.toFixed(0)}/100</CardTitle>
          </CardHeader>
          <CardBody>
            <ScoreBars componentes={d.score_breakdown.componentes} pesos={d.score_breakdown.pesos}
              contribuicoes={d.score_breakdown.contribuicoes} />
            <div className="mt-3 text-xs text-slate-500">{d.score_breakdown.tag}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Histórico de preço</CardTitle></CardHeader>
          <CardBody>
            {historico.length < 2 ? (
              <p className="py-10 text-center text-sm text-slate-400">Sem variação de preço registrada ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historico.map((h) => ({ ...h, data: h.data.slice(0, 10) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="data" fontSize={10} />
                  <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={45} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v: number) => brl(v)} />
                  <Line type="monotone" dataKey="preco" stroke="#0f172a" dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {d.amortizacao_extra && d.amortizacao_extra.extra_mensal > 0 && (
        <Card>
          <CardHeader><CardTitle>Amortização extraordinária ({d.amortizacao_extra.modo})</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat label="Aporte extra/mês" value={brl(d.amortizacao_extra.extra_mensal)} />
            <Stat label="Prazo" value={`${d.amortizacao_extra.prazo_novo} meses`}
              hint={`era ${d.amortizacao_extra.prazo_original}`} />
            <Stat label="Economia de juros" accent="text-green-700" value={brl(d.amortizacao_extra.economia_juros)} />
            <Stat label="Juros (novo)" value={brl(d.amortizacao_extra.total_juros_novo)} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
