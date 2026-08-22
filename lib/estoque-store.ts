import type { EstoqueSnapshot } from "./estoque-types";

// Guarda o último snapshot em memória. Reseta se o servidor reiniciar —
// isso é aceitável para o escopo do case (persistência real está fora de escopo).
let snapshotAtual: EstoqueSnapshot | null = null;

export function obterSnapshot(): EstoqueSnapshot | null {
  return snapshotAtual;
}

export function salvarSnapshot(snapshot: EstoqueSnapshot): void {
  snapshotAtual = snapshot;
}