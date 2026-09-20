import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServiceClient } from "@/lib/supabase/service";
import { preencherTemplate } from "@/lib/crm/preencher-template";
import { DocumentoProposta } from "@/lib/crm/documento-proposta-pdf";

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: propostaId } = await context.params;
  const supabase = createServiceClient();

  const { data: proposta, error } = await supabase
    .from("propostas")
    .select("*, templates_proposta(corpo_template), leads(nome, conta_id, contas(nome, logo_url, cor_primaria))")
    .eq("id", propostaId)
    .single();

  if (error || !proposta) {
    return NextResponse.json({ erro: "Proposta não encontrada." }, { status: 404 });
  }

  const template = proposta.templates_proposta as unknown as { corpo_template: string } | null;
  const lead = proposta.leads as unknown as {
    nome: string;
    conta_id: string;
    contas: { nome: string; logo_url: string | null; cor_primaria: string | null };
  };

  const corpoPreenchido = preencherTemplate(
    template?.corpo_template ?? "",
    proposta.valores_preenchidos as Record<string, string>
  );

  const bufferPdf = await renderToBuffer(
    <DocumentoProposta clienteNome={lead.nome} corpo={corpoPreenchido} conta={lead.contas} />
  );

  const caminhoPdf = `propostas/${lead.conta_id}/${propostaId}.pdf`;
  await supabase.storage
    .from("midias")
    .upload(caminhoPdf, bufferPdf, { contentType: "application/pdf", upsert: true });
  const { data: urlPublica } = supabase.storage.from("midias").getPublicUrl(caminhoPdf);

  await supabase
    .from("propostas")
    .update({ pdf_url: urlPublica.publicUrl, status: "enviada", enviada_em: new Date().toISOString() })
    .eq("id", propostaId);

  await supabase.from("leads").update({ estagio: "proposta_enviada" }).eq("id", lead ? proposta.lead_id : "");

  await supabase.from("automacoes_followup").insert({
    conta_id: lead.conta_id,
    proposta_id: propostaId,
    dias_apos_envio: 3,
  });

  return NextResponse.json({ pdf_url: urlPublica.publicUrl });
}
