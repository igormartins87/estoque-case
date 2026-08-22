import type { AlertaConcentracao } from "@/lib/estoque-types";

type AlertasConcentracaoProps = {
  alertas: AlertaConcentracao[];
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AlertasConcentracao({ alertas }: AlertasConcentracaoProps) {
  if (alertas.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-yellow-50 border-l-4 border-yellow-500 p-4">
      <div className="flex gap-3">
        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
          !
        </span>

        <div className="space-y-2 flex-1">
          <p className="font-semibold text-yellow-800">
            Concentração acima do limite de 25% do estoque ativo
          </p>

          <ul className="space-y-1 text-sm text-yellow-900">
            {alertas.map((alerta) => (
              <li key={alerta.sacado}>
                <span className="font-semibold">{alerta.sacado}</span>
                {" — "}
                <span className="font-semibold">{alerta.percentual.toFixed(2)}%</span>
                {" do estoque ativo ("}
                {formatarMoeda(alerta.valorTotal)}
                {")"}
              </li>
            ))}
          </ul>

          <p className="text-xs text-yellow-700">
            Sacados acima de 25% aparecem destacados em amarelo na tabela.
          </p>
        </div>
      </div>
    </div>
  );
}