import type { ErroLinha } from "@/lib/estoque-types";

type PainelErrosProps = {
  erros: ErroLinha[];
  rejeitado: boolean;
  mensagemRejeicao?: string;
};

export default function PainelErros({ erros, rejeitado, mensagemRejeicao }: PainelErrosProps) {
  if (erros.length === 0 && !rejeitado) {
    return null;
  }

  const cores = rejeitado
    ? {
        fundo: "bg-red-50",
        borda: "border-l-4 border-red-500",
        titulo: "text-red-800",
        texto: "text-red-700",
        icone: "bg-red-500",
      }
    : {
        fundo: "bg-amber-50",
        borda: "border-l-4 border-amber-500",
        titulo: "text-amber-800",
        texto: "text-amber-700",
        icone: "bg-amber-500",
      };

  return (
    <div className={`rounded-lg p-4 ${cores.fundo} ${cores.borda}`}>
      <div className="flex gap-3">
        <span
          className={`${cores.icone} text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}
        >
          !
        </span>

        <div className="space-y-2 flex-1">
          {rejeitado ? (
            <>
              <p className={`font-semibold ${cores.titulo}`}>
                Arquivo rejeitado — nenhuma linha foi importada
              </p>
              {mensagemRejeicao && (
                <p className={`text-sm ${cores.texto}`}>{mensagemRejeicao}</p>
              )}
              <p className={`text-sm ${cores.texto}`}>
                O estoque exibido abaixo continua sendo o da última importação válida.
              </p>
            </>
          ) : (
            <p className={`font-semibold ${cores.titulo}`}>
              {erros.length} linha(s) não importada(s) — o restante do arquivo foi aceito
            </p>
          )}

          {erros.length > 0 && (
            <ul className={`list-disc list-inside space-y-1 text-sm ${cores.texto}`}>
              {erros.map((erro, index) => (
                <li key={`${erro.linha}-${index}`}>
                  <span className="font-semibold">Linha {erro.linha}:</span> {erro.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}