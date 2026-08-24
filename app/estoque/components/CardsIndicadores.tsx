import type { EstoqueSnapshot } from "@/lib/estoque-types";
import { formatarMoeda,formatarPercentual } from "@/lib/formatters";

type CardsIndicadoresProps = {
  indicadores: EstoqueSnapshot["indicadores"];
};


export default function CardsIndicadores({ indicadores }: CardsIndicadoresProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <p className="text-sm text-gray-500">Qtd. Estoque Ativo</p>
        <p className="text-2xl font-bold text-gray-900">
          {indicadores.quantidadeEstoqueAtivo}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <p className="text-sm text-gray-500">Soma Estoque Ativo</p>
        <p className="text-2xl font-bold text-gray-900">
          {formatarMoeda(indicadores.somaEstoqueAtivo)}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <p className="text-sm text-gray-500">% Vencido</p>
        <p className="text-2xl font-bold text-red-600">
          {formatarPercentual(indicadores.percentualVencido)}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <p className="text-sm text-gray-500">PDD Total</p>
        <p className="text-2xl font-bold text-orange-600">
          {formatarMoeda(indicadores.pddTotal)}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <p className="text-sm text-gray-500">Maior Sacado</p>
        {indicadores.maiorSacado ? (
          <>
            <p className="text-lg font-bold text-gray-900 truncate">
              {indicadores.maiorSacado.sacado}
            </p>
            <p className="text-sm text-gray-500">
              {formatarPercentual(indicadores.maiorSacado.percentual)}
            </p>
          </>
        ) : (
          <p className="text-lg text-gray-400">—</p>
        )}
      </div>
    </div>
  );
}