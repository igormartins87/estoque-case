export type FiltroValor = "TODOS" | "ABERTO" | "VENCIDO" | "LIQUIDADO";

type FiltroStatusProps = {
  filtroAtivo: FiltroValor;
  aoMudarFiltro: (filtro: FiltroValor) => void;
};

const OPCOES: { valor: FiltroValor; rotulo: string }[] = [
  { valor: "TODOS", rotulo: "Todos" },
  { valor: "ABERTO", rotulo: "Aberto" },
  { valor: "VENCIDO", rotulo: "Vencido" },
  { valor: "LIQUIDADO", rotulo: "Liquidado" },
];

export default function FiltroStatus({ filtroAtivo, aoMudarFiltro }: FiltroStatusProps) {
  return (
    <div className="flex gap-2">
      {OPCOES.map((opcao) => (
        <button
          key={opcao.valor}
          onClick={() => aoMudarFiltro(opcao.valor)}
          className={
            filtroAtivo === opcao.valor
              ? "px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white"
              : "px-4 py-2 rounded text-sm font-medium bg-white text-gray-700 border hover:bg-gray-100"
          }
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}