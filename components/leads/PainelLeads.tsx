"use client";

import { useEffect, useState } from "react";
import type { LeadLista } from "@/lib/crm/funil";
import { ListaLeads } from "./ListaLeads";
import { QuadroLeads } from "./QuadroLeads";

type Visao = "lista" | "quadro";

const CHAVE_VISAO = "engenhando.leads.visao";

export function PainelLeads({ leadsIniciais }: { leadsIniciais: LeadLista[] }) {
  const [leads, setLeads] = useState(leadsIniciais);
  const [visao, setVisao] = useState<Visao>("lista");

  useEffect(() => {
    const salva = localStorage.getItem(CHAVE_VISAO);
    if (salva === "lista" || salva === "quadro") {
      setVisao(salva);
    } else if (window.matchMedia("(min-width: 768px)").matches) {
      setVisao("quadro");
    }
  }, []);

  function escolher(proxima: Visao) {
    setVisao(proxima);
    localStorage.setItem(CHAVE_VISAO, proxima);
  }

  return (
    <div className={`mx-auto flex w-full flex-col gap-4 pb-6 ${visao === "quadro" ? "max-w-none" : "max-w-3xl"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl">Leads</h1>
          <p className="mt-1 text-sm text-tinta-suave">Quem pediu orçamento e quem está esperando retorno.</p>
        </div>
        <div role="group" aria-label="Visão" className="flex shrink-0 overflow-hidden rounded-xl border border-concreto-300 bg-white">
          {(["lista", "quadro"] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              aria-pressed={visao === opcao}
              onClick={() => escolher(opcao)}
              className={`touch-target px-4 font-display text-sm ${
                visao === opcao ? "bg-projeto-900 text-white" : "text-tinta"
              }`}
            >
              {opcao === "lista" ? "Lista" : "Quadro"}
            </button>
          ))}
        </div>
      </div>

      {visao === "quadro" ? <QuadroLeads leads={leads} setLeads={setLeads} /> : <ListaLeads leads={leads} />}
    </div>
  );
}
