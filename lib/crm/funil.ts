import type { SupabaseClient } from "@supabase/supabase-js";
import type { EstagioLead } from "@/lib/types";
import { apenasDigitos } from "@/lib/empresa";

export const DIAS_FOLLOWUP = 3;

export const ESTAGIOS: { chave: EstagioLead; rotulo: string }[] = [
  { chave: "novo", rotulo: "Novo" },
  { chave: "proposta_enviada", rotulo: "Proposta enviada" },
  { chave: "follow_up", rotulo: "Follow-up" },
  { chave: "fechado", rotulo: "Fechado" },
  { chave: "perdido", rotulo: "Perdido" },
];

export const CAMPOS_PROPOSTA_RESERVADOS = new Set([
  "cliente_nome",
  "escopo",
  "valor",
  "prazo",
  "empresa_nome",
  "cnpj",
  "crea",
  "cidade",
  "pix",
]);

export type PropostaResumo = {
  id: string;
  status: "rascunho" | "enviada" | "aceita" | "recusada";
  enviada_em: string | null;
  valor: number | null;
  prazo_dias: number | null;
  pdf_url: string | null;
  escopo: string | null;
  criado_em: string;
};

export type LeadLista = {
  id: string;
  contaId: string;
  nome: string;
  whatsapp: string;
  email: string;
  endereco: string;
  obraRelacionada: string | null;
  estagio: EstagioLead;
  tipoServico: string;
  criadoEm: string;
  proposta: PropostaResumo | null;
};

type TipoJoin = { nome: string } | { nome: string }[] | null;

type PropostaBruta = {
  id: string;
  status: PropostaResumo["status"];
  enviada_em: string | null;
  valor: number | string | null;
  prazo_dias: number | null;
  pdf_url: string | null;
  escopo: string | null;
  criado_em: string;
};

export function separarContato(contato: string | null | undefined) {
  const texto = (contato ?? "").trim();
  if (!texto) return { whatsapp: "", email: "" };
  if (texto.includes("@")) return { whatsapp: "", email: texto };
  return { whatsapp: texto, email: "" };
}

export function numeroOuNulo(valor: number | string | null | undefined) {
  if (valor == null || valor === "") return null;
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

export function parseValor(texto: string) {
  const limpo = texto.trim();
  if (!limpo) return null;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

export function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export function diasDesde(iso: string | null | undefined) {
  if (!iso) return null;
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  return Number.isFinite(dias) ? Math.max(0, dias) : null;
}

export function linkTelefone(numero: string) {
  const digitos = apenasDigitos(numero);
  return digitos ? `tel:+55${digitos}` : "";
}

export function linkWhatsapp(numero: string, texto: string) {
  const digitos = apenasDigitos(numero);
  if (!digitos) return "";
  return `https://wa.me/55${digitos}?text=${encodeURIComponent(texto)}`;
}

function nomeTipo(valor: TipoJoin) {
  if (!valor) return "";
  return Array.isArray(valor) ? (valor[0]?.nome ?? "") : valor.nome;
}

function propostaEmDestaque(propostas: PropostaBruta[]): PropostaResumo | null {
  if (propostas.length === 0) return null;
  const normalizadas = propostas.map((p) => ({
    id: p.id,
    status: p.status,
    enviada_em: p.enviada_em,
    valor: numeroOuNulo(p.valor),
    prazo_dias: p.prazo_dias,
    pdf_url: p.pdf_url,
    escopo: p.escopo,
    criado_em: p.criado_em,
  }));
  const enviadas = normalizadas.filter((p) => p.status === "enviada" || p.status === "aceita");
  const base = enviadas.length > 0 ? enviadas : normalizadas;
  return [...base].sort((a, b) => (b.enviada_em ?? b.criado_em).localeCompare(a.enviada_em ?? a.criado_em))[0];
}

export function paraLeadLista(row: {
  id: string;
  conta_id: string;
  nome: string;
  contato: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  obra_relacionada: string | null;
  estagio: EstagioLead;
  criado_em: string;
  tipos_servico: TipoJoin;
  propostas: PropostaBruta[] | null;
}): LeadLista {
  const legado = separarContato(row.contato);
  return {
    id: row.id,
    contaId: row.conta_id,
    nome: row.nome,
    whatsapp: (row.whatsapp ?? "").trim() || legado.whatsapp,
    email: (row.email ?? "").trim() || legado.email,
    endereco: (row.endereco ?? "").trim(),
    obraRelacionada: row.obra_relacionada,
    estagio: row.estagio,
    tipoServico: nomeTipo(row.tipos_servico),
    criadoEm: row.criado_em,
    proposta: propostaEmDestaque(row.propostas ?? []),
  };
}

export function pedeRetorno(lead: LeadLista) {
  return lead.estagio === "follow_up" || lead.estagio === "proposta_enviada";
}

export function ordenarLeads(leads: LeadLista[]) {
  return [...leads].sort((a, b) => {
    const espera = (lead: LeadLista) => {
      if (!pedeRetorno(lead)) return Number.POSITIVE_INFINITY;
      return new Date(lead.proposta?.enviada_em ?? lead.criadoEm).getTime();
    };
    const diferenca = espera(a) - espera(b);
    if (diferenca !== 0) return diferenca;
    return b.criadoEm.localeCompare(a.criadoEm);
  });
}

export function rotuloEstagio(estagio: EstagioLead) {
  return ESTAGIOS.find((item) => item.chave === estagio)?.rotulo ?? estagio;
}

export function somaValor(leads: LeadLista[]) {
  return leads.reduce((total, lead) => total + (lead.proposta?.valor ?? 0), 0);
}

export function temPropostaEnviada(lead: LeadLista) {
  return lead.proposta?.status === "enviada" || lead.proposta?.status === "aceita";
}

export async function atualizarEstagio(supabase: SupabaseClient, leadId: string, estagio: EstagioLead) {
  const { error } = await supabase.from("leads").update({ estagio }).eq("id", leadId);
  return !error;
}

export async function abrirObraDoLead(
  supabase: SupabaseClient,
  lead: { id: string; contaId: string; nome: string; endereco: string; contato: string }
): Promise<{ obraId: string } | { erro: string }> {
  const { data: obra, error } = await supabase
    .from("obras")
    .insert({
      conta_id: lead.contaId,
      nome: lead.nome,
      endereco: lead.endereco || null,
      cliente_nome: lead.nome,
      cliente_contato: lead.contato || null,
    })
    .select("id")
    .single();

  if (error || !obra) return { erro: "Não consegui abrir a obra." };

  const { error: erroLead } = await supabase.from("leads").update({ obra_relacionada: obra.id }).eq("id", lead.id);
  if (erroLead) return { erro: "A obra foi criada, mas não consegui ligar ao lead." };

  return { obraId: obra.id as string };
}
