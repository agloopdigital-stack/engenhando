import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getContaDoUsuarioLogado } from "@/lib/conta-atual";
import { paraLeadLista } from "@/lib/crm/funil";
import { PainelLeads } from "@/components/leads/PainelLeads";
import type { EstagioLead } from "@/lib/types";

type LinhaLead = {
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
  tipos_servico: { nome: string } | null;
  propostas: {
    id: string;
    status: "rascunho" | "enviada" | "aceita" | "recusada";
    enviada_em: string | null;
    valor: number | string | null;
    prazo_dias: number | null;
    pdf_url: string | null;
    escopo: string | null;
    criado_em: string;
  }[] | null;
};

export default async function LeadsPage() {
  const contaId = await getContaDoUsuarioLogado();
  const supabase = await createClient();

  const { data } = contaId
    ? await supabase
        .from("leads")
        .select(
          "id, conta_id, nome, contato, whatsapp, email, endereco, obra_relacionada, estagio, criado_em, tipos_servico(nome), propostas(id, status, enviada_em, valor, prazo_dias, pdf_url, escopo, criado_em)"
        )
        .eq("conta_id", contaId)
    : { data: [] as LinhaLead[] };

  const leads = ((data ?? []) as unknown as LinhaLead[]).map(paraLeadLista);

  return (
    <main className="flex min-h-full flex-col bg-concreto-100 px-4 pt-6 md:min-h-dvh">
      <PainelLeads leadsIniciais={leads} />

      <div className="sticky bottom-0 z-10 -mx-4 mt-auto border-t border-concreto-300 bg-concreto-100 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/leads/novo"
            className="touch-target flex w-full items-center justify-center rounded-xl bg-sinalizacao font-display text-base font-medium text-tinta"
          >
            Novo lead
          </Link>
        </div>
      </div>
    </main>
  );
}
