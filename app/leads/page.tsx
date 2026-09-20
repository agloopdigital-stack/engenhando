import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getContaDoUsuarioLogado } from "@/lib/conta-atual";
import type { Lead } from "@/lib/types";

const ESTAGIOS: { chave: Lead["estagio"]; rotulo: string }[] = [
  { chave: "novo", rotulo: "Novo" },
  { chave: "proposta_enviada", rotulo: "Proposta enviada" },
  { chave: "follow_up", rotulo: "Follow-up" },
  { chave: "fechado", rotulo: "Fechado" },
  { chave: "perdido", rotulo: "Perdido" },
];

export default async function LeadsPage() {
  const contaId = await getContaDoUsuarioLogado();
  const supabase = await createClient();

  const { data: leads } = contaId
    ? await supabase
        .from("leads")
        .select("*")
        .eq("conta_id", contaId)
        .order("criado_em", { ascending: false })
    : { data: [] as Lead[] };

  const porEstagio = (chave: Lead["estagio"]) => (leads ?? []).filter((l) => l.estagio === chave);

  return (
    <div className="min-h-dvh bg-concreto-100 pb-24">
      <header className="flex items-center justify-between border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <h1 className="font-display text-xl">Leads</h1>
        <Link
          href="/leads/novo"
          className="touch-target flex items-center rounded-xl bg-sinalizacao px-4 font-display text-sm font-medium"
        >
          + Novo lead
        </Link>
      </header>

      <div className="flex flex-col gap-6 px-4 pt-4">
        {ESTAGIOS.map(({ chave, rotulo }) => {
          const doGrupo = porEstagio(chave);
          if (doGrupo.length === 0) return null;

          return (
            <section key={chave}>
              <h2 className="mb-2 font-display text-sm font-medium uppercase tracking-wide text-tinta-suave">
                {rotulo} · {doGrupo.length}
              </h2>
              <ul className="flex flex-col gap-2">
                {doGrupo.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex items-center justify-between rounded-2xl border border-concreto-300 bg-white p-4"
                    >
                      <div>
                        <p className="font-medium text-tinta">{lead.nome}</p>
                        {lead.contato && (
                          <p className="text-sm text-tinta-suave">{lead.contato}</p>
                        )}
                      </div>
                      <span className="text-projeto-700">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {(!leads || leads.length === 0) && (
          <p className="mt-8 text-center text-tinta-suave">
            Nenhum lead cadastrado ainda. Toque em &quot;+ Novo lead&quot; pra começar.
          </p>
        )}
      </div>
    </div>
  );
}
