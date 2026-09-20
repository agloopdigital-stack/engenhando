import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getContaDoUsuarioLogado } from "@/lib/conta-atual";
import {
  ROTULOS_TIPO_DOCUMENTO,
  calcularStatusVencimento,
  CORES_STATUS,
  ROTULOS_STATUS,
  diasAteVencimento,
} from "@/lib/alvaras/rotulos";
import type { TipoDocumentoObra } from "@/lib/types";

export default async function PainelDocumentosPage() {
  const contaId = await getContaDoUsuarioLogado();
  const supabase = await createClient();

  const { data: obrasDaConta } = contaId
    ? await supabase.from("obras").select("id, nome").eq("conta_id", contaId)
    : { data: [] };

  const idsObras = (obrasDaConta ?? []).map((o) => o.id);

  const { data: documentos } = idsObras.length
    ? await supabase
        .from("documentos_obra")
        .select("*, obras(nome)")
        .in("obra_id", idsObras)
        .order("data_vencimento", { ascending: true })
    : { data: [] };

  const nomesObra = new Map((obrasDaConta ?? []).map((o) => [o.id, o.nome]));

  return (
    <div className="min-h-dvh bg-concreto-100 pb-16">
      <header className="border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <h1 className="font-display text-xl">Documentos — todas as obras</h1>
        <p className="text-sm text-concreto-300">Ordenado pelo mais urgente</p>
      </header>

      <ul className="flex flex-col gap-2 px-4 pt-4">
        {(!documentos || documentos.length === 0) && (
          <p className="mt-8 text-center text-tinta-suave">Nenhum documento cadastrado ainda.</p>
        )}

        {documentos?.map((doc) => {
          const status = calcularStatusVencimento(doc.data_vencimento);
          const dias = diasAteVencimento(doc.data_vencimento);
          const obra = doc.obras as unknown as { nome: string } | null;

          return (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-2xl border border-concreto-300 bg-white p-4"
            >
              <div>
                <p className="font-medium">{ROTULOS_TIPO_DOCUMENTO[doc.tipo as TipoDocumentoObra]}</p>
                <p className="text-sm text-tinta-suave">
                  {obra?.nome ?? nomesObra.get(doc.obra_id)} ·{" "}
                  {new Date(doc.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                  {status !== "ok" && ` · ${dias >= 0 ? `${dias}d restantes` : `${-dias}d atrasado`}`}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-display font-medium text-white"
                style={{ backgroundColor: CORES_STATUS[status] }}
              >
                {ROTULOS_STATUS[status]}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="px-4 pt-6">
        <Link href="/leads" className="text-sm text-projeto-700 underline">
          Ir para Leads
        </Link>
      </div>
    </div>
  );
}
