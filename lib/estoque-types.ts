// ----------------------------------------
// 1. Status possíveis de uma linha do estoque
// ----------------------------------------
export type Status = "ABERTO" | "VENCIDO" | "LIQUIDADO";

// ----------------------------------------
// 2. Como uma linha chega "crua" do CSV
// Tudo é string porque vem direto do arquivo de texto
// ----------------------------------------
export type LinhaCsvBruta = {
  cedente: string;
  sacado: string;
  nf: string;
  valor: string;
  vencimento: string;
  status: string;
};

// ----------------------------------------
// 3. Como uma linha fica DEPOIS de validada e processada
// Aqui os tipos já são "de verdade" (number, Status, etc)
// + campos calculados pelas regras de negócio
// ----------------------------------------
export type EstoqueLinha = {
  cedente: string;
  sacado: string;
  nf: string;
  valor: number;
  vencimento: string; // formato YYYY-MM-DD
  status: Status;

  // campos calculados (não vêm do CSV, são derivados)
  vencidoOperacional: boolean; // true se status=VENCIDO OU vencimento < data ref
  diasAtraso: number;          // 0 se não vencido
  pdd: number;                 // valor em R$ da provisão (não %)
  ativo: boolean;              // true se ABERTO ou VENCIDO (participa dos cálculos)
};

// ----------------------------------------
// 4. Erro de validação de uma linha
// ----------------------------------------
export type ErroLinha = {
  linha: number;      // número da linha no CSV (pra facilitar debug do usuário)
  motivo: string;      // ex: "NF vazia", "NF duplicada", "Valor inválido"
  dadosOriginais?: LinhaCsvBruta;
};

// ----------------------------------------
// 5. Alerta de concentração por sacado
// ----------------------------------------
export type AlertaConcentracao = {
  sacado: string;
  valorTotal: number;
  percentual: number; // ex: 32.5 significa 32.5%
};

// ----------------------------------------
// 6. Indicadores exibidos nos cards
// ----------------------------------------
export type Indicadores = {
  quantidadeEstoqueAtivo: number; // contagem de linhas ativas (ABERTO + VENCIDO)
  somaEstoqueAtivo: number;       // soma do valor das linhas ativas
  percentualVencido: number;      // % do estoque ativo que está vencido
  pddTotal: number;               // soma de todos os PDDs em R$
  maiorSacado: AlertaConcentracao | null;
};

// ----------------------------------------
// 7. Resultado retornado pela API de importação
// ----------------------------------------
export type ResultadoImportacao = {
  aceito: boolean;          // false se a taxa de erro > 20% (arquivo rejeitado)
  totalLinhas: number;
  linhasValidas: number;
  linhasInvalidas: number;
  taxaErro: number;         // ex: 0.21 = 21%
  erros: ErroLinha[];
};

// ----------------------------------------
// 8. Snapshot completo guardado em memória
// É isso que a GET /api/estoque devolve
// ----------------------------------------
export type EstoqueSnapshot = {
  dataImportacao: string;             // ISO string de quando foi importado
  estoque: EstoqueLinha[];             // todas as linhas válidas (incluindo LIQUIDADO)
  indicadores: Indicadores;
  alertasConcentracao: AlertaConcentracao[];
  ultimoResultadoImportacao: ResultadoImportacao | null;
};