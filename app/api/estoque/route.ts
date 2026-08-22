import { NextResponse } from "next/server";
import { obterSnapshot } from "@/lib/estoque-store";

export async function GET() {
  const snapshot = obterSnapshot();

  if (!snapshot) {
    return NextResponse.json({
      dataImportacao: null,
      estoque: [],
      indicadores: null,
      alertasConcentracao: [],
      ultimoResultadoImportacao: null,
    });
  }

  return NextResponse.json(snapshot);
}