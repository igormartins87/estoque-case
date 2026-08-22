"use client";

import { useEffect, useState } from "react";
import type { EstoqueSnapshot } from "@/lib/estoque-types";
import ImportarCsv from "./components/ImportarCsv";

export default function EstoquePage() {
  const [snapshot, setSnapshot] = useState<EstoqueSnapshot | null>(null);
  const [carregando, setCarregando] = useState(true);

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

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Case Estoque</h1>
        <p className="text-gray-500">Sistema de importação de estoque via CSV</p>
      </div>

      <ImportarCsv aoImportarComSucesso={carregarSnapshot} />

      {carregando && <p className="text-gray-500">Carregando...</p>}

      {!carregando && snapshot && snapshot.estoque.length === 0 && (
        <p className="text-gray-500">Nenhum estoque importado ainda.</p>
      )}

      {!carregando && snapshot && snapshot.estoque.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs font-mono">
          <pre>{JSON.stringify(snapshot, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}