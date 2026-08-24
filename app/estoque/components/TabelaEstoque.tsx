import type { EstoqueSnapshot } from "@/lib/estoque-types";

import { formatarMoeda, formatarData} from "@/lib/formatters";

type TabelaEstoqueProps = {
  estoque: EstoqueSnapshot["estoque"];
  alertasConcentracao: EstoqueSnapshot["alertasConcentracao"];
};


export default function TabelaEstoque({ estoque, alertasConcentracao }: TabelaEstoqueProps) {
  const sacadosConcentrados = new Set(
    (alertasConcentracao ?? []).map((a) => a.sacado.trim().toUpperCase())
  );

  function corDaLinha(item: EstoqueSnapshot["estoque"][number]) {
    if (item.status === "LIQUIDADO") {
      return "bg-gray-100 text-gray-500";
    }
    if (item.vencidoOperacional) {
      return "bg-red-50 text-red-800";
    }
    if (sacadosConcentrados.has(item.sacado.trim().toUpperCase())) {
      return "bg-yellow-50 text-yellow-800";
    }
    return "bg-white text-gray-900";
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-gray-500">
            <th className="p-3">Cedente</th>
            <th className="p-3">Sacado</th>
            <th className="p-3">NF</th>
            <th className="p-3 text-right">Valor</th>
            <th className="p-3">Vencimento</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {estoque.map((item, index) => (
            <tr key={`${item.cedente}-${item.nf}-${index}`} className={`border-b ${corDaLinha(item)}`}>
              <td className="p-3">{item.cedente}</td>
              <td className="p-3">{item.sacado}</td>
              <td className="p-3">{item.nf}</td>
              <td className="p-3 text-right">{formatarMoeda(item.valor)}</td>
              <td className="p-3">{formatarData(item.vencimento)}</td>
              <td className="p-3 font-medium">{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {estoque.length === 0 && (
        <p className="p-4 text-center text-gray-400">Nenhum registro para exibir.</p>
      )}
    </div>
  );
}