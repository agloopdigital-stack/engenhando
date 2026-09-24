import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardObraPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const supabase = await createClient();

  const { data: obra } = await supabase.from("obras").select("*").eq("id", obraId).single();

  const { data: rdos } = await supabase
    .from("rdos")
    .select("*, registros_dia(data)")
    .eq("obra_id", obraId)
    .order("gerado_em", { ascending: false });

  return (
    <div className="min-h-full bg-concreto-100 pb-10 md:min-h-dvh">
      <header className="border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <p className="text-sm text-concreto-300">Painel da obra</p>
        <h1 className="font-display text-xl">{obra?.nome ?? "Obra"}</h1>
        {obra?.endereco && <p className="text-sm text-concreto-300">{obra.endereco}</p>}
      </header>

      <div className="flex justify-end px-4 pt-4">
        <Link
          href={`/obras/${obraId}/captura`}
          className="text-sm font-medium text-projeto-700 underline"
        >
          Ir para captação
        </Link>
      </div>

      <ul className="flex flex-col gap-3 px-4 pt-4">
        {(!rdos || rdos.length === 0) && (
          <p className="mt-8 text-center text-tinta-suave">
            Nenhum RDO gerado ainda. Feche o primeiro dia na tela de captação.
          </p>
        )}

        {rdos?.map((rdo) => (
          <li
            key={rdo.id}
            className="flex items-center justify-between rounded-2xl border border-concreto-300 bg-white p-4"
          >
            <div>
              <p className="font-display font-medium">
                {new Date(
                  (rdo.registros_dia as unknown as { data: string })?.data
                ).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </p>
              <p className="text-sm text-tinta-suave">
                {rotuloStatus(rdo.status as string)}
              </p>
            </div>

            {rdo.pdf_url && (
              <a
                href={rdo.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="touch-target flex items-center rounded-xl bg-projeto-700 px-4 font-display text-sm font-medium text-white"
              >
                Ver PDF
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function rotuloStatus(status: string) {
  if (status === "gerado" || status === "enviado") return "RDO pronto";
  if (status === "processando") return "Processando...";
  return "Rascunho";
}
