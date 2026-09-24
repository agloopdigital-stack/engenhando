import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getContaDoUsuarioLogado } from "@/lib/conta-atual";
import type { Obra } from "@/lib/types";

const ROTULO: Record<Obra["status"], string> = {
  ativa: "Em campo",
  pausada: "Pausada",
  concluida: "Concluída",
};

const ORDEM: Record<Obra["status"], number> = {
  ativa: 0,
  pausada: 1,
  concluida: 2,
};

export default async function ObrasPage() {
  const contaId = await getContaDoUsuarioLogado();
  const supabase = await createClient();

  const { data } = contaId
    ? await supabase.from("obras").select("*").eq("conta_id", contaId)
    : { data: [] as Obra[] };

  const obras = ((data ?? []) as Obra[]).sort(
    (a, b) => ORDEM[a.status] - ORDEM[b.status] || a.nome.localeCompare(b.nome, "pt-BR")
  );

  return (
    <div className="min-h-full bg-concreto-100 md:min-h-dvh">
      <header className="flex items-center justify-between border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <div>
          <h1 className="font-display text-xl">Obras</h1>
          <p className="text-sm text-concreto-300">Cada obra guarda os próprios registros.</p>
        </div>
        <Link
          href="/obras/nova"
          className="touch-target flex items-center rounded-xl bg-sinalizacao px-4 font-display text-sm font-medium"
        >
          Nova obra
        </Link>
      </header>

      {obras.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="font-display text-lg">Nenhuma obra ainda</p>
          <p className="max-w-xs text-sm text-tinta-suave">
            Cadastre a obra primeiro. Documento, caixa, equipe e registro do dia ficam ligados a ela.
          </p>
          <Link
            href="/obras/nova"
            className="touch-target mt-2 flex items-center rounded-xl bg-sinalizacao px-5 font-display font-medium"
          >
            Registrar obra
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 px-4 py-4">
          {obras.map((obra) => (
            <li key={obra.id}>
              <Link
                href={`/obras/${obra.id}`}
                className="block rounded-2xl border border-concreto-300 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-lg leading-tight">{obra.nome}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                      obra.status === "ativa"
                        ? "bg-concluido/10 text-concluido"
                        : obra.status === "pausada"
                          ? "bg-alerta/10 text-alerta"
                          : "bg-concreto-200 text-tinta-suave"
                    }`}
                  >
                    {ROTULO[obra.status]}
                  </span>
                </div>
                {obra.cliente_nome && (
                  <p className="mt-1 text-sm text-tinta">{obra.cliente_nome}</p>
                )}
                {obra.endereco && <p className="text-sm text-tinta-suave">{obra.endereco}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
