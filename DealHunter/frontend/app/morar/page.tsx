"use client";
import { useMemo, useState } from "react";
import { Building2, ExternalLink, Home } from "lucide-react";
import { sac, taxaMensal } from "@/lib/engine";
import { brl, pct } from "@/lib/format";
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Select, Slider, Stat } from "@/components/ui/primitives";

// Bairros perto da Faria Lima / JK (estágio Bradesco)
const BAIRROS = [
  "Itaim Bibi", "Vila Olímpia", "Pinheiros", "Vila Madalena",
  "Jardim Paulistano", "Brooklin", "Cidade Monções",
];

function slug(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim().replace(/\s+/g, "-");
}

type Tipo = "apartamento" | "studio";

function portalLinks(bairro: string, tipo: Tipo, precoMax: number) {
  const b = slug(bairro);
  const qa = tipo === "studio" ? "kitnet" : "apartamento";
  const zapTipo = tipo === "studio" ? "studio" : "apartamentos";
  return [
    { nome: "QuintoAndar", url: `https://www.quintoandar.com.br/comprar/imovel/${b}-sao-paulo-sp-brasil/${qa}/q-ate-${precoMax}` },
    { nome: "VivaReal", url: `https://www.vivareal.com.br/venda/sp/sao-paulo/${b}/apartamento_residencial/` },
    { nome: "ZAP", url: `https://www.zapimoveis.com.br/venda/${zapTipo}/sp+sao-paulo+zona-sul+${b}/` },
    { nome: "Imovelweb", url: `https://www.imovelweb.com.br/apartamentos-venda-${b}-sao-paulo.html` },
  ];
}

export default function MorarPage() {
  const [bairros, setBairros] = useState<string[]>(["Itaim Bibi", "Vila Olímpia", "Pinheiros"]);
  const [tipo, setTipo] = useState<Tipo>("studio");
  const [precoMax, setPrecoMax] = useState(700000);

  // calculadora de custo de morar
  const [preco, setPreco] = useState(550000);
  const [condo, setCondo] = useState(900);
  const [iptuAno, setIptuAno] = useState(3000);
  const [entradaPct, setEntradaPct] = useState(0.20);
  const [taxa, setTaxa] = useState(0.115);
  const [prazo, setPrazo] = useState(360);
  const [aluguelEquiv, setAluguelEquiv] = useState(2800);
  const [rendaFamiliar, setRendaFamiliar] = useState(8000);

  function toggleBairro(b: string) {
    setBairros((s) => s.includes(b) ? s.filter((x) => x !== b) : [...s, b]);
  }

  const calc = useMemo(() => {
    const entrada = preco * entradaPct;
    const fin = preco - entrada;
    const im = taxaMensal(taxa);
    const t = sac(fin, prazo, im);
    const manut = preco * 0.005 / 12;
    const custoMorar = t.primeiraParcela + condo + iptuAno / 12 + manut;
    const capital = entrada + preco * (0.03 + 0.01 + 0.0075) + 3000;
    const rendaExigida = t.primeiraParcela / 0.30;
    return {
      entrada, fin, parcela1: t.primeiraParcela, parcelaUlt: t.ultimaParcela,
      custoMorar, capital, rendaExigida, aprova: rendaFamiliar >= rendaExigida,
      vsAlugar: custoMorar - aluguelEquiv,
    };
  }, [preco, entradaPct, taxa, prazo, condo, iptuAno, aluguelEquiv, rendaFamiliar]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Building2 className="h-6 w-6" /> Comprar para morar — perto da Faria Lima / JK
        </h1>
        <p className="text-sm text-slate-500">
          Foco em <b>morar</b> (não no "se paga"). Busca direto nos portais (sempre atualizado) e calcula teu <b>custo real de morar</b>.
        </p>
      </div>

      {/* Busca ao vivo nos portais */}
      <Card>
        <CardHeader><CardTitle>Buscar imóveis nos portais (links ao vivo)</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className="w-40">
              <option value="studio">Studio / kitnet</option>
              <option value="apartamento">Apartamento</option>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">até</span>
              <Input type="number" value={precoMax} onChange={(e) => setPrecoMax(Number(e.target.value))} className="w-36" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BAIRROS.map((b) => (
              <button key={b} onClick={() => toggleBairro(b)}
                className={`rounded-full border px-3 py-1 text-xs ${bairros.includes(b)
                  ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
                {b}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {bairros.length === 0 && <p className="text-sm text-slate-400">Selecione ao menos um bairro.</p>}
            {bairros.map((b) => (
              <div key={b} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="w-36 text-sm font-medium">{b}</span>
                {portalLinks(b, tipo, precoMax).map((l) => (
                  <a key={l.nome} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">
                    {l.nome} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Os links abrem a busca atual do portal (preços e disponibilidade reais). Ajuste o filtro de preço dentro do portal se precisar.
          </p>
        </CardBody>
      </Card>

      {/* Calculadora de custo de morar */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Calculadora — custo de morar</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Slider label="Preço do imóvel" min={200000} max={1500000} step={10000}
              value={preco} onChange={setPreco} format={brl} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Condomínio/mês</label>
                <Input type="number" value={condo} onChange={(e) => setCondo(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs text-slate-500">IPTU/ano</label>
                <Input type="number" value={iptuAno} onChange={(e) => setIptuAno(Number(e.target.value))} />
              </div>
            </div>
            <Slider label="Entrada" min={0.10} max={0.60} step={0.01}
              value={entradaPct} onChange={setEntradaPct} format={(v) => `${pct(v, 0)} (${brl(preco * v)})`} />
            <Slider label="Taxa a.a." min={0.08} max={0.16} step={0.001}
              value={taxa} onChange={setTaxa} format={(v) => pct(v, 2)} />
            <Slider label="Prazo (meses)" min={120} max={420} step={12}
              value={prazo} onChange={setPrazo} format={(v) => `${v}`} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Aluguel equivalente</label>
                <Input type="number" value={aluguelEquiv} onChange={(e) => setAluguelEquiv(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Renda familiar/mês</label>
                <Input type="number" value={rendaFamiliar} onChange={(e) => setRendaFamiliar(Number(e.target.value))} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Parcela 1ª (SAC)" value={brl(calc.parcela1)} hint={`última ${brl(calc.parcelaUlt)}`} />
              <Stat label="Custo p/ MORAR /mês" accent="text-slate-900"
                value={brl(calc.custoMorar)} hint="parcela+condo+IPTU+manut" />
              <Stat label="Dinheiro na mão" value={brl(calc.capital)} hint="entrada+ITBI+cartório" />
              <Stat label="Renda exigida (banco)" value={brl(calc.rendaExigida)} hint="~3× a parcela" />
            </div>

            <div className={`rounded-lg border p-3 text-sm ${calc.aprova
              ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
              {calc.aprova
                ? `✅ Renda familiar de ${brl(rendaFamiliar)} aprova (precisa de ~${brl(calc.rendaExigida)}).`
                : `❌ Renda familiar de ${brl(rendaFamiliar)} NÃO aprova — banco pede ~${brl(calc.rendaExigida)}. Some renda da namorada/pais ou financie menos.`}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-medium">Comprar vs. alugar (custo mensal)</div>
              <div className="mt-1 text-slate-600">
                Morar comprado: <b>{brl(calc.custoMorar)}</b> · Alugar equivalente: <b>{brl(aluguelEquiv)}</b>
              </div>
              <div className={calc.vsAlugar > 0 ? "text-red-700" : "text-green-700"}>
                {calc.vsAlugar > 0
                  ? `Comprar custa ${brl(calc.vsAlugar)}/mês a mais que alugar (fora os ${brl(calc.capital)} travados na entrada).`
                  : `Comprar custa ${brl(-calc.vsAlugar)}/mês a menos que alugar.`}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Nos 1ºs anos do SAC a maior parte da parcela é juro (não vira patrimônio). Compare também o custo de oportunidade da entrada investida.
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
