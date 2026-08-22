"use client";

import { useState } from "react";

type ImportarCsvProps = {
  aoImportarComSucesso: () => void;
};

export default function ImportarCsv({ aoImportarComSucesso }: ImportarCsvProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  function handleSelecionarArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivoSelecionado = evento.target.files?.[0] ?? null;
    setArquivo(arquivoSelecionado);
    setMensagem(null);
  }

  async function handleImportar() {
    if (!arquivo) return;

    setEnviando(true);
    setMensagem(null);

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    const resposta = await fetch("/api/estoque/import", {
      method: "POST",
      body: formData,
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setMensagem(`Erro: ${dados.mensagem ?? "arquivo rejeitado."}`);
    } else {
      setMensagem(`Importação concluída: ${dados.importados} linha(s) importada(s).`);
      aoImportarComSucesso();
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

      {mensagem && <p className="text-sm text-gray-700">{mensagem}</p>}
    </div>
  );
}