import type { TipoDocumentoObra } from "@/lib/types";

export const ROTULOS_TIPO_DOCUMENTO: Record<TipoDocumentoObra, string> = {
  alvara_construcao: "Alvará de construção",
  licenca_ambiental: "Licença ambiental",
  art: "ART",
  laudo_bombeiro: "Laudo de bombeiro",
  outro: "Outro",
};

export type StatusVencimento = "ok" | "vencendo" | "vencido";

export function calcularStatusVencimento(dataVencimento: string): StatusVencimento {
  const dias = diasAteVencimento(dataVencimento);
  if (dias < 0) return "vencido";
  if (dias <= 30) return "vencendo";
  return "ok";
}

export function diasAteVencimento(dataVencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento + "T00:00:00");
  return Math.round((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export const CORES_STATUS: Record<StatusVencimento, string> = {
  ok: "#2F7A4C",
  vencendo: "#FF6B35",
  vencido: "#C23B22",
};

export const ROTULOS_STATUS: Record<StatusVencimento, string> = {
  ok: "Em dia",
  vencendo: "Vencendo",
  vencido: "Vencido",
};
