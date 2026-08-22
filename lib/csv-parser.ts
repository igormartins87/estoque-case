import type { LinhaCsvBruta } from "./estoque-types";

// Colunas que esperamos encontrar, na ordem exata
const COLUNAS_ESPERADAS = [
  "cedente",
  "sacado",
  "nf",
  "valor",
  "vencimento",
  "status",
] as const;

// Cada linha de dados vem acompanhada do número original no arquivo
// Isso é essencial para reportar erros de forma clara pro usuário
export type LinhaCsvComNumero = {
  numero: number; // número da linha no arquivo (cabeçalho = linha 1)
  dados: LinhaCsvBruta;
};

export type ResultadoParseCsv = {
  cabecalhoValido: boolean;
  colunasEsperadas: readonly string[];
  colunasEncontradas: string[];
  linhas: LinhaCsvComNumero[];
};

export function parseCsv(conteudo: string): ResultadoParseCsv {
  // 1. Normaliza quebras de linha (Windows usa \r\n, Mac/Linux usa \n)
  const todasAsLinhas = conteudo.split(/\r\n|\n|\r/);

  // 2. A primeira linha é o cabeçalho
  const linhaCabecalho = todasAsLinhas[0] ?? "";
  const colunasEncontradas = linhaCabecalho
    .split(",")
    .map((coluna) => coluna.trim().toLowerCase());

  // 3. Valida se o cabeçalho bate exatamente com o esperado, na ordem
  const cabecalhoValido = COLUNAS_ESPERADAS.every(
    (colunaEsperada, indice) => colunasEncontradas[indice] === colunaEsperada
  );

  const linhas: LinhaCsvComNumero[] = [];

  // 4. Percorre as linhas de dados (a partir do índice 1, pulando o cabeçalho)
  for (let indice = 1; indice < todasAsLinhas.length; indice++) {
    const linhaTexto = todasAsLinhas[indice];

    // Ignora linhas totalmente vazias (comum ter uma linha em branco no final do arquivo)
    if (linhaTexto.trim() === "") {
      continue;
    }

    const colunas = linhaTexto.split(",");

    linhas.push({
      // indice começa em 1 (linha 0 é cabeçalho), então a linha real no
      // arquivo é indice + 1 (contando a partir de 1, como um humano contaria)
      numero: indice,
      dados: {
        cedente: (colunas[0] ?? "").trim(),
        sacado: (colunas[1] ?? "").trim(),
        nf: (colunas[2] ?? "").trim(),
        valor: (colunas[3] ?? "").trim(),
        vencimento: (colunas[4] ?? "").trim(),
        status: (colunas[5] ?? "").trim(),
      },
    });
  }

  return {
    cabecalhoValido,
    colunasEsperadas: COLUNAS_ESPERADAS,
    colunasEncontradas,
    linhas,
  };
}