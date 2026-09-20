import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServiceClient } from "@/lib/supabase/service";
import { transcreverAudio } from "@/lib/rdo/transcricao";
import { organizarResumoDoDia } from "@/lib/rdo/organizar-resumo";
import { DocumentoRdo } from "@/lib/rdo/documento-pdf";
import type { Midia } from "@/lib/types";

// Fecha o dia de uma obra: transcreve os áudios pendentes, organiza tudo
// num resumo estruturado, gera o PDF com a identidade visual da conta e
// sobe pro Storage. Roda inteiro do lado do servidor porque nenhuma
// dessas etapas é coisa que o celular do engenheiro deveria processar.
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: registroDiaId } = await context.params;
  const supabase = createServiceClient();

  const { data: registroDia, error: erroRegistro } = await supabase
    .from("registros_dia")
    .select("*, obras(id, nome, conta_id, contas(nome, logo_url, cor_primaria))")
    .eq("id", registroDiaId)
    .single();

  if (erroRegistro || !registroDia) {
    return NextResponse.json({ erro: "Registro do dia não encontrado." }, { status: 404 });
  }

  await supabase
    .from("rdos")
    .upsert(
      { registro_dia_id: registroDiaId, obra_id: registroDia.obra_id, status: "processando" },
      { onConflict: "registro_dia_id" }
    );

  const { data: midias } = await supabase
    .from("midias")
    .select("*")
    .eq("registro_dia_id", registroDiaId);

  const listaMidias = (midias ?? []) as Midia[];

  // Transcreve áudios que ainda não têm transcrição.
  await Promise.all(
    listaMidias
      .filter((m) => m.tipo === "audio" && !m.transcricao && m.url_storage)
      .map(async (m) => {
        const texto = await transcreverAudio(m.url_storage!);
        if (texto) {
          await supabase.from("midias").update({ transcricao: texto }).eq("id", m.id);
          m.transcricao = texto;
        }
      })
  );

  const resumo = await organizarResumoDoDia(listaMidias);
  const fotos = listaMidias.filter((m) => m.tipo === "foto");

  const obra = registroDia.obras as unknown as {
    nome: string;
    contas: { nome: string; logo_url: string | null; cor_primaria: string | null };
  };

  const bufferPdf = await renderToBuffer(
    <DocumentoRdo
      obraNome={obra.nome}
      data={registroDia.data}
      conta={obra.contas}
      resumo={resumo}
      fotos={fotos}
    />
  );

  const caminhoPdf = `${registroDia.obra_id}/${registroDiaId}/rdo.pdf`;
  await supabase.storage.from("midias").upload(caminhoPdf, bufferPdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  const { data: urlPublica } = supabase.storage.from("midias").getPublicUrl(caminhoPdf);

  await supabase
    .from("rdos")
    .update({
      resumo_estruturado: resumo,
      pdf_url: urlPublica.publicUrl,
      status: "gerado",
      gerado_em: new Date().toISOString(),
    })
    .eq("registro_dia_id", registroDiaId);

  await supabase
    .from("registros_dia")
    .update({ fechado: true, fechado_em: new Date().toISOString() })
    .eq("id", registroDiaId);

  return NextResponse.json({ pdf_url: urlPublica.publicUrl });
}
