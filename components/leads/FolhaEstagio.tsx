"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { ESTAGIOS, type LeadLista } from "@/lib/crm/funil";
import type { EstagioLead } from "@/lib/types";

export function FolhaEstagio({
  lead,
  abrindoObra,
  onEscolher,
  onAbrirObra,
  onFechar,
}: {
  lead: LeadLista;
  abrindoObra: boolean;
  onEscolher: (estagio: EstagioLead) => void;
  onAbrirObra: () => void;
  onFechar: () => void;
}) {
  const tituloId = useId();
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    painel.current?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/40 md:items-center" onClick={onFechar}>
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none md:rounded-2xl"
      >
        <h2 id={tituloId} className="font-display text-lg">
          {lead.nome}
        </h2>
        <p className="mt-1 text-sm text-tinta-suave">Mover para</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {ESTAGIOS.map((estagio) => (
            <button
              key={estagio.chave}
              type="button"
              aria-pressed={lead.estagio === estagio.chave}
              onClick={() => onEscolher(estagio.chave)}
              className={`touch-target rounded-xl border px-3 font-display text-sm ${
                lead.estagio === estagio.chave
                  ? "border-projeto-900 bg-projeto-900 text-white"
                  : "border-concreto-300 bg-white text-tinta"
              }`}
            >
              {estagio.rotulo}
            </button>
          ))}
        </div>

        {lead.estagio === "fechado" && !lead.obraRelacionada && (
          <button
            type="button"
            disabled={abrindoObra}
            onClick={onAbrirObra}
            className="touch-target mt-3 w-full rounded-xl bg-projeto-700 font-display text-sm font-medium text-white disabled:opacity-50"
          >
            {abrindoObra ? "Abrindo obra..." : "Abrir obra"}
          </button>
        )}

        <div className="mt-3 flex gap-2">
          <Link
            href={`/leads/${lead.id}`}
            className="touch-target flex flex-1 items-center justify-center rounded-xl border border-concreto-300 font-display text-sm"
          >
            Abrir lead
          </Link>
          <button
            type="button"
            onClick={onFechar}
            className="touch-target flex-1 rounded-xl border border-concreto-300 font-display text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
