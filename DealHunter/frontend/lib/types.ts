export type Farol = "verde" | "amarelo" | "vermelho";

export interface Imovel {
  id: number;
  fonte: string;
  url?: string | null;
  tipo: string;
  titulo?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  lat?: number | null;
  lng?: number | null;
  preco: number;
  area_m2?: number | null;
  quartos?: number | null;
  banheiros?: number | null;
  vagas?: number | null;
  condominio_mensal: number;
  iptu_anual: number;
  aluguel_estimado?: number | null;
  aluguel_origem: string;
  preco_m2?: number | null;
  desconto_regiao_pct?: number | null;
  opportunity_score?: number | null;
  farol?: Farol | null;
  desembolso_liquido?: number | null;
  pct_coberta?: number | null;
  cap_rate?: number | null;
  score_breakdown?: ScoreBreakdown | null;
  metricas?: Record<string, number | null> | null;
  arquivado?: boolean;
}

export interface ScoreBreakdown {
  score: number;
  tag: string;
  componentes: Record<string, number>;
  pesos: Record<string, number>;
  contribuicoes: Record<string, number>;
}

export interface Detalhe {
  imovel_id: number;
  entrada: number;
  aluguel_bruto: number;
  aluguel_origem: string;
  valor_financiado: number;
  i_m: number;
  parcela_1: number;
  parcela_ultima: number;
  total_juros: number;
  aluguel_liquido_breakdown: Record<string, number>;
  custos_posse: { condominio: number; iptu_mensal: number; manutencao: number; seguro: number };
  capital_investido: Record<string, number>;
  desembolso_liquido: number;
  desembolso_waterfall: Record<string, number>;
  pct_coberta: number;
  farol: Farol;
  opportunity_score: number;
  score_breakdown: { componentes: Record<string, number>; pesos: Record<string, number>; contribuicoes: Record<string, number>; tag: string };
  metricas: Record<string, number | null>;
  break_evens: { entrada_equilibrio: number | null; aluguel_equilibrio: number | null; prazo_equilibrio: number | null };
  cronograma: { ano: number; saldo_devedor: number; valor_imovel: number; patrimonio: number }[];
  comparaveis?: {
    regiao: string | null;
    preco_m2_imovel: number | null;
    preco_m2_mediana_venda: number | null;
    preco_m2_mediana_aluguel: number | null;
    n_amostras: number | null;
    desconto_regiao_pct: number | null;
    origem: string;
  } | null;
  url?: string | null;
  amortizacao_extra?: {
    modo: string; extra_mensal: number; prazo_original: number; prazo_novo: number;
    total_juros_original: number; total_juros_novo: number; economia_juros: number;
  } | null;
}

export interface HistoricoPreco { data: string; preco: number; }

export interface Premissas {
  taxa_aa: number; tr_aa: number; sistema: string; prazo_meses: number;
  entrada_padrao_pct: number; ltv_max: number; mip_pct_mes: number; dfi_pct_mes: number;
  taxa_adm_fin: number; itbi_pct: number; escritura_pct: number; registro_pct: number;
  avaliacao_banco: number; vacancia_meses_ano: number; aluga_por_imobiliaria: boolean;
  taxa_admin_imob: number; manutencao_aa_pct: number; valorizacao_aa: number;
  inflacao_aa: number; horizonte_anos: number; taxa_desconto_vpl: number;
  corretagem_venda_pct: number; ir_ganho_capital_pct: number; limite_amarelo: number;
  pesos_opportunity_score: Record<string, number>; cap_rate_benchmark: number;
  tabela_ir_carne_leao: number[][];
}

export interface PerfilBusca {
  id: number; nome: string; regioes: string[]; tipo?: string | null;
  preco_min?: number | null; preco_max?: number | null; quartos_min?: number | null;
  criterio_viabilidade?: { tipo: string; valor: number | string } | null;
  agendamento?: string | null; monitorar: boolean; ultima_execucao?: string | null;
}

export interface Alerta {
  id: number; imovel_id?: number | null; perfil_id?: number | null;
  tipo: string; motivo: string; lido: boolean; criado_em?: string | null;
}

export interface Filtro {
  cidade?: string | null; uf?: string | null; tipo?: string | null;
  preco_max?: number | null; preco_min?: number | null; quartos_min?: number | null;
  vagas_min?: number | null; desembolso_max?: number | null; farol?: string | null;
  cap_rate_min?: number | null; desconto_min?: number | null;
  cash_flow_positivo?: boolean | null; ordenar_por?: string | null;
}

export interface BuscaNLResponse {
  filtro: Filtro; fonte_parser: string; total: number; resultados: Imovel[]; perfil_id?: number | null;
}

export interface SweepResponse {
  encontrados: number; novos: number; atualizados: number; duplicados: number;
  erros: Record<string, string>; alertas_gerados: number;
}

export interface MapaPin {
  id: number; lat: number; lng: number; farol: Farol; opportunity_score: number;
  preco: number; titulo?: string; bairro?: string; cidade?: string; desembolso_liquido?: number;
}
