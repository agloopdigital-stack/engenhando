import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enviarEmail } from "@/lib/crm/email";
import { diasAteVencimento, ROTULOS_TIPO_DOCUMENTO } from "@/lib/alvaras/rotulos";
import type { TipoDocumentoObra } from "@/lib/types";

const ANTECEDENCIAS = [30, 15, 5] as const;

// Roda 1x/dia. Para cada documento com vencimento em exatamente 30, 15 ou
// 5 dias, garante que existe o registro do alerta correspondente e, se
// ainda não foi disparado, notifica os usuários da conta da obra.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: documentos } = await supabase
    .from("documentos_obra")
    .select("*, obras(nome, conta_id)")
    .gte("data_vencimento", new Date().toISOString().slice(0, 10));

  let disparados = 0;

  for (const doc of documentos ?? []) {
    const dias = diasAteVencimento(doc.data_vencimento);
    const antecedencia = ANTECEDENCIAS.find((a) => a === dias);
    if (!antecedencia) continue;

    const { data: alertaExistente } = await supabase
      .from("alertas_documento")
      .select("id, disparado")
      .eq("documento_id", doc.id)
      .eq("antecedencia_dias", antecedencia)
      .maybeSingle();

    if (alertaExistente?.disparado) continue;

    const obra = doc.obras as unknown as { nome: string; conta_id: string };

    const { data: usuariosDaConta } = await supabase
      .from("usuarios")
      .select("id")
      .eq("conta_id", obra.conta_id);

    for (const usuario of usuariosDaConta ?? []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(usuario.id);
      const email = authUser.user?.email;
      if (!email) continue;

      await enviarEmail(
        email,
        `Documento vencendo em ${antecedencia} dias — ${obra.nome}`,
        `O ${ROTULOS_TIPO_DOCUMENTO[doc.tipo as TipoDocumentoObra]} da obra "${obra.nome}" vence em ${antecedencia} dias (${doc.data_vencimento}).`
      );
    }

    await supabase.from("alertas_documento").upsert(
      {
        documento_id: doc.id,
        antecedencia_dias: antecedencia,
        disparado: true,
        disparado_em: new Date().toISOString(),
      },
      { onConflict: "documento_id,antecedencia_dias" }
    );

    disparados++;
  }

  return NextResponse.json({ disparados });
}
