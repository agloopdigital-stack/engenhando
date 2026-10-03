import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServiceClient } from "@/lib/supabase/service";
import { preencherTemplate } from "@/lib/crm/preencher-template";
import { DocumentoProposta } from "@/lib/crm/documento-proposta-pdf";
import { identidadeDocumento, valoresTemplateEmpresa } from "@/lib/documentos/identidade";
import type { PerfilEmpresa } from "@/lib/types";

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

  const { data: perfil } = await supabase
    .from("perfis_empresa")
    .select("*")
    .eq("conta_id", lead.conta_id)
    .maybeSingle();

  const identidade = identidadeDocumento(lead.contas, (perfil as PerfilEmpresa | null) ?? null);
  const corpoPreenchido = preencherTemplate(template?.corpo_template ?? "", {
    ...((proposta.valores_preenchidos as Record<string, string> | null) ?? {}),
    ...valoresTemplateEmpresa(identidade),
  });

  const bufferPdf = await renderToBuffer(
    <DocumentoProposta clienteNome={lead.nome} corpo={corpoPreenchido} identidade={identidade} />
  );

  const caminhoPdf = `propostas/${lead.conta_id}/${propostaId}.pdf`;
  const { error: erroUpload } = await supabase.storage
    .from("midias")
    .upload(caminhoPdf, bufferPdf, { contentType: "application/pdf", upsert: true });

  if (erroUpload) {
    return NextResponse.json({ erro: "Não consegui guardar o PDF." }, { status: 500 });
  }

  const { data: urlPublica } = supabase.storage.from("midias").getPublicUrl(caminhoPdf);

  await supabase.from("propostas").update({ pdf_url: urlPublica.publicUrl }).eq("id", propostaId);

  return NextResponse.json({ pdf_url: urlPublica.publicUrl });
}
