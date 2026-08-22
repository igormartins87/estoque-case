import { describe, it, expect } from "vitest";
import {
  calcularVencidoOperacional,
  calcularDiasAtraso,
  calcularPdd,
  processarImportacao,
  gerarChaveDuplicata,
  DATA_REFERENCIA,
} from "./estoque-regras";

// ==========================================================
// REGRA 4 — Vencido operacional
// ==========================================================
describe("Regra 4 — Vencido operacional", () => {
  it("considera vencido quando status é VENCIDO, mesmo com data futura", () => {
    const resultado = calcularVencidoOperacional("VENCIDO", "2026-12-31");
    expect(resultado).toBe(true);
  });

  it("considera vencido quando status é ABERTO mas a data já passou", () => {
    const resultado = calcularVencidoOperacional("ABERTO", "2026-08-10");
    expect(resultado).toBe(true);
  });

  it("NÃO considera vencido quando status é ABERTO e a data ainda não chegou", () => {
    const resultado = calcularVencidoOperacional("ABERTO", "2026-09-01");
    expect(resultado).toBe(false);
  });

  it("NÃO considera vencido quando a data é exatamente igual à data de referência", () => {
    // Regra: vencimento < referência (estritamente menor). Igual não é vencido.
    const resultado = calcularVencidoOperacional("ABERTO", DATA_REFERENCIA);
    expect(resultado).toBe(false);
  });
});

// ==========================================================
// REGRA 5 — PDD (dias de atraso e cálculo de provisão)
// ==========================================================
describe("Regra 5 — Cálculo de dias de atraso", () => {
  it("calcula corretamente 11 dias de atraso", () => {
    const dias = calcularDiasAtraso("2026-08-10");
    expect(dias).toBe(11);
  });

  it("retorna 0 (ou negativo) quando a data ainda não venceu", () => {
    const dias = calcularDiasAtraso("2026-09-01");
    expect(dias).toBeLessThanOrEqual(0);
  });

  it("retorna 0 quando a data é igual à referência", () => {
    const dias = calcularDiasAtraso(DATA_REFERENCIA);
    expect(dias).toBe(0);
  });
});

describe("Regra 5 — PDD por faixa de atraso", () => {
  it("PDD é 0% quando não está vencido (0 dias)", () => {
    const pdd = calcularPdd(10000, 0);
    expect(pdd).toBe(0);
  });

  it("PDD é 0% quando o atraso é negativo (ainda não venceu)", () => {
    const pdd = calcularPdd(10000, -5);
    expect(pdd).toBe(0);
  });

  it("PDD é 50% no limite inferior da faixa (1 dia de atraso)", () => {
    const pdd = calcularPdd(10000, 1);
    expect(pdd).toBe(5000);
  });

  it("PDD é 50% no limite superior da faixa (30 dias de atraso)", () => {
    const pdd = calcularPdd(10000, 30);
    expect(pdd).toBe(5000);
  });

  it("PDD é 100% logo após passar de 30 dias (31 dias de atraso)", () => {
    const pdd = calcularPdd(10000, 31);
    expect(pdd).toBe(10000);
  });

  it("PDD é 100% para atrasos muito grandes (81 dias)", () => {
    const pdd = calcularPdd(10000, 81);
    expect(pdd).toBe(10000);
  });
});

// ==========================================================
// REGRA 2 — Duplicata (chave normalizada)
// ==========================================================
describe("Regra 2 — Geração de chave de duplicata", () => {
  it("gera a mesma chave para nomes com diferença de maiúsculas/minúsculas", () => {
    const chave1 = gerarChaveDuplicata("Alfa Comercio Ltda", "1001");
    const chave2 = gerarChaveDuplicata("alfa comercio ltda", "1001");
    expect(chave1).toBe(chave2);
  });

  it("gera a mesma chave ignorando espaços nas extremidades", () => {
    const chave1 = gerarChaveDuplicata("Alfa Comercio Ltda", "1001");
    const chave2 = gerarChaveDuplicata("  Alfa Comercio Ltda  ", "  1001  ");
    expect(chave1).toBe(chave2);
  });

  it("gera chaves diferentes para NFs diferentes", () => {
    const chave1 = gerarChaveDuplicata("Alfa Comercio Ltda", "1001");
    const chave2 = gerarChaveDuplicata("Alfa Comercio Ltda", "1002");
    expect(chave1).not.toBe(chave2);
  });
});

// ==========================================================
// REGRA 7 — Trava de taxa de erro (20%)
// ==========================================================
describe("Regra 7 — Trava de 20% de taxa de erro", () => {
  it("aceita o arquivo quando a taxa de erro é exatamente 20%", () => {
    const csv = `cedente,sacado,nf,valor,vencimento,status
Cedente A,Sacado A,1001,1000,2026-09-01,ABERTO
Cedente B,Sacado B,1002,1000,2026-09-01,ABERTO
Cedente C,Sacado C,1003,1000,2026-09-01,ABERTO
Cedente D,Sacado D,1004,1000,2026-09-01,ABERTO
Cedente E,Sacado E,,1000,2026-09-01,ABERTO`;
    // 5 linhas, 1 erro (NF vazia) = 20% de taxa de erro -> deve ACEITAR

    const resultado = processarImportacao(csv);
    expect(resultado.resultado.aceito).toBe(true);
    expect(resultado.resultado.taxaErro).toBe(0.2);
  });

  it("rejeita o arquivo quando a taxa de erro é maior que 20%", () => {
    const csv = `cedente,sacado,nf,valor,vencimento,status
Cedente A,Sacado A,1001,1000,2026-09-01,ABERTO
Cedente B,Sacado B,,1000,2026-09-01,ABERTO
Cedente C,Sacado C,,1000,2026-09-01,ABERTO
Cedente D,Sacado D,1004,1000,2026-09-01,ABERTO
Cedente E,Sacado E,1005,1000,2026-09-01,ABERTO`;
    // 5 linhas, 2 erros = 40% de taxa de erro -> deve REJEITAR

    const resultado = processarImportacao(csv);
    expect(resultado.resultado.aceito).toBe(false);
    expect(resultado.linhasValidas).toHaveLength(0);
    expect(resultado.indicadores).toBeNull();
  });

  it("rejeita o arquivo inteiro quando o cabeçalho está incorreto", () => {
    const csv = `nome,valor
Cedente A,1000`;

    const resultado = processarImportacao(csv);
    expect(resultado.resultado.aceito).toBe(false);
  });

  it("ainda retorna a lista de erros mesmo quando o arquivo é rejeitado", () => {
    const csv = `cedente,sacado,nf,valor,vencimento,status
Cedente A,Sacado A,,1000,2026-09-01,ABERTO
Cedente B,Sacado B,,1000,2026-09-01,ABERTO`;

    const resultado = processarImportacao(csv);
    expect(resultado.resultado.aceito).toBe(false);
    expect(resultado.resultado.erros.length).toBeGreaterThan(0);
  });
});