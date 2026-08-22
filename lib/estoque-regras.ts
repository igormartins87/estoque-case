import { parseCsv } from "./csv-parser";
import type {
  LinhaCsvBruta,
  Status,
  EstoqueLinha,
  ErroLinha,
  AlertaConcentracao,
  Indicadores,
  ResultadoImportacao,
} from "./estoque-types";

// ==========================================================
// CONSTANTES DO CASE (regras 4, 6 e 7 do enunciado)
// ==========================================================
export const DATA_REFERENCIA = "2026-08-21";
export const LIMITE_CONCENTRACAO = 0.25; // 25% — regra 6
export const LIMITE_TAXA_ERRO = 0.2;     // 20% — regra 7

// ==========================================================
// UTILITÁRIOS DE TEXTO E NÚMERO
// ==========================================================

// Normaliza texto para comparação (regra 2 e 6: ignora maiúscula/minúscula e espaços)
function normalizarTexto(texto: string): string {
  return texto.trim().toLowerCase();
}

// Regra 1: valor aceita ponto OU vírgula como separador decimal
export function parseValor(valorBruto: string): number | null {
  const normalizado = valorBruto.trim().replace(",", ".");
  if (normalizado === "") return null;

  const numero = Number(normalizado);
  if (Number.isNaN(numero)) return null;

  return numero;
}

// ==========================================================
// DATAS (regra 1: formato YYYY-MM-DD válido / regra 4 e 5: cálculo de dias)
// ==========================================================

const DATA_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

// Valida formato E se a data realmente existe (rejeita 2026-02-30, por exemplo)
export function validarFormatoData(dataBruta: string): boolean {
  const match = DATA_REGEX.exec(dataBruta.trim());
  if (!match) return false;

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);

  // Cria a data em UTC e verifica se os componentes "sobreviveram"
  // Se eu mandar dia 30 de fevereiro, o JS "empurra" pra março —
  // e aí a comparação abaixo vai falhar, denunciando a data inválida
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

// Converte "YYYY-MM-DD" em timestamp UTC (evita bug de fuso horário)
function paraTimestampUTC(dataStr: string): number {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

// Regra 5: "Dias de atraso = data referência menos vencimento"
// Positivo = já venceu há X dias. Negativo ou zero = ainda não venceu.
export function calcularDiasAtraso(
  vencimento: string,
  dataReferencia: string = DATA_REFERENCIA
): number {
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  const diferenca = paraTimestampUTC(dataReferencia) - paraTimestampUTC(vencimento);
  return Math.round(diferenca / MS_POR_DIA);
}

// Regra 4: vencido operacional = status VENCIDO OU data já passou
// Comparação de string funciona pois o formato YYYY-MM-DD é ordenável lexicograficamente
export function calcularVencidoOperacional(
  status: Status,
  vencimento: string,
  dataReferencia: string = DATA_REFERENCIA
): boolean {
  return status === "VENCIDO" || vencimento < dataReferencia;
}

// Regra 5: PDD é calculado pela DATA, não pelo status
export function calcularPdd(valor: number, diasAtraso: number): number {
  if (diasAtraso <= 0) return 0;
  if (diasAtraso <= 30) return valor * 0.5;
  return valor * 1.0;
}

// ==========================================================
// VALIDAÇÃO DE LINHA (regra 1)
// ==========================================================

export type ValidacaoLinha =
  | { valido: true; valorNumerico: number }
  | { valido: false; motivo: string };

export function validarLinha(dados: LinhaCsvBruta): ValidacaoLinha {
  const nf = dados.nf.trim();
  if (nf === "") {
    return { valido: false, motivo: "NF vazia" };
  }

  const valorNumerico = parseValor(dados.valor);
  if (valorNumerico === null || valorNumerico <= 0) {
    return { valido: false, motivo: "Valor inválido (deve ser número maior que zero)" };
  }

  const vencimento = dados.vencimento.trim();
  if (!validarFormatoData(vencimento)) {
    return { valido: false, motivo: "Vencimento inválido (formato esperado: YYYY-MM-DD)" };
  }

  const status = dados.status.trim();
  if (status !== "ABERTO" && status !== "VENCIDO" && status !== "LIQUIDADO") {
    return { valido: false, motivo: `Status inválido: "${status}"` };
  }

  return { valido: true, valorNumerico };
}

// ==========================================================
// DUPLICATAS (regra 2)
// ==========================================================

export function gerarChaveDuplicata(cedente: string, nf: string): string {
  return `${normalizarTexto(cedente)}|${normalizarTexto(nf)}`;
}

// ==========================================================
// CONCENTRAÇÃO POR SACADO (regra 6)
// ==========================================================

type AgregadoSacado = {
  nomeExibicao: string;
  valorTotal: number;
};

function agruparPorSacado(linhas: EstoqueLinha[]): Map<string, AgregadoSacado> {
  const mapa = new Map<string, AgregadoSacado>();

  for (const linha of linhas) {
    const chave = normalizarTexto(linha.sacado);
    const existente = mapa.get(chave);

    if (existente) {
      existente.valorTotal += linha.valor;
    } else {
      // guarda o nome como veio na primeira ocorrência, pra exibição bonita na tela
      mapa.set(chave, { nomeExibicao: linha.sacado, valorTotal: linha.valor });
    }
  }

  return mapa;
}

// ==========================================================
// INDICADORES (cards da tela)
// ==========================================================

function calcularIndicadoresEConcentracao(todasLinhas: EstoqueLinha[]): {
  indicadores: Indicadores;
  alertas: AlertaConcentracao[];
} {
  // Regra 3: estoque ativo = ABERTO + VENCIDO (LIQUIDADO fica de fora)
  const linhasAtivas = todasLinhas.filter((linha) => linha.ativo);

  const quantidadeEstoqueAtivo = linhasAtivas.length;
  const somaEstoqueAtivo = linhasAtivas.reduce((soma, linha) => soma + linha.valor, 0);

  const somaVencidas = linhasAtivas
    .filter((linha) => linha.vencidoOperacional)
    .reduce((soma, linha) => soma + linha.valor, 0);

  const percentualVencido =
    somaEstoqueAtivo === 0 ? 0 : (somaVencidas / somaEstoqueAtivo) * 100;

  const pddTotal = linhasAtivas.reduce((soma, linha) => soma + linha.pdd, 0);

  const agregadoPorSacado = agruparPorSacado(linhasAtivas);

  const todasConcentracoes: AlertaConcentracao[] = Array.from(
    agregadoPorSacado.values()
  ).map((agregado) => ({
    sacado: agregado.nomeExibicao,
    valorTotal: agregado.valorTotal,
    percentual:
      somaEstoqueAtivo === 0 ? 0 : (agregado.valorTotal / somaEstoqueAtivo) * 100,
  }));

  todasConcentracoes.sort((a, b) => b.percentual - a.percentual);

  // Card "maior sacado" mostra o maior de todos, mesmo que não passe de 25%
  const maiorSacado = todasConcentracoes[0] ?? null;

  // Alerta amarelo só entra quem PASSA de 25% (estritamente maior)
  const alertas = todasConcentracoes.filter(
    (item) => item.percentual > LIMITE_CONCENTRACAO * 100
  );

  return {
    indicadores: {
      quantidadeEstoqueAtivo,
      somaEstoqueAtivo,
      percentualVencido,
      pddTotal,
      maiorSacado,
    },
    alertas,
  };
}

// ==========================================================
// ORQUESTRADOR: junta parser + validação + regras + trava (regra 7)
// ==========================================================

export type ResultadoProcessamento = {
  resultado: ResultadoImportacao;
  linhasValidas: EstoqueLinha[];
  indicadores: Indicadores | null;
  alertasConcentracao: AlertaConcentracao[];
};

export function processarImportacao(csvTexto: string): ResultadoProcessamento {
  const parse = parseCsv(csvTexto);

  // Cabeçalho errado -> rejeita o arquivo inteiro, sem nem olhar as linhas
  if (!parse.cabecalhoValido) {
    return {
      resultado: {
        aceito: false,
        totalLinhas: parse.linhas.length,
        linhasValidas: 0,
        linhasInvalidas: parse.linhas.length,
        taxaErro: 1,
        erros: [
          {
            linha: 0,
            motivo: `Cabeçalho inválido. Esperado: ${parse.colunasEsperadas.join(",")}`,
          },
        ],
      },
      linhasValidas: [],
      indicadores: null,
      alertasConcentracao: [],
    };
  }

  const erros: ErroLinha[] = [];
  const linhasValidas: EstoqueLinha[] = [];
  const chavesVistas = new Set<string>();

  for (const { numero, dados } of parse.linhas) {
    const validacao = validarLinha(dados);

    if (!validacao.valido) {
      erros.push({ linha: numero, motivo: validacao.motivo, dadosOriginais: dados });
      continue;
    }

    // Regra 2: duplicata (só verifica depois de a linha já ser válida)
    const chave = gerarChaveDuplicata(dados.cedente, dados.nf);
    if (chavesVistas.has(chave)) {
      erros.push({ linha: numero, motivo: "NF duplicada", dadosOriginais: dados });
      continue;
    }
    chavesVistas.add(chave);

    const vencimento = dados.vencimento.trim();
    const status = dados.status.trim() as Status;

    const vencidoOperacional = calcularVencidoOperacional(status, vencimento);
    const diasAtraso = calcularDiasAtraso(vencimento);
    const pdd = calcularPdd(validacao.valorNumerico, diasAtraso);
    const ativo = status !== "LIQUIDADO";

    linhasValidas.push({
      cedente: dados.cedente.trim(),
      sacado: dados.sacado.trim(),
      nf: dados.nf.trim(),
      valor: validacao.valorNumerico,
      vencimento,
      status,
      vencidoOperacional,
      diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
      pdd,
      ativo,
    });
  }

  const totalLinhas = parse.linhas.length;
  const taxaErro = totalLinhas === 0 ? 0 : erros.length / totalLinhas;

  // Regra 7: trava de 20% — rejeita tudo, não grava nada
  if (taxaErro > LIMITE_TAXA_ERRO) {
    return {
      resultado: {
        aceito: false,
        totalLinhas,
        linhasValidas: linhasValidas.length,
        linhasInvalidas: erros.length,
        taxaErro,
        erros,
      },
      linhasValidas: [],
      indicadores: null,
      alertasConcentracao: [],
    };
  }

  const { indicadores, alertas } = calcularIndicadoresEConcentracao(linhasValidas);

  return {
    resultado: {
      aceito: true,
      totalLinhas,
      linhasValidas: linhasValidas.length,
      linhasInvalidas: erros.length,
      taxaErro,
      erros,
    },
    linhasValidas,
    indicadores,
    alertasConcentracao: alertas,
  };
}