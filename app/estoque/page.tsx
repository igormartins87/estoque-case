"use client";

import { useEffect, useState } from "react";
import type { EstoqueSnapshot } from "@/lib/estoque-types";
import ImportarCsv, { type ResultadoImportacaoUI } from "./components/ImportarCsv";
import CardsIndicadores from "./components/CardsIndicadores";
import TabelaEstoque from "./components/TabelaEstoque";
import FiltroStatus, { type FiltroValor } from "./components/FiltroStatus";
import PainelErros from "./components/PainelErros";
import AlertasConcentracao from "./components/AlertasConcentracao";

export default function EstoquePage() {
  const [snapshot, setSnapshot] = useState<EstoqueSnapshot | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<FiltroValor>("TODOS");
  const [ultimaImportacao, setUltimaImportacao] = useState<ResultadoImportacaoUI | null>(null);

  async function carregarSnapshot() {
    setCarregando(true);
    try {
      const resposta = await fetch("/api/estoque");
      const dados: EstoqueSnapshot = await resposta.json();
      setSnapshot(dados);
    } catch (e) {
      console.error("Erro ao carregar snapshot:", e);
      setSnapshot(null);
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregarSnapshot();
  }, []);

  async function handleImportar(resultado: ResultadoImportacaoUI) {
    setUltimaImportacao(resultado);

    // Regra 7: se o arquivo foi rejeitado, NÃO recarrega a tabela.
    // O estoque da última importação válida permanece na tela.
    if (resultado.aceito) {
      await carregarSnapshot();
    }
  }

  const estoqueFiltrado = (snapshot?.estoque ?? []).filter((item) => {
    if (filtro === "TODOS") return true;
    if (filtro === "LIQUIDADO") return item.status === "LIQUIDADO";
    if (filtro === "VENCIDO") return item.ativo && item.vencidoOperacional;
    if (filtro === "ABERTO") return item.ativo && !item.vencidoOperacional;
    return true;
  });

  // Antes do primeiro import da sessão, mostra os erros que vieram no snapshot
  // (assim o painel sobrevive a um F5 na página).
  const errosExibidos =
    ultimaImportacao?.erros ?? snapshot?.ultimoResultadoImportacao?.erros ?? [];

  const arquivoRejeitado = ultimaImportacao ? !ultimaImportacao.aceito : false;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Case Estoque</h1>
        <p className="text-gray-500">Sistema de importação de estoque via CSV</p>
      </div>

      <ImportarCsv aoImportar={handleImportar} />

      {ultimaImportacao?.aceito && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3">
          <p className="text-sm text-green-800">{ultimaImportacao.mensagem}</p>
        </div>
      )}

      <PainelErros
        erros={errosExibidos}
        rejeitado={arquivoRejeitado}
        mensagemRejeicao={ultimaImportacao?.mensagem}
      />

      {carregando && <p className="text-gray-500">Carregando...</p>}

      {!carregando && snapshot && snapshot.estoque.length === 0 && (
        <p className="text-gray-500">Nenhum estoque importado ainda.</p>
      )}

      {!carregando && snapshot && snapshot.estoque.length > 0 && (
        <>
          <CardsIndicadores indicadores={snapshot.indicadores} />

          <AlertasConcentracao alertas={snapshot.alertasConcentracao ?? []} />

          <div className="flex items-center justify-between">
            <FiltroStatus filtroAtivo={filtro} aoMudarFiltro={setFiltro} />
            <p className="text-sm text-gray-500">
              {estoqueFiltrado.length} de {snapshot.estoque.length} título(s)
            </p>
          </div>

          <TabelaEstoque
            estoque={estoqueFiltrado}
            alertasConcentracao={snapshot.alertasConcentracao}
          />
        </>
      )}
    </main>
  );
}