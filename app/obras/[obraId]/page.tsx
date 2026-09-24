import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Obra } from "@/lib/types";

const ROTULO: Record<Obra["status"], string> = {
  ativa: "Em campo",
  pausada: "Pausada",
  concluida: "Concluída",
};

export default async function ObraPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("obras").select("*").eq("id", obraId).single();
  const obra = data as Obra | null;

  if (!obra) notFound();

  const portas = [
    {
      href: `/obras/${obra.id}/captura`,
      titulo: "Registro do dia",
      texto: "Áudio, foto e nota só desta obra.",
    },
    {
      href: `/obras/${obra.id}/documentos`,
      titulo: "Documentos",
      texto: "Alvarás e licenças desta obra.",
    },
    {
      href: `/obras/${obra.id}/financeiro`,
      titulo: "Financeiro",
      texto: "Orçado e gastos desta obra.",
    },
    {
      href: `/obras/${obra.id}/mao-de-obra`,
      titulo: "Equipe",
      texto: "Presença e vales desta obra.",
    },
    {
      href: `/obras/${obra.id}/dashboard`,
      titulo: "Painel",
      texto: "RDOs gerados desta obra.",
    },
  ];

  return (
    <div className="min-h-full bg-concreto-100 md:min-h-dvh">
      <header className="border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <Link href="/obras" className="text-sm text-concreto-300">
          Obras
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="font-display text-xl leading-tight">{obra.nome}</h1>
          <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-xs">
            {ROTULO[obra.status]}
          </span>
        </div>
        {obra.cliente_nome && <p className="mt-1 text-sm">{obra.cliente_nome}</p>}
        {obra.endereco && <p className="text-sm text-concreto-300">{obra.endereco}</p>}
      </header>

      <div className="flex flex-col gap-3 px-4 py-4">
        <Link
          href={portas[0].href}
          className="touch-target flex items-center justify-center rounded-2xl bg-sinalizacao px-4 font-display text-lg font-medium"
        >
          Registrar agora
        </Link>

        <ul className="flex flex-col gap-2">
          {portas.slice(1).map((porta) => (
            <li key={porta.href}>
              <Link
                href={porta.href}
                className="block rounded-2xl border border-concreto-300 bg-white p-4"
              >
                <p className="font-display font-medium">{porta.titulo}</p>
                <p className="text-sm text-tinta-suave">{porta.texto}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
