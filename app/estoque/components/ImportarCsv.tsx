"use client";

import { useState } from "react";
import type { ErroLinha } from "@/lib/estoque-types";

export type ResultadoImportacaoUI = {
  aceito: boolean;
  erros: ErroLinha[];
  mensagem: string;
};

type ImportarCsvProps = {
  aoImportar: (resultado: ResultadoImportacaoUI) => void;
};

export default function ImportarCsv({ aoImportar }: ImportarCsvProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  function handleSelecionarArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    setArquivo(evento.target.files?.[0] ?? null);
  }

  async function handleImportar() {
    if (!arquivo) return;

    setEnviando(true);

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    try {
      const resposta = await fetch("/api/estoque/import", {
        method: "POST",
        body: formData,
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        aoImportar({
          aceito: true,
          erros: dados.erros ?? [],
          mensagem: `Importação concluída: ${dados.importados} linha(s) importada(s), ${dados.rejeitados} rejeitada(s).`,
        });
      } else {
        aoImportar({
          aceito: false,
          erros: dados.erros ?? [],
          mensagem: dados.mensagem ?? dados.erro ?? "Arquivo rejeitado.",
        });
      }
    } catch (e) {
      console.error("Falha na importação:", e);
      aoImportar({
        aceito: false,
        erros: [],
        mensagem: "Não foi possível comunicar com o servidor.",
      });
    }

    setEnviando(false);
  }

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3 bg-white shadow-sm">
      <h2 className="font-semibold text-lg">Importação de Estoque</h2>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".csv"
          onChange={handleSelecionarArquivo}
          className="text-sm"
        />

        <button
          onClick={handleImportar}
          disabled={!arquivo || enviando}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {enviando ? "Importando..." : "Importar"}
        </button>
      </div>
    </div>
  );
}