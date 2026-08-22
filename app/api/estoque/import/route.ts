import { NextRequest, NextResponse } from "next/server";
import { processarImportacao, LIMITE_TAXA_ERRO } from "@/lib/estoque-regras";
import { salvarSnapshot } from "@/lib/estoque-store";
import type { EstoqueSnapshot } from "@/lib/estoque-types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const arquivo = formData.get("arquivo");

  // Contrato: o front-end deve enviar o arquivo no campo "arquivo"
  if (!(arquivo instanceof File)) {
    return NextResponse.json(
      { erro: "Nenhum arquivo enviado. Envie um campo 'arquivo' do tipo File." },
      { status: 400 }
    );
  }

  const conteudo = await arquivo.text();
  const processamento = processarImportacao(conteudo);

  // Regra 7: taxa de erro > 20% -> rejeita tudo, não grava nada
  if (!processamento.resultado.aceito) {
    return NextResponse.json(
      {
        importados: 0,
        rejeitados: processamento.resultado.linhasInvalidas,
        totais: null,
        erros: processamento.resultado.erros,
        mensagem: `Arquivo rejeitado: taxa de erro de ${(
          processamento.resultado.taxaErro * 100
        ).toFixed(1)}% excede o limite de ${LIMITE_TAXA_ERRO * 100}%.`,
      },
      { status: 400 }
    );
  }

  const snapshot: EstoqueSnapshot = {
    dataImportacao: new Date().toISOString(),
    estoque: processamento.linhasValidas,
    indicadores: processamento.indicadores!,
    alertasConcentracao: processamento.alertasConcentracao,
    ultimoResultadoImportacao: processamento.resultado,
  };

  salvarSnapshot(snapshot);

  return NextResponse.json({
    importados: processamento.resultado.linhasValidas,
    rejeitados: processamento.resultado.linhasInvalidas,
    erros: processamento.resultado.erros,
    totais: processamento.indicadores,
  });
}