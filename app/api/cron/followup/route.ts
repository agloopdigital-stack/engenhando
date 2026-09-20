import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enviarEmail } from "@/lib/crm/email";

// Roda 1x/dia (ver vercel.json). Verifica cada automação de follow-up
// ainda não executada; se já passou o prazo (dias_apos_envio desde o
// envio da proposta), tenta notificar e marca o lead como follow_up.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: automacoes } = await supabase
    .from("automacoes_followup")
    .select("*, propostas(enviada_em, lead_id, leads(nome, contato, conta_id, contas(nome)))")
    .eq("executada", false);

  let processadas = 0;

  for (const automacao of automacoes ?? []) {
    const proposta = automacao.propostas as unknown as {
      enviada_em: string | null;
      lead_id: string;
      leads: { nome: string; contato: string | null; conta_id: string; contas: { nome: string } };
    };

    if (!proposta?.enviada_em) continue;

    const diasPassados =
      (Date.now() - new Date(proposta.enviada_em).getTime()) / (1000 * 60 * 60 * 24);
    if (diasPassados < automacao.dias_apos_envio) continue;

    const contatoLead = proposta.leads.contato;
    if (contatoLead?.includes("@")) {
      await enviarEmail(
        contatoLead,
        `Follow-up: proposta de ${proposta.leads.contas.nome}`,
        `Olá ${proposta.leads.nome}, gostaríamos de saber se você teve a chance de avaliar nossa proposta. Ficamos à disposição para qualquer dúvida.`
      );
    }

    await supabase
      .from("leads")
      .update({ estagio: "follow_up" })
      .eq("id", proposta.lead_id)
      .eq("estagio", "proposta_enviada");

    await supabase
      .from("automacoes_followup")
      .update({ executada: true, executada_em: new Date().toISOString() })
      .eq("id", automacao.id);

    processadas++;
  }

  return NextResponse.json({ processadas });
}
