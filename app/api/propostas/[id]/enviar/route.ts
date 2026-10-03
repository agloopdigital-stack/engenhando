import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DIAS_FOLLOWUP } from "@/lib/crm/funil";

// O envio em si acontece na tela. Esta rota só arma o follow-up de 3 dias,
// com a chave de serviço, depois que a proposta já tem PDF.
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: propostaId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { data: proposta } = await supabase
    .from("propostas")
    .select("id, pdf_url, lead_id, leads(conta_id)")
    .eq("id", propostaId)
    .maybeSingle();

  const lead = proposta?.leads as unknown as { conta_id: string } | null;
  if (!proposta?.pdf_url || !lead) {
    return NextResponse.json({ erro: "Proposta não encontrada." }, { status: 404 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ agendado: false });
  }

  const servico = createServiceClient();
  const { data: existente } = await servico
    .from("automacoes_followup")
    .select("id")
    .eq("proposta_id", propostaId)
    .eq("executada", false)
    .maybeSingle();

  if (!existente) {
    await servico.from("automacoes_followup").insert({
      conta_id: lead.conta_id,
      proposta_id: propostaId,
      dias_apos_envio: DIAS_FOLLOWUP,
    });
  }

  return NextResponse.json({ agendado: true });
}
