import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getContaDoUsuarioLogado } from "@/lib/conta-atual";
import { paraLeadLista } from "@/lib/crm/funil";
import { ListaLeads } from "@/components/leads/ListaLeads";
import type { EstagioLead } from "@/lib/types";

type LinhaLead = {
  id: string;
  nome: string;
  contato: string | null;
  whatsapp: string | null;
  email: string | null;
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
          "id, nome, contato, whatsapp, email, estagio, criado_em, tipos_servico(nome), propostas(id, status, enviada_em, valor, prazo_dias, pdf_url, escopo, criado_em)"
        )
        .eq("conta_id", contaId)
    : { data: [] as LinhaLead[] };

  const leads = ((data ?? []) as unknown as LinhaLead[]).map(paraLeadLista);

  return (
    <main className="min-h-full bg-concreto-100 px-4 py-6 md:min-h-dvh">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-28">
        <div>
          <h1 className="font-display text-xl">Leads</h1>
          <p className="mt-1 text-sm text-tinta-suave">Quem pediu orçamento e quem está esperando retorno.</p>
        </div>
        <ListaLeads leads={leads} />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-concreto-300 bg-concreto-100 px-4 py-3">
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
