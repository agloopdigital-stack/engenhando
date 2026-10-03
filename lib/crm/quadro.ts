import type { SupabaseClient } from "@supabase/supabase-js";
import type { EstagioLead } from "@/lib/types";
import { ESTAGIOS } from "@/lib/crm/funil";

export const CABECALHOS_QUADRO = ["contagem", "soma", "ambos"] as const;

export type CabecalhoQuadro = (typeof CABECALHOS_QUADRO)[number];

export type ColunaQuadro = {
  estagio: EstagioLead;
  rotulo: string;
  visivel: boolean;
};

export type QuadroLead = {
  cabecalho: CabecalhoQuadro;
  colunas: ColunaQuadro[];
};

const SEMPRE_VISIVEIS = new Set<EstagioLead>(["fechado", "perdido"]);

export function colunaObrigatoria(estagio: EstagioLead) {
  return SEMPRE_VISIVEIS.has(estagio);
}

export function rotuloPadrao(estagio: EstagioLead) {
  return ESTAGIOS.find((item) => item.chave === estagio)?.rotulo ?? estagio;
}

export const QUADRO_PADRAO: QuadroLead = {
  cabecalho: "ambos",
  colunas: ESTAGIOS.map(({ chave, rotulo }) => ({
    estagio: chave,
    rotulo,
    visivel: true,
  })),
};

function cabecalhoValido(valor: unknown): valor is CabecalhoQuadro {
  return typeof valor === "string" && (CABECALHOS_QUADRO as readonly string[]).includes(valor);
}

function estagioValido(valor: unknown): valor is EstagioLead {
  return ESTAGIOS.some((item) => item.chave === valor);
}

export function normalizarQuadro(bruto: unknown): QuadroLead {
  const fonte = bruto && typeof bruto === "object" ? (bruto as { cabecalho?: unknown; colunas?: unknown }) : {};
  const recebidas = Array.isArray(fonte.colunas) ? fonte.colunas : [];
  const usadas = new Set<EstagioLead>();
  const colunas: ColunaQuadro[] = [];

  for (const item of recebidas) {
    if (!item || typeof item !== "object") continue;
    const candidato = item as { estagio?: unknown; rotulo?: unknown; visivel?: unknown };
    if (!estagioValido(candidato.estagio) || usadas.has(candidato.estagio)) continue;
    usadas.add(candidato.estagio);
    const texto = typeof candidato.rotulo === "string" ? candidato.rotulo.trim().slice(0, 40) : "";
    colunas.push({
      estagio: candidato.estagio,
      rotulo: texto || rotuloPadrao(candidato.estagio),
      visivel: colunaObrigatoria(candidato.estagio) ? true : candidato.visivel !== false,
    });
  }

  for (const { chave, rotulo } of ESTAGIOS) {
    if (!usadas.has(chave)) colunas.push({ estagio: chave, rotulo, visivel: true });
  }

  return {
    cabecalho: cabecalhoValido(fonte.cabecalho) ? fonte.cabecalho : "ambos",
    colunas,
  };
}

export function rotuloColuna(quadro: QuadroLead | ColunaQuadro[], estagio: EstagioLead) {
  const colunas = Array.isArray(quadro) ? quadro : quadro.colunas;
  return colunas.find((coluna) => coluna.estagio === estagio)?.rotulo ?? rotuloPadrao(estagio);
}

export async function buscarQuadro(supabase: SupabaseClient, contaId: string) {
  const { data, error } = await supabase
    .from("quadros_lead")
    .select("cabecalho, colunas")
    .eq("conta_id", contaId)
    .maybeSingle();

  if (error || !data) return QUADRO_PADRAO;
  return normalizarQuadro(data);
}

export async function salvarQuadro(supabase: SupabaseClient, contaId: string, quadro: QuadroLead) {
  const limpo = normalizarQuadro(quadro);
  const { error } = await supabase.from("quadros_lead").upsert({
    conta_id: contaId,
    cabecalho: limpo.cabecalho,
    colunas: limpo.colunas,
    atualizado_em: new Date().toISOString(),
  });

  return error ? null : limpo;
}
